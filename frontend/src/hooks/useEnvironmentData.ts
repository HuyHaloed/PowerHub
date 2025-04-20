import { useState, useEffect } from 'react';
import axios from 'axios';

interface EnvironmentData {
  id: string;
  deviceId: string;
  deviceName: string;
  temperature: number;
  humidity: number;
  timestamp: string;
  location: string;
}

interface EnvironmentStats {
  currentTemperature: number;
  currentHumidity: number;
  avgTemperature: number;
  avgHumidity: number;
  maxTemperature: number;
  minTemperature: number;
  maxHumidity: number;
  minHumidity: number;
  lastUpdated: string;
  hasData: boolean;
}

interface EnvironmentResponse {
  hasSubscription: boolean;
  hasData?: boolean;
  data?: EnvironmentData | EnvironmentStats;
}

// Hook to get latest environment data
export const useLatestEnvironmentData = (deviceId?: string) => {
  const [data, setData] = useState<EnvironmentData | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [hasData, setHasData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const url = deviceId 
          ? `/api/Environment/latest?deviceId=${deviceId}`
          : `/api/Environment/latest`;
          
        const response = await axios.get<EnvironmentResponse>(url);
        
        setHasSubscription(response.data.hasSubscription);
        
        if (response.data.hasSubscription && response.data.hasData) {
          setData(response.data.data as EnvironmentData);
          setHasData(true);
        } else {
          setData(null);
          setHasData(false);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch environment data');
        console.error('Error fetching environment data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every minute
    const intervalId = setInterval(fetchData, 60000);
    
    return () => clearInterval(intervalId);
  }, [deviceId]);

  return { data, isLoading, error, hasSubscription, hasData };
};

// Hook to get environment statistics
export const useEnvironmentStats = (startDate?: Date, endDate?: Date) => {
  const [stats, setStats] = useState<EnvironmentStats | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        let url = `/api/Environment/stats`;
        const params = [];
        
        if (startDate) {
          params.push(`startDate=${startDate.toISOString()}`);
        }
        
        if (endDate) {
          params.push(`endDate=${endDate.toISOString()}`);
        }
        
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }
        
        const response = await axios.get<EnvironmentResponse>(url);
        
        setHasSubscription(response.data.hasSubscription);
        
        if (response.data.hasSubscription) {
          setStats(response.data.data as EnvironmentStats);
        } else {
          setStats(null);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch environment statistics');
        console.error('Error fetching environment statistics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [startDate, endDate]);

  return { stats, isLoading, error, hasSubscription };
};

// Hook to get all environment data with pagination
export const useEnvironmentData = (
  deviceId?: string, 
  startDate?: Date, 
  endDate?: Date
) => {
  const [data, setData] = useState<EnvironmentData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let url = '/api/Environment';
        const params = [];
        
        if (deviceId) {
          params.push(`deviceId=${deviceId}`);
        }
        
        if (startDate) {
          params.push(`startDate=${startDate.toISOString()}`);
        }
        
        if (endDate) {
          params.push(`endDate=${endDate.toISOString()}`);
        }
        
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }
        
        const response = await axios.get<EnvironmentData[]>(url);
        setData(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch environment data');
        console.error('Error fetching environment data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [deviceId, startDate, endDate]);

  return { data, isLoading, error };
};