// File: frontend/src/hooks/usePredictData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import axios, { AxiosError } from 'axios';

import { WeatherData } from 'src/types/predictdata';

export interface ForecastWeatherData {
    date: string;
    humidity: number | null;
    pressure: number | null;
    windSpeed: number | null;
    temperature: number | null;
}

export interface ComfortData {
    date: string;
    temperature: number | null;
    humidity: number | null;
    light: number | null;
    comfortScore: number | null;
}

const API_URL = 'http://localhost:8001/api';

// Configuration
const CONFIG = {
    CURRENT_REFRESH_INTERVAL: 60000, // 1 minute
    FORECAST_CACHE_TIME: 3600000,    // 1 hour
    MAX_RETRIES: 3,
    INITIAL_RETRY_DELAY: 2000,       // 2 seconds
    RATE_LIMIT_COOLDOWN: 10000       // 10 seconds when hitting 429
};

interface UsePredictData {
    weatherData: ForecastWeatherData[];
    comfortData: ComfortData[];
    currentConditions: WeatherData | null;
    loading: boolean;
    error: string | null;
    fetchForecastData: (days: number) => Promise<void>;
    fetchCurrentConditions: () => Promise<void>;
}

// Create a cache service
interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiry: number;
}

class ApiCache {
    private cache: Record<string, CacheItem<any>> = {};
    
    set<T>(key: string, data: T, ttl: number = CONFIG.FORECAST_CACHE_TIME): void {
        const now = Date.now();
        this.cache[key] = {
            data,
            timestamp: now,
            expiry: now + ttl
        };
    }
    
    get<T>(key: string): T | null {
        const item = this.cache[key];
        const now = Date.now();
        
        if (!item) return null;
        if (now > item.expiry) {
            delete this.cache[key];
            return null;
        }
        
        return item.data;
    }
    
    isValid(key: string): boolean {
        return this.get(key) !== null;
    }
    
    clear(): void {
        this.cache = {};
    }
}

const usePredictData = (initialForecastDays: number): UsePredictData => {
    const [weatherData, setWeatherData] = useState<ForecastWeatherData[]>([]);
    const [comfortData, setComfortData] = useState<ComfortData[]>([]);
    const [currentConditions, setCurrentConditions] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Create refs to track ongoing requests to prevent duplicates
    const ongoingRequests = useRef<Record<string, boolean>>({});
    const cache = useRef(new ApiCache());
    const lastRateLimitHit = useRef<number>(0);
    
    // Helper to create cache keys
    const getCacheKey = (endpoint: string, params?: any): string => {
        return `${endpoint}${params ? '_' + JSON.stringify(params) : ''}`;
    };
    
    // Generic API request function with retry logic and caching
    const apiRequest = useCallback(async <T>(
        endpoint: string,
        params?: any,
        forceFresh: boolean = false,
        isBackground: boolean = false
    ): Promise<T> => {
        const cacheKey = getCacheKey(endpoint, params);
        
        // Check if a request is already in progress for this endpoint
        if (ongoingRequests.current[cacheKey]) {
            throw new Error('Request already in progress');
        }
        
        // Check if we've hit rate limits recently
        const now = Date.now();
        if (now - lastRateLimitHit.current < CONFIG.RATE_LIMIT_COOLDOWN) {
            const waitTime = CONFIG.RATE_LIMIT_COOLDOWN - (now - lastRateLimitHit.current);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        // Check cache first if not forcing a fresh request
        if (!forceFresh) {
            const cachedData = cache.current.get<T>(cacheKey);
            if (cachedData) return cachedData;
        }
        
        // Mark this request as ongoing
        ongoingRequests.current[cacheKey] = true;
        
        try {
            // Implement retry logic
            let retries = 0;
            let delay = CONFIG.INITIAL_RETRY_DELAY;
            
            while (retries <= CONFIG.MAX_RETRIES) {
                try {
                    const response = await axios.get<T>(`${API_URL}/${endpoint}`, { params });
                    
                    // Cache the successful response
                    cache.current.set(cacheKey, response.data);
                    
                    // Clear the ongoing request flag
                    delete ongoingRequests.current[cacheKey];
                    
                    return response.data;
                } catch (err) {
                    const axiosError = err as AxiosError;
                    
                    // Handle rate limiting specifically
                    if (axiosError.response?.status === 429) {
                        lastRateLimitHit.current = Date.now();
                        retries++;
                        
                        if (retries > CONFIG.MAX_RETRIES) {
                            throw err;
                        }
                        
                        // Wait with exponential backoff
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2; // Exponential backoff
                    } else {
                        throw err; // Not a rate limit error, just throw it
                    }
                }
            }
            
            throw new Error('Maximum retries exceeded');
        } catch (err) {
            // Clean up the ongoing request flag on error
            delete ongoingRequests.current[cacheKey];
            throw err;
        }
    }, []);
    
    // Fetch weather forecast
    const fetchWeatherData = useCallback(async (days: number, forceFresh: boolean = false): Promise<ForecastWeatherData[]> => {
        try {
            return await apiRequest<ForecastWeatherData[]>('weather/forecast', { days }, forceFresh);
        } catch (err) {
            console.error('Error fetching weather forecast:', err);
            throw err;
        }
    }, [apiRequest]);
    
    // Fetch comfort data
    const fetchComfortData = useCallback(async (days: number, forceFresh: boolean = false): Promise<ComfortData[]> => {
        try {
            return await apiRequest<ComfortData[]>('comfort/forecast', { days }, forceFresh);
        } catch (err) {
            console.error('Error fetching comfort forecast:', err);
            throw err;
        }
    }, [apiRequest]);
    
    // Fetch current conditions
    const fetchCurrentConditions = useCallback(async (forceFresh: boolean = false): Promise<WeatherData> => {
        try {
            return await apiRequest<WeatherData>('weather/current', undefined, forceFresh);
        } catch (err) {
            console.error('Error fetching current conditions:', err);
            throw err;
        }
    }, [apiRequest]);
    
    // Combined fetch for all data
    const fetchAllData = useCallback(async (days: number, forceFresh: boolean = false): Promise<void> => {
        setLoading(true);
        setError(null);
        
        try {
            // Use Promise.allSettled to prevent one failure from causing all to fail
            const results = await Promise.allSettled([
                fetchWeatherData(days, forceFresh),
                fetchComfortData(days, forceFresh),
                fetchCurrentConditions(forceFresh)
            ]);
            
            // Handle results individually
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    switch (index) {
                        case 0:
                            setWeatherData(result.value as ForecastWeatherData[]);
                            break;
                        case 1:
                            setComfortData(result.value as ComfortData[]);
                            break;
                        case 2:
                            setCurrentConditions(result.value as WeatherData);
                            break;
                    }
                } else {
                    const axiosError = result.reason as AxiosError;
                    console.error(`Error in API call ${index}:`, axiosError);
                    
                    // Set appropriate error message
                    if (index === 0) {
                        setError(`Lỗi tải dự báo thời tiết: ${axiosError.message}`);
                    } else if (index === 1) {
                        setError(`Lỗi tải dự báo độ thoải mái: ${axiosError.message}`);
                    } else {
                        setError(`Lỗi tải điều kiện hiện tại: ${axiosError.message}`);
                    }
                }
            });
        } catch (err) {
            const axiosError = err as AxiosError;
            setError(`Lỗi tải dữ liệu: ${axiosError.message}`);
        } finally {
            setLoading(false);
        }
    }, [fetchWeatherData, fetchComfortData, fetchCurrentConditions]);
    
    // Initial data load
    useEffect(() => {
        fetchAllData(initialForecastDays, false);
    }, [initialForecastDays, fetchAllData]);
    
    // Periodically refresh current conditions only (with a reasonable interval)
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const currentData = await fetchCurrentConditions(true);
                setCurrentConditions(currentData);
            } catch (err) {
                // Just log errors for background updates, don't show to user
                console.warn('Background refresh of current conditions failed:', err);
            }
        }, CONFIG.CURRENT_REFRESH_INTERVAL);
        
        return () => clearInterval(interval);
    }, [fetchCurrentConditions]);
    
    // Public methods
    const refetchForecastData = useCallback(async (days: number): Promise<void> => {
        setLoading(true);
        setError(null);
        
        try {
            // Force refresh of forecast data
            const [weatherData, comfortData] = await Promise.all([
                fetchWeatherData(days, true),
                fetchComfortData(days, true)
            ]);
            
            setWeatherData(weatherData);
            setComfortData(comfortData);
        } catch (err) {
            const axiosError = err as AxiosError;
            setError(`Lỗi tải lại dự báo: ${axiosError.message}`);
        } finally {
            setLoading(false);
        }
    }, [fetchWeatherData, fetchComfortData]);
    
    const refetchCurrentConditions = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);
        
        try {
            // Force refresh of current conditions
            const data = await fetchCurrentConditions(true);
            setCurrentConditions(data);
        } catch (err) {
            const axiosError = err as AxiosError;
            setError(`Lỗi tải lại điều kiện hiện tại: ${axiosError.message}`);
        } finally {
            setLoading(false);
        }
    }, [fetchCurrentConditions]);
    
    return {
        weatherData,
        comfortData,
        currentConditions,
        loading,
        error,
        fetchForecastData: refetchForecastData,
        fetchCurrentConditions: refetchCurrentConditions
    };
};

export default usePredictData;