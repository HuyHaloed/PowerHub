import { useState, useEffect } from 'react';
import authorizedAxiosInstance from '@/lib/axios';

export interface DeviceThreshold {
  id: string;
  deviceId: string;
  userId: string;
  isEnabled: boolean;
  value: number;
  action: 'turnOn' | 'turnOff';
  createdAt: string;
  updatedAt: string;
}

export interface ThresholdRequest {
  isEnabled: boolean;
  value: number;
  action: 'turnOn' | 'turnOff';
}

export const useDeviceThreshold = (deviceId?: string) => {
  const [threshold, setThreshold] = useState<DeviceThreshold | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch threshold for a device
  const fetchThreshold = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authorizedAxiosInstance.get(`/devices/${id}/threshold`);
      if (response.data) {
        setThreshold(response.data);
      } else {
        setThreshold(null);
      }
    } catch (err) {
      console.error("Lỗi khi tải ngưỡng thiết bị:", err);
      setError("Không thể tải ngưỡng thiết bị");
      setThreshold(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Set or update threshold
  const setDeviceThreshold = async (id: string, request: ThresholdRequest): Promise<DeviceThreshold | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authorizedAxiosInstance.post(`/devices/${id}/threshold`, request);
      if (response.data) {
        setThreshold(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      console.error("Lỗi khi thiết lập ngưỡng thiết bị:", err);
      setError("Không thể thiết lập ngưỡng thiết bị");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle threshold enabled status
  const toggleThresholdStatus = async (id: string, isEnabled: boolean): Promise<boolean> => {
    if (!threshold) return false;
    
    setIsLoading(true);
    setError(null);
    try {
      const request: ThresholdRequest = {
        isEnabled,
        value: threshold.value,
        action: threshold.action
      };
      
      const response = await authorizedAxiosInstance.post(`/devices/${id}/threshold`, request);
      if (response.data) {
        setThreshold(response.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Lỗi khi thay đổi trạng thái ngưỡng:", err);
      setError("Không thể thay đổi trạng thái ngưỡng");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Check if a device's consumption is exceeding threshold
  const isExceedingThreshold = (consumption: number): boolean => {
    if (!threshold || !threshold.isEnabled) return false;
    
    if (threshold.action === 'turnOff') {
      return consumption >= threshold.value;
    } else {
      return consumption <= threshold.value;
    }
  };

  // Load threshold data on component mount if deviceId is provided
  useEffect(() => {
    if (deviceId) {
      fetchThreshold(deviceId);
    }
  }, [deviceId]);

  return {
    threshold,
    isLoading,
    error,
    fetchThreshold,
    setDeviceThreshold,
    toggleThresholdStatus,
    isExceedingThreshold
  };
};