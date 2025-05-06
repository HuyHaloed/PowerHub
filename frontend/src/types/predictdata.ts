export interface WeatherData {
    date: string;
    temperature: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    light: number;
    comfortScore: number;
}

export interface ChartData {
    date: string;
    humidity: number;
    pressure: number;
    windSpeed: number;
    temperature: number;
}

export interface ComfortData {
    date: string;
    temperature: number;
    humidity: number;
    light: number;
    comfortScore: number;
}

export interface RadarChartData {
    subject: string;
    A: number;
    fullMark: number;
}
