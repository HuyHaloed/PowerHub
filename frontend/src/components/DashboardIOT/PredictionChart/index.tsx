// File: src/components/DashboardIOT/PredictionChart/index.tsx
import { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ComposedChart // Area import removed
} from 'recharts';
import {
    WeatherData, // Used for CurrentConditions
    ComfortData, // Used for Comfort Forecast
    RadarChartData,
} from 'src/types/predictdata'; // ChartData import removed

// Define a specific type for weather forecast data if WeatherData includes comfort/light
// Assuming WeatherData is defined as having all properties (temp, hum, press, wind, light, comfort)
// If WeatherData is *only* for current conditions, let's define a forecast type:
interface ForecastWeatherData {
    date: string;
    humidity: number;
    pressure: number;
    windSpeed: number;
    temperature: number;
}

// Assuming ComfortData is defined as having:
// interface ComfortData {
//     date: string;
//     temperature: number; // Could be included for context/scatter
//     humidity: number;    // Could be included for context/scatter
//     light: number;       // Could be included for context/scatter
//     comfortScore: number;
// }


// --- Utility Functions (Could be in a separate file like src/utils/dataGenerators.ts) ---

// Mock data generator for weather forecast
const generateWeatherData = (days = 7): ForecastWeatherData[] => {
    const data: ForecastWeatherData[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        // Generate realistic values for weather forecast
        const humidity = Math.floor(Math.random() * 50) + 30; // 30-80%
        const pressure = Math.floor(Math.random() * 30) + 995; // 995-1025 hPa
        const windSpeed = Math.floor(Math.random() * 25) + 5; // 5-30 km/h

        // Calculate temperature (simplified)
        const temperature = parseFloat((29 + 0.1 * humidity - 0.01 * pressure + 0.05 * windSpeed +
            (Math.random() * 4 - 2)).toFixed(1));

        data.push({
            date: date.toLocaleDateString(),
            humidity,
            pressure,
            windSpeed,
            temperature
        });
    }

    return data;
};

// Calculate comfort score (extracted for reusability)
const calculateComfortScore = (temp: number, hum: number, light: number): number => {
    let score = 100;

    // Temperature penalty
    if (temp < 22) score -= 3.0 * (22 - temp);
    else if (temp > 25) score -= 3.0 * (temp - 25);

    // Humidity penalty
    if (hum < 40) score -= 1.5 * (40 - hum);
    else if (hum > 60) score -= 1.5 * (hum - 60);

    // Light penalty
    if (light < 40) score -= 1.0 * (40 - light);
    else if (light > 70) score -= 1.0 * (light - 70);

    return parseFloat(Math.max(0, Math.min(100, score)).toFixed(1));
};


// Mock data generator for comfort forecast
const generateComfortData = (days = 7): ComfortData[] => {
    const data: ComfortData[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        // Generate realistic values for comfort calculation
        const temperature = Math.floor(Math.random() * 20) + 15; // 15-35°C
        const humidity = Math.floor(Math.random() * 80) + 20; // 20-100%
        const light = Math.floor(Math.random() * 80) + 20; // 20-100 (scaled)

        const comfortScore = calculateComfortScore(temperature, humidity, light);

        data.push({
            date: date.toLocaleDateString(),
            temperature, // Include for scatter plot context
            humidity,    // Include for scatter plot context
            light,       // Include for scatter plot context
            comfortScore
        });
    }

    return data;
};

// Generate current conditions data (assumed to match WeatherData type)
const generateCurrentConditions = (): WeatherData => {
    const humidity = Math.floor(Math.random() * 50) + 30;
    const pressure = Math.floor(Math.random() * 30) + 995;
    const windSpeed = Math.floor(Math.random() * 25) + 5;
    const temperature = parseFloat((29 + 0.1 * humidity - 0.01 * pressure + 0.05 * windSpeed +
        (Math.random() * 4 - 2)).toFixed(1));
    const light = Math.floor(Math.random() * 80) + 20;

    const comfortScore = calculateComfortScore(temperature, humidity, light);

    return {
        date: new Date().toLocaleDateString(), // Added date for consistency
        temperature,
        humidity,
        pressure,
        windSpeed,
        light,
        comfortScore
    };
};

// Radar chart data formatter - accepts WeatherData or null
const formatRadarData = (current: WeatherData | null): RadarChartData[] => {
     // Ensure current is not null before accessing properties
     if (!current) return [];

    return [
        { subject: 'Temperature', A: current.temperature / 40 * 100, fullMark: 100 }, // Scale temp to 0-100
        { subject: 'Humidity', A: current.humidity, fullMark: 100 },
        { subject: 'Pressure', A: (current.pressure - 980) / 70 * 100, fullMark: 100 }, // Scale pressure (example range 980-1050)
        { subject: 'Wind Speed', A: current.windSpeed / 30 * 100, fullMark: 100 }, // Scale wind speed (example max 30)
        { subject: 'Light', A: current.light, fullMark: 100 },
        { subject: 'Comfort', A: current.comfortScore, fullMark: 100 },
    ];
};

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


// --- Main Dashboard Component ---

const PredictionChart = () => {
    // Use specific types for forecast data lists
    const [weatherData, setWeatherData] = useState<ForecastWeatherData[]>([]);
    const [comfortData, setComfortData] = useState<ComfortData[]>([]);
    // WeatherData is used for the single current conditions object
    const [currentConditions, setCurrentConditions] = useState<WeatherData | null>(null);
    const [forecastDays, setForecastDays] = useState(7);

    // Effect to fetch forecast data when forecastDays changes
    useEffect(() => {
        const weather = generateWeatherData(forecastDays);
        const comfort = generateComfortData(forecastDays);
        setWeatherData(weather);
        setComfortData(comfort);
    }, [forecastDays]); // Dependency array ensures this runs only when forecastDays changes

    // Effect to update current conditions periodically
    useEffect(() => {
        // Initial fetch of current conditions
        const current = generateCurrentConditions();
        setCurrentConditions(current);

        // Set up interval for real-time updates
        const interval = setInterval(() => {
            const updatedCurrent = generateCurrentConditions();
            setCurrentConditions(updatedCurrent);
        }, 10000); // Update every 10 seconds

        // Cleanup interval on component unmount or effect re-run
        return () => clearInterval(interval);
    }, []); // Empty dependency array ensures this runs only once on mount

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
                comfortScore: correspondingComfort?.comfortScore ?? 0 // Use ?? 0 for default if not found
            };
        });
    }, [weatherData, comfortData]); // Re-calculate only when weatherData or comfortData changes

    // Memoize radar data for efficiency, using currentConditions
     const radarData = useMemo(() => {
        return formatRadarData(currentConditions);
    }, [currentConditions]); // Re-calculate only when currentConditions changes


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
                                <div className="text-2xl font-bold">{currentConditions.temperature}°C</div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Độ ẩm</div>
                                <div className="text-2xl font-bold">{currentConditions.humidity}%</div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Áp suất</div>
                                <div className="text-2xl font-bold">{currentConditions.pressure} hPa</div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Tốc độ gió</div>
                                <div className="text-2xl font-bold">{currentConditions.windSpeed} km/h</div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-md">
                                <div className="text-sm text-gray-600">Ánh sáng</div>
                                <div className="text-2xl font-bold">{currentConditions.light}/100</div>
                            </div>
                            <div className="p-3 rounded-md" style={{ backgroundColor: `${getComfortColor(currentConditions.comfortScore)}20` }}>
                                <div className="text-sm text-gray-600">Độ thoải mái</div>
                                <div className="text-2xl font-bold" style={{ color: getComfortColor(currentConditions.comfortScore) }}>
                                    {currentConditions.comfortScore}/100
                                </div>
                                <div className="text-sm font-medium" style={{ color: getComfortColor(currentConditions.comfortScore) }}>
                                    {getComfortLevelText(currentConditions.comfortScore)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-3 text-blue-700">Phân tích điều kiện</h2>
                        <div className="h-64">
                             {radarData && radarData.length > 0 ? ( // Render only if radarData is available
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
                                 <div className="flex items-center justify-center h-full text-gray-500">
                                     Đang tải dữ liệu...
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {/* Forecast Controls */}
            <div className="mb-4 flex items-center">
                <span className="mr-2 text-gray-700">Dự báo trong:</span>
                <select
                    className="p-2 border rounded-md"
                    value={forecastDays}
                    onChange={(e) => setForecastDays(parseInt(e.target.value))}
                >
                    <option value="3">3 ngày</option>
                    <option value="7">7 ngày</option>
                    <option value="14">14 ngày</option>
                </select>
            </div>

            {/* Weather Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-3 text-blue-700">Dự báo nhiệt độ</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weatherData}> {/* Using ForecastWeatherData[] */}
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis domain={[10, 40]} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="temperature" stroke="#FF5722" name="Nhiệt độ (°C)" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-3 text-blue-700">Dự báo độ ẩm</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weatherData}> {/* Using ForecastWeatherData[] */}
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="humidity" stroke="#2196F3" name="Độ ẩm (%)" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Combined and Comfort Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-3 text-blue-700">Chỉ số thoải mái</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comfortData}> {/* Using ComfortData[] */}
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="comfortScore" name="Độ thoải mái" fill="#4CAF50" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-3 text-blue-700">Tương quan nhiệt độ và độ thoải mái</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={combinedData}> {/* Using combined data */}
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis yAxisId="left" domain={[10, 40]} label={{ value: 'Nhiệt độ (°C)', position: 'insideTopLeft', offset: 10 }} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: 'Độ thoải mái', position: 'insideTopRight', offset: 10 }} />
                                <Tooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#FF5722" name="Nhiệt độ (°C)" />
                                <Bar yAxisId="right" dataKey="comfortScore" name="Độ thoải mái" fill="#4CAF50" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Analysis Section */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h2 className="text-xl font-semibold mb-3 text-blue-700">Phân tích độ thoải mái chi tiết</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-64">
                        <h3 className="text-md font-medium mb-2 text-center">Nhiệt độ vs Độ thoải mái</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <ScatterChart> {/* Using ComfortData[] */}
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="temperature" name="Nhiệt độ" domain={[15, 35]} />
                                <YAxis type="number" dataKey="comfortScore" name="Độ thoải mái" domain={[0, 100]} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Giá trị" data={comfortData} fill="#8884d8" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="h-64">
                        <h3 className="text-md font-medium mb-2 text-center">Độ ẩm vs Độ thoải mái</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <ScatterChart> {/* Using ComfortData[] */}
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="humidity" name="Độ ẩm" domain={[0, 100]} />
                                <YAxis type="number" dataKey="comfortScore" name="Độ thoải mái" domain={[0, 100]} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Giá trị" data={comfortData} fill="#82ca9d" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="h-64">
                        <h3 className="text-md font-medium mb-2 text-center">Ánh sáng vs Độ thoải mái</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <ScatterChart> {/* Using ComfortData[] */}
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="light" name="Ánh sáng" domain={[0, 100]} />
                                <YAxis type="number" dataKey="comfortScore" name="Độ thoải mái" domain={[0, 100]} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Giá trị" data={comfortData} fill="#ff7300" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PredictionChart;