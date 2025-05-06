// File: src/components/DashboardIOT/PredictionChart/index.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ComposedChart, Cell
} from 'recharts';
import {
    WeatherData,
    // ComfortData, - Remove this import
    RadarChartData,
} from 'src/types/predictdata';
import usePredictData, { ForecastWeatherData, ComfortData } from '@/hooks/usePredictData';

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
const formatRadarData = (current: WeatherData | null): RadarChartData[] => {
    // Ensure current is not null before accessing properties
    if (!current) return [];

    return [
        { subject: 'Temperature', A: current.temperature ? current.temperature / 40 * 100 : 0, fullMark: 100 }, // Scale temp to 0-100
        { subject: 'Humidity', A: current.humidity ?? 0, fullMark: 100 },
        { subject: 'Pressure', A: current.pressure ? (current.pressure - 980) / 70 * 100 : 0, fullMark: 100 }, // Scale pressure (example range 980-1050)
        { subject: 'Wind Speed', A: current.windSpeed ? current.windSpeed / 30 * 100 : 0, fullMark: 100 }, // Scale wind speed (example max 30)
        { subject: 'Light', A: current.light ?? 0, fullMark: 100 },
        { subject: 'Comfort', A: current.comfortScore ?? 0, fullMark: 100 },
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

// --- Main Dashboard Component ---

const PredictionChart = () => {
    const [forecastDays, setForecastDays] = useState(7);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const {
        weatherData,
        comfortData,
        currentConditions,
        loading,
        error,
        fetchForecastData,
        fetchCurrentConditions
    } = usePredictData(forecastDays);

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

    // Calculate average comfort score
    const averageComfort = useMemo(() => {
        return calculateAverageComfort(comfortData);
    }, [comfortData]);

    // Memoize radar data for efficiency, using currentConditions
    const radarData = useMemo(() => {
        return formatRadarData(currentConditions);
    }, [currentConditions]); // Re-calculate only when currentConditions changes

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

    // Handle initial loading state
    if (loading && !currentConditions) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <LoadingSpinner />
                <div className="mt-4 text-xl text-gray-600">Đang tải dữ liệu...</div>
            </div>
        );
    }

    // Handle error state
    if (error) {
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

            {/* Current Conditions */}
            {currentConditions && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-3 text-blue-700">Điều kiện hiện tại</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Nhiệt độ</div>
                                <div className="text-2xl font-bold">{currentConditions.temperature?.toFixed(1)}°C</div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Độ ẩm</div>
                                <div className="text-2xl font-bold">{currentConditions.humidity?.toFixed(1)}%</div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Áp suất</div>
                                <div className="text-2xl font-bold">{currentConditions.pressure?.toFixed(1)} hPa</div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Tốc độ gió</div>
                                <div className="text-2xl font-bold">{currentConditions.windSpeed?.toFixed(1)} km/h</div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Ánh sáng</div>
                                <div className="text-2xl font-bold">{currentConditions.light?.toFixed(1)}/100</div>
                            </div>
                            {currentConditions.comfortScore !== null && currentConditions.comfortScore !== undefined && (
                                <div className="p-3 rounded-md" style={{ backgroundColor: `${getComfortColor(currentConditions.comfortScore)}20` }}>
                                    <div className="text-sm text-gray-600">Độ thoải mái</div>
                                    <div className="text-2xl font-bold" style={{ color: getComfortColor(currentConditions.comfortScore) }}>
                                        {currentConditions.comfortScore.toFixed(1)}/100
                                    </div>
                                    <div className="text-sm font-medium" style={{ color: getComfortColor(currentConditions.comfortScore) }}>
                                        {getComfortLevelText(currentConditions.comfortScore)}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500">
                            Cập nhật lần cuối: {new Date().toLocaleTimeString()}
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
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h2 className="text-xl font-semibold mb-3 text-blue-700">Phân tích độ thoải mái chi tiết</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="h-64">
                            <h3 className="text-md font-medium mb-2 text-center">Nhiệt độ vs Độ thoải mái</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        type="number"
                                        dataKey="temperature"
                                        name="Nhiệt độ"
                                        domain={[15, 35]}
                                        label={{ value: 'Nhiệt độ (°C)', position: 'bottom' }}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="comfortScore"
                                        name="Độ thoải mái"
                                        domain={[0, 100]}
                                        label={{ value: 'Độ thoải mái', angle: -90, position: 'left' }}
                                    />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter name="Giá trị" data={comfortData} fill="#8884d8">
    {comfortData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={getComfortColor(entry.comfortScore || 0)} />
    ))}
</Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="h-64">
                            <h3 className="text-md font-medium mb-2 text-center">Độ ẩm vs Độ thoải mái</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        type="number"
                                        dataKey="humidity"
                                        name="Độ ẩm"
                                        domain={[0, 100]}
                                        label={{ value: 'Độ ẩm (%)', position: 'bottom' }}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="comfortScore"
                                        name="Độ thoải mái"
                                        domain={[0, 100]}
                                        label={{ value: 'Độ thoải mái', angle: -90, position: 'left' }}
                                    />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter name="Giá trị" data={comfortData} fill="#82ca9d">
    {comfortData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={getComfortColor(entry.comfortScore || 0)} />
    ))}
</Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="h-64">
                            <h3 className="text-md font-medium mb-2 text-center">Ánh sáng vs Độ thoải mái</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        type="number"
                                        dataKey="light"
                                        name="Ánh sáng"
                                        domain={[0, 100]}
                                        label={{ value: 'Ánh sáng (/100)', position: 'bottom' }}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="comfortScore"
                                        name="Độ thoải mái"
                                        domain={[0, 100]}
                                        label={{ value: 'Độ thoải mái', angle: -90, position: 'left' }}
                                    />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter name="Giá trị" data={comfortData} fill="#82ca9d">
    {comfortData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={getComfortColor(entry.comfortScore || 0)} />
    ))}
</Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer with data credits */}
            <div className="text-center text-gray-500 text-sm mt-4">
                <p>Dữ liệu dự báo được cung cấp từ hệ thống IoT nội bộ</p>
                <p>© {new Date().getFullYear()} - Hệ thống Giám sát và Dự báo</p>
            </div>
        </div>
    );
};

export default PredictionChart;