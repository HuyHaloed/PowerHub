import { useState } from 'react';
import authorizedAxiosInstance from '@/lib/axios';

export interface DeviceControlOptions {
  // Whether to automatically update UI even before server response
  optimisticUpdate?: boolean;
  // Custom error handler
  onError?: (error: any) => void;
  // Custom success handler
  onSuccess?: (response: any) => void;
}

export interface DeviceStatus {
  deviceId: string;
  status: 'on' | 'off';
  timestamp: string;
}

export const useDeviceControl = (options: DeviceControlOptions = {}) => {
  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({});
  const [lastStatus, setLastStatus] = useState<Record<string, DeviceStatus>>({});
  const [error, setError] = useState<string | null>(null);

  const defaultOptions: DeviceControlOptions = {
    optimisticUpdate: true,
    ...options
  };

  // Control a device via API
  const controlDevice = async (deviceId: string, status: 'on' | 'off'): Promise<boolean> => {
    setIsToggling(prev => ({ ...prev, [deviceId]: true }));
    setError(null);
    
    // Optimistic update if enabled
    if (defaultOptions.optimisticUpdate) {
      setLastStatus(prev => ({
        ...prev,
        [deviceId]: {
          deviceId,
          status,
          timestamp: new Date().toISOString()
        }
      }));
    }
    
    try {
      const response = await authorizedAxiosInstance.post(`/devices/${deviceId}/control`, {
        status
      });
      
      if (response.data) {
        setLastStatus(prev => ({
          ...prev,
          [deviceId]: {
            deviceId,
            status,
            timestamp: new Date().toISOString()
          }
        }));
        
        if (defaultOptions.onSuccess) {
          defaultOptions.onSuccess(response.data);
        }
        
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error(`Lỗi khi điều khiển thiết bị ${deviceId}:`, err);
      setError(`Không thể điều khiển thiết bị: ${err.response?.data?.message || err.message}`);
      
      // Revert optimistic update on error
      if (defaultOptions.optimisticUpdate) {
        setLastStatus(prev => {
          const { [deviceId]: removed, ...rest } = prev;
          return rest;
        });
      }
      
      if (defaultOptions.onError) {
        defaultOptions.onError(err);
      }
      
      return false;
    } finally {
      setIsToggling(prev => ({ ...prev, [deviceId]: false }));
    }
  };  
  // Control a device by name via MQTT
  const controlDeviceByName = async (deviceName: string, status: 'on' | 'off'): Promise<boolean> => {
    setError(null);
    
    try {
      // Use the Adafruit MQTT controller endpoint to directly publish to the device topic
      const response = await authorizedAxiosInstance.post('/adafruit/publish', {
        feed: deviceName.toLowerCase().replace(/\s+/g, '_'),
        payload: status.toUpperCase(),
        retain: true
      });
      
      if (response.data) {
        if (defaultOptions.onSuccess) {
          defaultOptions.onSuccess(response.data);
        }
        return true;
      }
      
      return false;
    } catch (err:any) {
      console.error(`Lỗi khi điều khiển thiết bị ${deviceName} qua MQTT:`, err);
      setError(`Không thể điều khiển thiết bị: ${err.response?.data?.message || err.message}`);
      
      if (defaultOptions.onError) {
        defaultOptions.onError(err);
      }
      
      return false;
    }
  };
  
  // Check if a device is currently toggling
  const isDeviceToggling = (deviceId: string): boolean => {
    return !!isToggling[deviceId];
  };
  
  // Get the last known status for a device
  const getDeviceLastStatus = (deviceId: string): DeviceStatus | null => {
    return lastStatus[deviceId] || null;
  };
  
  // Test MQTT connection by publishing a test message
  const testMqttConnection = async (deviceName: string, value: string): Promise<boolean> => {
    setError(null);
    
    try {
      const response = await authorizedAxiosInstance.post('/api/test/mqtt', {
        deviceName,
        value
      });
      
      if (response.status === 200) {
        if (defaultOptions.onSuccess) {
          defaultOptions.onSuccess(response.data);
        }
        return true;
      }
      
      return false;
    } catch (err:any) {
      console.error('Lỗi khi kiểm tra kết nối MQTT:', err);
      setError(`Không thể kết nối MQTT: ${err.response?.data?.message || err.message}`);
      
      if (defaultOptions.onError) {
        defaultOptions.onError(err);
      }
      
      return false;
    }
  };
  
  return {
    controlDevice,
    controlDeviceByName,
    isDeviceToggling,
    isToggling,
    getDeviceLastStatus,
    lastStatus,
    error,
    testMqttConnection
  };
}