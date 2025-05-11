// File: src/components/DashboardIOT/PredictionChart/index.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ComposedChart, Cell,
    Label,
    ReferenceLine
} from 'recharts';
import {
    WeatherData,
    RadarChartData,
} from 'src/types/predictdata';
import usePredictData, { ForecastWeatherData, ComfortData } from '@/hooks/usePredictData';
import { useAdafruitData } from '@/hooks/useEnvironmentData';

// --- Helper Functions for Comfort Display ---

// Get comfort level text
const getComfortLevelText = (score: number): string => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Very Good";
    if (score >= 60) return "Good";
    if (score >= 45) return "Moderate";
    if (score >= 30) return "Poor";
    return "Very Poor";
};

// Get comfort color
const getComfortColor = (score: number): string => {
    if (score >= 90) return "#4CAF50"; // Green
    if (score >= 75) return "#8BC34A"; // Light Green
    if (score >= 60) return "#CDDC39"; // Lime Green
    if (score >= 45) return "#FFC107"; // Amber
    if (score >= 30) return "#FF9800"; // Orange
    return "#F44336"; // Red
};

// Format date to more readable format
const formatDateLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
        month: 'short',
        day: 'numeric'
    });
};

// Custom tooltip formatter for charts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 border border-gray-200 rounded shadow-md">
                <p className="font-semibold text-gray-800">{formatDateLabel(label)}</p>
                {payload.map((item: any, index: number) => (
                    <p key={index} style={{ color: item.color }}>
                        {item.name}: {item.value?.toFixed(1) || 'N/A'} {item.unit || ''}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Radar chart data formatter - accepts WeatherData or null
const formatRadarData = (current: WeatherData | null, adafruitData: any): RadarChartData[] => {
    // If we have adafruitData, prioritize using that for the available fields
    const temperature = adafruitData?.temperature !== undefined ? adafruitData.temperature : (current?.temperature || 0);
    const humidity = adafruitData?.humidity !== undefined ? adafruitData.humidity : (current?.humidity || 0);
    const light = adafruitData?.brightness !== undefined ? adafruitData.brightness : (current?.light || 0);
    
    // Ensure we have valid values to work with
    const validTemperature = typeof temperature === 'number' ? temperature : 0;
    const validHumidity = typeof humidity === 'number' ? humidity : 0;
    const validLight = typeof light === 'number' ? light : 0;

    return [
        { subject: 'Temperature', A: validTemperature / 40 * 100, fullMark: 100 }, // Scale temp to 0-100
        { subject: 'Humidity', A: validHumidity, fullMark: 100 },
        { subject: 'Pressure', A: current?.pressure ? (current.pressure - 980) / 70 * 100 : 0, fullMark: 100 }, // Scale pressure (example range 980-1050)
        { subject: 'Wind Speed', A: current?.windSpeed ? current.windSpeed / 30 * 100 : 0, fullMark: 100 }, // Scale wind speed (example max 30)
        { subject: 'Light', A: validLight, fullMark: 100 },
        { subject: 'Comfort', A: current?.comfortScore ?? 0, fullMark: 100 },
    ];
};

// Calculate average comfort score
const calculateAverageComfort = (comfortData: ComfortData[]): number => {
    if (!comfortData.length) return 0;

    const validScores = comfortData
        .map(item => item.comfortScore)
        .filter((score): score is number => score !== null && score !== undefined);

    if (!validScores.length) return 0;

    return validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
};

// Calculate comfort score based on temp and humidity
// This is a simple formula for demo purposes
const calculateComfortScore = (temperature: number, humidity: number): number => {
    // Best comfort: temp around 22-25°C and humidity 40-60%
    // Higher or lower values reduce comfort
    const tempFactor = 100 - Math.abs(temperature - 23.5) * 5;
    const humidityFactor = 100 - Math.abs(humidity - 50) * 1.2;
    
    // Combine factors with weight (temp is more important than humidity)
    const score = (tempFactor * 0.6) + (humidityFactor * 0.4);
    
    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, score));
};

// --- Main Dashboard Component ---

const PredictionChart = () => {
    const [forecastDays, setForecastDays] = useState(7);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Get Adafruit data
    const { data: adafruitData, isLoading: isAdafruitLoading, error: adafruitError } = useAdafruitData();
    
    const {
        weatherData,
        comfortData,
        currentConditions,
        loading,
        error,
        fetchForecastData,
        fetchCurrentConditions
    } = usePredictData(forecastDays);

    // Create a merged current conditions object that prioritizes Adafruit data
    const mergedCurrentConditions = useMemo(() => {
        if (!currentConditions && !adafruitData) return null;

        // Start with the currentConditions data
        const baseConditions = currentConditions ? { ...currentConditions } : {
            date: new Date().toISOString(),
            temperature: null,
            humidity: null,
            pressure: null,
            windSpeed: null,
            light: null,
            comfortScore: null
        };

        // Override with Adafruit data if available
        if (adafruitData) {
            if (adafruitData.temperature !== undefined) {
                baseConditions.temperature = adafruitData.temperature;
            }
            
            if (adafruitData.humidity !== undefined) {
                baseConditions.humidity = adafruitData.humidity;
            }
            
            if (adafruitData.brightness !== undefined) {
                baseConditions.light = adafruitData.brightness;
            }

            // Calculate comfort score if we have both temperature and humidity
            if (adafruitData.temperature !== undefined && adafruitData.humidity !== undefined) {
                baseConditions.comfortScore = calculateComfortScore(
                    adafruitData.temperature, 
                    adafruitData.humidity
                );
            }
        }

        return baseConditions;
    }, [currentConditions, adafruitData]);

    // Memoize combined data for the composed chart
    // Combines forecast weather and comfort data based on date
    const combinedData = useMemo(() => {
        // Find the corresponding comfort data for each weather data point
        return weatherData.map(weatherItem => {
            const correspondingComfort = comfortData.find(
                comfortItem => comfortItem.date === weatherItem.date
            );
            return {
                ...weatherItem,
                date: formatDateLabel(weatherItem.date),
                comfortScore: correspondingComfort?.comfortScore ?? 0 // Use ?? 0 for default if not found
            };
        });
    }, [weatherData, comfortData]); // Re-calculate only when weatherData or comfortData changes

    // Format weather data with better date labels
    const formattedWeatherData = useMemo(() => {
        return weatherData.map(item => ({
            ...item,
            date: formatDateLabel(item.date)
        }));
    }, [weatherData]);

    // Format comfort data with better date labels
    const formattedComfortData = useMemo(() => {
        return comfortData.map(item => ({
            ...item,
            date: formatDateLabel(item.date)
        }));
    }, [comfortData]);

    const comfortZones = [
        { y: 90, label: 'Excellent', color: '#4CAF50' },
        { y: 75, label: 'Very Good', color: '#8BC34A' },
        { y: 60, label: 'Good', color: '#CDDC39' },
        { y: 45, label: 'Moderate', color: '#FFC107' },
        { y: 30, label: 'Poor', color: '#FF9800' },
        { y: 0, label: 'Very Poor', color: '#F44336' }
    ];

    // Calculate average comfort score
    const averageComfort = useMemo(() => {
        return calculateAverageComfort(comfortData);
    }, [comfortData]);

    // Memoize radar data for efficiency, using current and Adafruit data
    const radarData = useMemo(() => {
        return formatRadarData(currentConditions, adafruitData);
    }, [currentConditions, adafruitData]); // Re-calculate when either changes

    // Re-fetch forecast data when the forecast days change
    useEffect(() => {
        fetchForecastData(forecastDays);
    }, [forecastDays, fetchForecastData]);

    // Handle forecast days change
    const handleForecastDaysChange = (days: number) => {
        setForecastDays(days);
    };

    // Refresh all data with loading indicator
    const refreshAllData = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                fetchCurrentConditions(),
                fetchForecastData(forecastDays)
            ]);
        } catch (err) {
            console.error("Error refreshing data:", err);
        } finally {
            setIsRefreshing(false);
        }
    }, [fetchCurrentConditions, fetchForecastData, forecastDays]);

    // Loading spinner component
    const LoadingSpinner = () => (
        <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
    );

    // Prepare data for comfort analysis charts
    const prepareComfortAnalysisData = (data: ComfortData[]) => {
        return {
            temperature: data.map((item, index) => ({
                id: `temp-${index}`,
                category: 'temperature',
                x: item.temperature || 0,
                y: item.comfortScore || 0
            })),
            humidity: data.map((item, index) => ({
                id: `hum-${index}`,
                category: 'humidity',
                x: item.humidity || 0,
                y: item.comfortScore || 0
            })),
            light: data.map((item, index) => ({
                id: `light-${index}`,
                category: 'light',
                x: item.light || 0,
                y: item.comfortScore || 0
            }))
        };
    };


    const ComfortTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const comfortColor = getComfortColor(data.y);
            
            let xLabel = '';
            let xUnit = '';
            
            if (data.category === 'temperature') {
                xLabel = 'Nhiệt độ';
                xUnit = '°C';
            } else if (data.category === 'humidity') {
                xLabel = 'Độ ẩm';
                xUnit = '%';
            } else {
                xLabel = 'Ánh sáng';
                xUnit = '/100';
            }
            
            return (
                <div className="bg-white p-2 border border-gray-200 rounded shadow">
                    <p className="font-bold text-gray-800">Độ thoải mái: <span style={{ color: comfortColor }}>{data.y}/100</span></p>
                    <p className="text-gray-700">{xLabel}: {data.x}{xUnit}</p>
                </div>
            );
        }
        return null;
    };

    // Handle initial loading state
    if (loading && !mergedCurrentConditions) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <LoadingSpinner />
                <div className="mt-4 text-xl text-gray-600">Đang tải dữ liệu...</div>
            </div>
        );
    }

    // Handle error state
    if (error && !adafruitData) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <div className="text-xl text-red-600 mb-4">Lỗi: {error}</div>
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    onClick={refreshAllData}
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col p-4 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-blue-800">Dự báo Thời tiết & Độ Thoải mái</h1>

            {/* Current Conditions - Now with Adafruit data priority */}
            {mergedCurrentConditions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-3 text-blue-700">Điều kiện hiện tại</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Nhiệt độ</div>
                                <div className="text-2xl font-bold">
                                    {mergedCurrentConditions.temperature !== null && 
                                     mergedCurrentConditions.temperature !== undefined 
                                     ? `${mergedCurrentConditions.temperature.toFixed(1)}°C` 
                                     : '—'}
                                    {adafruitData?.temperature !== undefined && (
                                        <span className="text-xs text-green-600 ml-2">(Adafruit)</span>
                                    )}
                                </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Độ ẩm</div>
                                <div className="text-2xl font-bold">
                                    {mergedCurrentConditions.humidity !== null && 
                                     mergedCurrentConditions.humidity !== undefined 
                                     ? `${mergedCurrentConditions.humidity.toFixed(1)}%` 
                                     : '—'}
                                    {adafruitData?.humidity !== undefined && (
                                        <span className="text-xs text-green-600 ml-2">(Adafruit)</span>
                                    )}
                                </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Áp suất</div>
                                <div className="text-2xl font-bold">
                                    {mergedCurrentConditions.pressure?.toFixed(1) || '—'} hPa
                                </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Tốc độ gió</div>
                                <div className="text-2xl font-bold">
                                    {mergedCurrentConditions.windSpeed?.toFixed(1) || '—'} km/h
                                </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Ánh sáng</div>
                                <div className="text-2xl font-bold">
                                    {mergedCurrentConditions.light !== null && 
                                     mergedCurrentConditions.light !== undefined 
                                     ? `${mergedCurrentConditions.light.toFixed(1)}/100` 
                                     : '—'}
                                    {adafruitData?.brightness !== undefined && (
                                        <span className="text-xs text-green-600 ml-2">(Adafruit)</span>
                                    )}
                                </div>
                            </div>
                            {mergedCurrentConditions.comfortScore !== null && mergedCurrentConditions.comfortScore !== undefined && (
                                <div className="p-3 rounded-md" style={{ backgroundColor: `${getComfortColor(mergedCurrentConditions.comfortScore)}20` }}>
                                    <div className="text-sm text-gray-600">Độ thoải mái</div>
                                    <div className="text-2xl font-bold" style={{ color: getComfortColor(mergedCurrentConditions.comfortScore) }}>
                                        {mergedCurrentConditions.comfortScore.toFixed(1)}/100
                                    </div>
                                    <div className="text-sm font-medium" style={{ color: getComfortColor(mergedCurrentConditions.comfortScore) }}>
                                        {getComfortLevelText(mergedCurrentConditions.comfortScore)}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500">
                            {adafruitData && (
                                <div className="mb-1">
                                    Dữ liệu Adafruit cập nhật: {new Date(adafruitData.lastUpdated).toLocaleTimeString()}
                                </div>
                            )}
                            <div>
                                Cập nhật lần cuối: {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-3 text-blue-700">Phân tích điều kiện</h2>
                        <div className="h-64">
                            {radarData && radarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart outerRadius={90} data={radarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                        <Radar name="Điều kiện" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <LoadingSpinner />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Summary Card */}
            {comfortData.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-semibold mb-3 text-blue-700">Tổng quan dự báo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 rounded-md bg-blue-50">
                            <div className="text-sm text-gray-600">Nhiệt độ trung bình</div>
                            <div className="text-2xl font-bold text-blue-700">
                                {weatherData.reduce((sum, item) => sum + (item.temperature || 0), 0) /
                                    weatherData.filter(item => item.temperature !== null).length}°C
                            </div>
                        </div>
                        <div className="p-3 rounded-md bg-blue-50">
                            <div className="text-sm text-gray-600">Độ ẩm trung bình</div>
                            <div className="text-2xl font-bold text-blue-700">
                                {weatherData.reduce((sum, item) => sum + (item.humidity || 0), 0) /
                                    weatherData.filter(item => item.humidity !== null).length}%
                            </div>
                        </div>
                        <div className="p-3 rounded-md" style={{ backgroundColor: `${getComfortColor(averageComfort)}20` }}>
                            <div className="text-sm text-gray-600">Độ thoải mái trung bình</div>
                            <div className="text-2xl font-bold" style={{ color: getComfortColor(averageComfort) }}>
                                {averageComfort.toFixed(1)}/100
                            </div>
                            <div className="text-sm font-medium" style={{ color: getComfortColor(averageComfort) }}>
                                {getComfortLevelText(averageComfort)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Forecast Controls */}
            <div className="mb-4 flex items-center flex-wrap">
                <span className="mr-2 text-gray-700">Dự báo trong:</span>
                <select
                    className="p-2 border rounded-md"
                    value={forecastDays}
                    onChange={(e) => handleForecastDaysChange(parseInt(e.target.value))}
                    disabled={isRefreshing}
                >
                    <option value="3">3 ngày</option>
                    <option value="7">7 ngày</option>
                    <option value="14">14 ngày</option>
                </select>
                <button
                    className={`ml-4 px-4 py-2 ${isRefreshing ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-md flex items-center`}
                    onClick={refreshAllData}
                    disabled={isRefreshing}
                >
                    {isRefreshing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang tải...
                        </>
                    ) : (
                        'Làm mới dữ liệu'
                    )}
                </button>
            </div>

            {/* Weather Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-3 text-blue-700">Dự báo nhiệt độ</h2>
                    <div className="h-64">
                        {formattedWeatherData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={formattedWeatherData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis domain={[10, 40]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="temperature"
                                        stroke="#FF5722"
                                        name="Nhiệt độ"
                                        unit="°C"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6, stroke: '#FF5722', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : loading ? (
                            <LoadingSpinner />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Không có dữ liệu dự báo
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-3 text-blue-700">Dự báo độ ẩm</h2>
                    <div className="h-64">
                        {formattedWeatherData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={formattedWeatherData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="humidity"
                                        stroke="#2196F3"
                                        name="Độ ẩm"
                                        unit="%"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6, stroke: '#2196F3', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : loading ? (
                            <LoadingSpinner />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Không có dữ liệu dự báo
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Combined and Comfort Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-3 text-blue-700">Chỉ số thoải mái</h2>
                    <div className="h-64">
                        {formattedComfortData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={formattedComfortData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar
                                        dataKey="comfortScore"
                                        name="Độ thoải mái"
                                        unit="/100"
                                        fill="#4CAF50"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : loading ? (
                            <LoadingSpinner />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Không có dữ liệu độ thoải mái
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-3 text-blue-700">Tương quan nhiệt độ và độ thoải mái</h2>
                    <div className="h-64">
                        {combinedData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={combinedData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis yAxisId="left" domain={[10, 40]} />
                                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="temperature"
                                        stroke="#FF5722"
                                        name="Nhiệt độ"
                                        unit="°C"
                                        dot={{ r: 4 }}
                                    />
                                    <Bar
                                        yAxisId="right"
                                        dataKey="comfortScore"
                                        name="Độ thoải mái"
                                        unit="/100"
                                        fill="#4CAF50"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : loading ? (
                            <LoadingSpinner />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Không có dữ liệu tương quan
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Additional Weather Data Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-3 text-blue-700">Dự báo áp suất</h2>
                    <div className="h-64">
                        {formattedWeatherData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={formattedWeatherData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="pressure"
                                        stroke="#673AB7"
                                        name="Áp suất"
                                        unit="hPa"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : loading ? (
                            <LoadingSpinner />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Không có dữ liệu dự báo
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-3 text-blue-700">Dự báo tốc độ gió</h2>
                    <div className="h-64">
                        {formattedWeatherData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={formattedWeatherData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis domain={[0, 'dataMax + 5']} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="windSpeed"
                                        stroke="#009688"
                                        name="Tốc độ gió"
                                        unit="km/h"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : loading ? (
                            <LoadingSpinner />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Không có dữ liệu dự báo
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Analysis Section */}
            {comfortData.length > 0 && (
                <div className="p-6 bg-gray-50 font-sans">
                    <h1 className="text-2xl font-bold mb-6 text-center text-blue-800">Phân tích độ thoải mái chi tiết</h1>
                    <p className="text-gray-700 mb-6 text-center max-w-3xl mx-auto">
                        Các biểu đồ dưới đây thể hiện mối quan hệ giữa nhiệt độ, độ ẩm, ánh sáng và độ thoải mái.
                        Màu sắc thể hiện mức độ thoải mái từ rất tốt (xanh lá) đến kém (đỏ).
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Temperature vs Comfort */}
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-2 text-center text-blue-700">Nhiệt độ vs Độ thoải mái</h2>
                            <div className="mb-2 text-sm text-gray-600 text-center">
                                Nhiệt độ thoải mái nhất: 23-26°C
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart
                                        margin={{ top: 20, right: 20, bottom: 30, left: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis 
                                            type="number" 
                                            dataKey="x" 
                                            name="Nhiệt độ" 
                                            unit="°C"
                                            domain={[15, 35]} 
                                            tick={{ fontSize: 12 }}
                                        >
                                            <Label value="Nhiệt độ (°C)" position="bottom" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#666' }} />
                                        </XAxis>
                                        <YAxis 
                                            type="number" 
                                            dataKey="y" 
                                            name="Độ thoải mái" 
                                            domain={[0, 100]} 
                                            tick={{ fontSize: 12 }}
                                        />
                                        
                                        {/* Comfort zone references */}
                                        {comfortZones.map((zone, index) => (
                                            index > 0 && (
                                                <ReferenceLine 
                                                    key={`temp-zone-${index}`}
                                                    y={zone.y} 
                                                    stroke={zone.color} 
                                                    strokeOpacity={0.5} 
                                                    strokeDasharray="3 3" 
                                                />
                                            )
                                        ))}
                                        
                                        {/* Ideal temperature reference */}
                                        <ReferenceLine x={25} stroke="#4CAF50" strokeOpacity={0.7} strokeDasharray="5 5">
                                            <Label position="top" value="Tối ưu" style={{ fontSize: '10px', fill: '#4CAF50' }} />
                                        </ReferenceLine>
                                        
                                        <Tooltip content={<ComfortTooltip />} />
                                        
                                        <Scatter 
                                            name="Nhiệt độ" 
                                            data={prepareComfortAnalysisData(comfortData).temperature} 
                                            fill="#8884d8"
                                            line={{ stroke: '#8884d8', strokeWidth: 1, strokeOpacity: 0.5 }}
                                            shape={(props:any) => {
                                                const { cx, cy, payload } = props;
                                                const color = getComfortColor(payload.y);
                                                return (
                                                    <circle 
                                                        cx={cx} 
                                                        cy={cy} 
                                                        r={6} 
                                                        fill={color} 
                                                        stroke="#fff"
                                                        strokeWidth={2}
                                                    />
                                                );
                                            }}
                                        />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        
                        {/* Humidity vs Comfort */}
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-2 text-center text-blue-700">Độ ẩm vs Độ thoải mái</h2>
                            <div className="mb-2 text-sm text-gray-600 text-center">
                                Độ ẩm thoải mái nhất: 40-60%
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart
                                        margin={{ top: 20, right: 20, bottom: 30, left: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis 
                                            type="number" 
                                            dataKey="x" 
                                            name="Độ ẩm" 
                                            unit="%" 
                                            domain={[0, 100]} 
                                            tick={{ fontSize: 12 }}
                                        >
                                            <Label value="Độ ẩm (%)" position="bottom" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#666' }} />
                                        </XAxis>
                                        <YAxis 
                                            type="number" 
                                            dataKey="y" 
                                            name="Độ thoải mái" 
                                            domain={[0, 100]} 
                                            tick={{ fontSize: 12 }}
                                        />
                                        
                                        {/* Comfort zone references */}
                                        {comfortZones.map((zone, index) => (
                                            index > 0 && (
                                                <ReferenceLine 
                                                    key={`hum-zone-${index}`}
                                                    y={zone.y} 
                                                    stroke={zone.color} 
                                                    strokeOpacity={0.5} 
                                                    strokeDasharray="3 3" 
                                                />
                                            )
                                        ))}
                                        
                                        {/* Ideal humidity reference */}
                                        <ReferenceLine x={55} stroke="#4CAF50" strokeOpacity={0.7} strokeDasharray="5 5">
                                            <Label position="top" value="Tối ưu" style={{ fontSize: '10px', fill: '#4CAF50' }} />
                                        </ReferenceLine>
                                        
                                        <Tooltip content={<ComfortTooltip />} />
                                        
                                        <Scatter 
                                            name="Độ ẩm" 
                                            data={prepareComfortAnalysisData(comfortData).humidity}
                                            fill="#82ca9d"
                                            line={{ stroke: '#82ca9d', strokeWidth: 1, strokeOpacity: 0.5 }}
                                            shape={(props: any) => {
                                                const { cx, cy, payload } = props;
                                                const color = getComfortColor(payload.y);
                                                return (
                                                    <circle 
                                                        cx={cx} 
                                                        cy={cy} 
                                                        r={6} 
                                                        fill={color} 
                                                        stroke="#fff"
                                                        strokeWidth={2}
                                                    />
                                                );
                                            }}
                                        />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        
                        {/* Light vs Comfort */}
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h2 className="text-xl font-semibold mb-2 text-center text-blue-700">Ánh sáng vs Độ thoải mái</h2>
                            <div className="mb-2 text-sm text-gray-600 text-center">
                                Ánh sáng thoải mái nhất: 60-75/100
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart
                                        margin={{ top: 20, right: 20, bottom: 30, left: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis 
                                            type="number" 
                                            dataKey="x" 
                                            name="Ánh sáng" 
                                            unit="/100" 
                                            domain={[0, 100]} 
                                            tick={{ fontSize: 12 }}
                                        >
                                            <Label value="Ánh sáng (/100)" position="bottom" style={{ textAnchor: 'middle', fontSize: '12px', fill: '#666' }} />
                                        </XAxis>
                                        <YAxis 
                                            type="number" 
                                            dataKey="y" 
                                            name="Độ thoải mái" 
                                            domain={[0, 100]} 
                                            tick={{ fontSize: 12 }}
                                        />
                                        
                                        {/* Comfort zone references */}
                                        {comfortZones.map((zone, index) => (
                                            index > 0 && (
                                                <ReferenceLine 
                                                    key={`light-zone-${index}`}
                                                    y={zone.y} 
                                                    stroke={zone.color} 
                                                    strokeOpacity={0.5} 
                                                    strokeDasharray="3 3" 
                                                />
                                            )
                                        ))}
                                        
                                        {/* Ideal light reference */}
                                        <ReferenceLine x={70} stroke="#4CAF50" strokeOpacity={0.7} strokeDasharray="5 5">
                                            <Label position="top" value="Tối ưu" style={{ fontSize: '10px', fill: '#4CAF50' }} />
                                        </ReferenceLine>
                                        
                                        <Tooltip content={<ComfortTooltip />} />
                                        
                                        <Scatter 
                                            name="Ánh sáng" 
                                            data={prepareComfortAnalysisData(comfortData).light}
                                            fill="#8884d8"
                                            line={{ stroke: '#8884d8', strokeWidth: 1, strokeOpacity: 0.5 }}
                                            shape={(props: any) => {
                                                const { cx, cy, payload } = props;
                                                const color = getComfortColor(payload.y);
                                                return (
                                                    <circle 
                                                        cx={cx} 
                                                        cy={cy} 
                                                        r={6} 
                                                        fill={color} 
                                                        stroke="#fff"
                                                        strokeWidth={2}
                                                    />
                                                );
                                            }}
                                        />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    
                    {/* Legend section */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-center">Thang đo độ thoải mái</h3>
                        <div className="flex flex-wrap justify-center gap-4">
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#4CAF50' }}></div>
                                <span className="text-sm">Excellent (90-76)</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#8BC34A' }}></div>
                                <span className="text-sm">Very Good (75-61)</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#CDDC39' }}></div>
                                <span className="text-sm">Good (60-46)</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#FFC107' }}></div>
                                <span className="text-sm">Moderate (45-31)</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: '#FF9800' }}></div>
                                <span className="text-sm">Poor (30-0)</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Description and analysis */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h3 className="text-lg font-semibold mb-3">Phân tích kết quả</h3>
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                            <li><span className="font-medium">Nhiệt độ:</span> Mức độ thoải mái cao nhất đạt được ở nhiệt độ 23-26°C. Khi nhiệt độ tăng trên 28°C hoặc giảm dưới 20°C, độ thoải mái giảm đáng kể.</li>
                            <li><span className="font-medium">Độ ẩm:</span> Độ ẩm tối ưu nằm trong khoảng 40-60%. Độ ẩm quá cao (&gt;70%) hoặc quá thấp (&lt;30%) đều giảm cảm giác thoải mái.</li>
                            <li><span className="font-medium">Ánh sáng:</span> Mức ánh sáng lý tưởng khoảng 60-75/100. Ánh sáng quá mạnh có thể gây khó chịu, trong khi ánh sáng quá yếu ảnh hưởng đến tầm nhìn.</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Footer with data credits */}
            {/* <div className="text-center text-gray-500 text-sm mt-4">
                <p>Dữ liệu dự báo được cung cấp từ hệ thống IoT nội bộ</p>
                <p>© {new Date().getFullYear()} - Hệ thống Giám sát và Dự báo</p>
            </div> */}
        </div>
    );
};

export default PredictionChart;