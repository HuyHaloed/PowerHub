import { useState, useEffect } from 'react';
import axios from 'axios';

// Base API configuration
const API_URL = 'http://localhost:5000/api';

// Get token from sessionStorage
const getAuthToken = () => {
  return sessionStorage.getItem('auth_token');
};

// Configure axios with token
const axiosWithAuth = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
};

export const useEnergyConsumption = (timeRange: string, startDate?: string, endDate?: string) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let url = `/energy/consumption?timeRange=${timeRange}`;
        
        // Xử lý startDate
        if (timeRange === 'day') {
          // Nếu không có startDate, sử dụng ngày hiện tại
          const dateToUse = startDate || new Date().toISOString().split('T')[0];
          url += `&startDate=${dateToUse}`;
        } else if (startDate) {
          const utcStartDate = new Date(startDate).toISOString();
          url += `&startDate=${utcStartDate}`;
        }
        
        // Xử lý endDate tương tự
        if (timeRange === 'day' && endDate) {
          url += `&endDate=${endDate}`;
        } else if (endDate) {
          const utcEndDate = new Date(endDate).toISOString();
          url += `&endDate=${utcEndDate}`;
        }

        const response = await axiosWithAuth().get(url);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching energy consumption:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange, startDate, endDate]);

  return { data, isLoading, error };
};

export const useEnergyDistribution = (date?: string) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const url = `/energy/distribution${date ? `?date=${date}` : ''}`;
        const response = await axiosWithAuth().get(url);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching energy distribution:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [date]);

  return { data, isLoading, error };
};

export const useEnergyPredictions = (timeRange: string, periods = 7) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
      const fetchData = async () => {
          setIsLoading(true);
          try {
              const url = `/energy/predictions?timeRange=${timeRange}&periods=${periods}`;
              const response = await axiosWithAuth().get(url);
              setData(response.data);
              setError(null);
          } catch (err) {
              console.error('Error fetching energy predictions:', err);
              setError(err);
          } finally {
              setIsLoading(false);
          }
      };

      fetchData();
  }, [timeRange, periods]);

  return { data, isLoading, error };
};
export const useEnergyComparison = (timeRange: string, startDate?: string, endDate?: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let url = `/energy/compare?timeRange=${timeRange}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;

        const response = await axiosWithAuth().get(url);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching energy comparison:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange, startDate, endDate]);

  return { data, isLoading, error };
};