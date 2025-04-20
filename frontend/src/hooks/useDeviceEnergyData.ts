import { useState, useEffect } from 'react';
import axios from 'axios';

// Base API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

export const useDeviceEnergyData = (deviceId: string, timeRange = 'day', startDate?: string, endDate?: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!deviceId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        let url = `/device-energy/${deviceId}?timeRange=${timeRange}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;

        const response = await axiosWithAuth().get(url);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching device energy data:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [deviceId, timeRange, startDate, endDate]);

  return { data, isLoading, error };
};

export const useDeviceEnergyDistribution = (deviceId: string, date?: string) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!deviceId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const dateParam = date || new Date().toISOString().split('T')[0];
        const url = `/device-energy/distribution/${deviceId}?date=${dateParam}`;
        const response = await axiosWithAuth().get(url);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching device energy distribution:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [deviceId, date]);

  return { data, isLoading, error };
};

export const useDeviceEnergySummary = (deviceId: string) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!deviceId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const url = `/device-energy/summary/${deviceId}`;
        const response = await axiosWithAuth().get(url);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching device energy summary:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [deviceId]);

  return { data, isLoading, error };
};