// src/hooks/useDeviceControl.ts
import { useState } from 'react';
import authorizedAxiosInstance from '@/lib/axios';

export const useDeviceControl = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
  
    const toggleDevice = async (deviceId: string, deviceName: string, newStatus: 'on' | 'off') => {
      setIsLoading(true);
      setError(null);
  
      try {
        // Cập nhật trạng thái thiết bị trong MongoDB
        const response = await authorizedAxiosInstance.put(`/devices/control-by-name`, {
          name: deviceName,
          status: newStatus
        });
  
        // Publish tới Adafruit MQTT
        await authorizedAxiosInstance.post('/adafruit/publish', {
          feed: deviceName,  // Feed name is the device name
          payload: newStatus,
          retain: true,
          qosLevel: 1
        });
  
        return response.data;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Lỗi không xác định'));
        throw err;
      } finally {
        setIsLoading(false);
      }
    };  
    return { toggleDevice, isLoading, error };
};