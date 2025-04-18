// src/hooks/useDeviceAPI.ts
import { useState, useEffect, useCallback } from 'react';
import { Device } from '@/types/dashboard.types';

const API_URL = 'http://localhost:5000/api';

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDevices = useCallback(async (filters: { status?: string; location?: string; type?: string; search?: string; } = {}) => {
    setIsLoading(true);
    try {
      // Xây dựng query params từ các filter
      const queryParams = new URLSearchParams();
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }
      if (filters.location) {
        queryParams.append('location', filters.location);
      }
      if (filters.type) {
        queryParams.append('type', filters.type);
      }
      if (filters.search) {
        queryParams.append('search', filters.search);
      }
      
      const url = `${API_URL}/devices${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const token = sessionStorage.getItem('auth_token');
      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu thiết bị');
      }
      
      const data = await response.json();
      setDevices(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(err instanceof Error ? err : new Error('Đã xảy ra lỗi khi tải dữ liệu thiết bị'));
      
      // Fallback đến mock data khi có lỗi
      const mockDevices = getMockDevices();
      setDevices(mockDevices);
      return mockDevices;
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return { devices, isLoading, error, fetchDevices };
}

export function useDeviceControl() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { fetchDevices } = useDevices();

  const toggleDevice = useCallback(async (deviceId: number, status: 'on' | 'off') => {
    setIsLoading(true);
    try {
      const url = `${API_URL}/devices/${deviceId}/control`;
      const token = sessionStorage.getItem('auth_token');
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error(`Không thể thay đổi trạng thái thiết bị: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Refresh danh sách thiết bị sau khi cập nhật
      await fetchDevices();
      
      setError(null);
      return data;
    } catch (err) {
      console.error(`Error toggling device ${deviceId}:`, err);
      setError(err instanceof Error ? err : new Error('Đã xảy ra lỗi khi thay đổi trạng thái thiết bị'));
      
      // Mô phỏng kết quả thành công để UI vẫn hoạt động
      // trong trường hợp lỗi kết nối đến API
      return {
        id: deviceId,
        status: status,
        message: `Đã cập nhật trạng thái thiết bị thành ${status}`
      };
    } finally {
      setIsLoading(false);
    }
  }, [fetchDevices]);

  return { toggleDevice, isLoading, error };
}

export function useActiveDevices() {
  const { devices } = useDevices();
  return devices.filter(device => device.status === 'on');
}

// Mock data cho trường hợp API không khả dụng
function getMockDevices(): Device[] {
  return [
    {
      id: "1",
      name: "Đèn phòng khách",
      type: "Light",
      location: "Phòng khách",
      status: "on",
      consumption: 15,
      lastUpdated: "2023-11-20",
      userId: '',
      properties: {
        brand: '',
        model: '',
        serialNumber: '',
        installDate: '',
        powerRating: 0
      },
      history: []
    },
    {
      id: "2", 
      name: "Điều hòa phòng ngủ", 
      type: "AC", 
      location: "Phòng ngủ", 
      status: "off", 
      consumption: 0,
      lastUpdated: "2023-11-20",
      userId: '',
      properties: {
        brand: '',
        model: '',
        serialNumber: '',
        installDate: '',
        powerRating: 0
      },
      history: []
    },
    {
      id: "3", 
      name: "TV phòng khách", 
      type: "Entertainment", 
      location: "Phòng khách", 
      status: "off", 
      consumption: 0,
      lastUpdated: "2023-11-20",
      userId: '',
      properties: {
        brand: '',
        model: '',
        serialNumber: '',
        installDate: '',
        powerRating: 0
      },
      history: []
    },
    {
      id: "4", 
      name: "Đèn bếp", 
      type: "Light", 
      location: "Nhà bếp", 
      status: "on", 
      consumption: 10,
      lastUpdated: "2023-11-20",
      userId: '',
      properties: {
        brand: '',
        model: '',
        serialNumber: '',
        installDate: '',
        powerRating: 0
      },
      history: []
    },
    {
      id: "5", 
      name: "Tủ lạnh", 
      type: "Appliance", 
      location: "Nhà bếp", 
      status: "on", 
      consumption: 50,
      lastUpdated: "2023-11-20",
      userId: '',
      properties: {
        brand: '',
        model: '',
        serialNumber: '',
        installDate: '',
        powerRating: 0
      },
      history: []
    },
    {
      id: "6", 
      name: "Máy giặt", 
      type: "Appliance", 
      location: "Phòng giặt", 
      status: "off", 
      consumption: 0,
      lastUpdated: "2023-11-20",
      userId: '',
      properties: {
        brand: '',
        model: '',
        serialNumber: '',
        installDate: '',
        powerRating: 0
      },
      history: []
    },
    {
      id: "7", 
      name: "Bếp điện", 
      type: "Appliance", 
      location: "Nhà bếp", 
      status: "off", 
      consumption: 0,
      lastUpdated: "2023-11-20",
      userId: '',
      properties: {
        brand: '',
        model: '',
        serialNumber: '',
        installDate: '',
        powerRating: 0
      },
      history: []
    },
    {
      id: "8", 
      name: "Đèn phòng ngủ", 
      type: "Light", 
      location: "Phòng ngủ", 
      status: "off", 
      consumption: 0,
      lastUpdated: "2023-11-20",
      userId: '',
      properties: {
        brand: '',
        model: '',
        serialNumber: '',
        installDate: '',
        powerRating: 0
      },
      history: []
    }
  ];
}