import { useState, useEffect } from 'react';
import authorizedAxiosInstance from '../lib/axios';

interface EnvironmentData {
  id: string;
  deviceId: string | null;
  deviceName: string | null;
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
  location: string;
}

interface EnvironmentResponse {
  hasSubscription: boolean;
  hasData?: boolean;
  data?: EnvironmentData | EnvironmentStats;
}

// Hook để lấy dữ liệu môi trường mới nhất
export const useLatestEnvironmentData = (location?: string) => {
  const [data, setData] = useState<EnvironmentData | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [hasData, setHasData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const url = location 
          ? `/Environment/latest?location=${encodeURIComponent(location)}`
          : `/Environment/latest`;
          
        const response = await authorizedAxiosInstance.get<EnvironmentResponse>(url);
        
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
        setError('Không thể tải dữ liệu môi trường');
        console.error('Lỗi khi tải dữ liệu môi trường:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Làm mới dữ liệu mỗi phút
    const intervalId = setInterval(fetchData, 60000);
    
    return () => clearInterval(intervalId);
  }, [location]);

  return { data, isLoading, error, hasSubscription, hasData };
};

// Hook để lấy thống kê môi trường
export const useEnvironmentStats = (startDate?: Date, endDate?: Date, location?: string) => {
  const [stats, setStats] = useState<EnvironmentStats | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [hasData, setHasData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        let url = `/Environment/stats`;
        const params = [];
        
        if (startDate) {
          params.push(`startDate=${startDate.toISOString()}`);
        }
        
        if (endDate) {
          params.push(`endDate=${endDate.toISOString()}`);
        }
        
        if (location) {
          params.push(`location=${encodeURIComponent(location)}`);
        }
        
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }
        
        const response = await authorizedAxiosInstance.get<EnvironmentResponse>(url);
        
        setHasSubscription(response.data.hasSubscription);
        
        if (response.data.hasSubscription && response.data.hasData) {
          setStats(response.data.data as EnvironmentStats);
          setHasData(true);
        } else {
          setStats(null);
          setHasData(false);
        }
        
        setError(null);
      } catch (err) {
        setError('Không thể tải thống kê môi trường');
        console.error('Lỗi khi tải thống kê môi trường:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [startDate, endDate, location]);

  return { stats, isLoading, error, hasSubscription, hasData };
};

// Hook để lấy toàn bộ dữ liệu môi trường
export const useEnvironmentData = (
  startDate?: Date, 
  endDate?: Date,
  location?: string
) => {
  const [data, setData] = useState<EnvironmentData[]>([]);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let url = '/Environment';
        const params = [];
        
        if (startDate) {
          params.push(`startDate=${startDate.toISOString()}`);
        }
        
        if (endDate) {
          params.push(`endDate=${endDate.toISOString()}`);
        }
        
        if (location) {
          params.push(`location=${encodeURIComponent(location)}`);
        }
        
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }
        
        const response = await authorizedAxiosInstance.get<{hasSubscription: boolean, data: EnvironmentData[]}>(url);
        setHasSubscription(response.data.hasSubscription);
        setData(response.data.hasSubscription ? response.data.data : []);
        setError(null);
      } catch (err) {
        setError('Không thể tải dữ liệu môi trường');
        console.error('Lỗi khi tải dữ liệu môi trường:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, location]);

  return { data, isLoading, error, hasSubscription };
};

// Hook để lấy danh sách các vị trí có dữ liệu môi trường
export const useEnvironmentLocations = () => {
  const [locations, setLocations] = useState<string[]>([]);
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const response = await authorizedAxiosInstance.get<{hasSubscription: boolean, data: string[]}>('/Environment/locations');
        setHasSubscription(response.data.hasSubscription);
        setLocations(response.data.hasSubscription ? response.data.data : []);
        setError(null);
      } catch (err) {
        setError('Không thể tải danh sách vị trí');
        console.error('Lỗi khi tải danh sách vị trí:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return { locations, isLoading, error, hasSubscription };
};