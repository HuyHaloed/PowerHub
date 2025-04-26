// src/hooks/useDeviceControl.ts
import { useState } from 'react';
import authorizedAxiosInstance from '@/lib/axios';

export const useDeviceControl = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
  
    const toggleDevice = async (deviceName: string, newStatus: 'on' | 'off') => {
      setIsLoading(true);
      setError(null);
  
      try {
        // Tìm thiết bị theo tên
        const deviceResponse = await authorizedAxiosInstance.get(`/devices?search=${encodeURIComponent(deviceName)}`);
        const devices = deviceResponse.data;
        
        if (!devices || devices.length === 0) {
          throw new Error(`Không tìm thấy thiết bị có tên '${deviceName}'`);
        }
        
        // Lấy ID của thiết bị đầu tiên có tên phù hợp
        const deviceId = devices[0].id;
        
        // Chuyển đổi sang chữ hoa cho API
        const statusForApi = newStatus.toUpperCase();
        
        // Cập nhật trạng thái thiết bị trong MongoDB sử dụng API hiện có
        const response = await authorizedAxiosInstance.put(`/devices/${deviceId}/control`, {
          status: statusForApi // Gửi "ON" hoặc "OFF"
        });
  
        // Publish tới Adafruit MQTT với trạng thái chữ hoa
        await authorizedAxiosInstance.post('/adafruit/publish', {
          feed: deviceName,
          payload: statusForApi, // Gửi "ON" hoặc "OFF"
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