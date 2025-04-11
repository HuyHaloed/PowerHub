import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardData } from '@/data/dashboardIOT';
import { DashboardData } from '@/types/dashboard.types';
import authorizedAxiosInstance from '@/lib/axios';
import { useAccount } from '@/hooks/useAccount';

// Hàm lấy dữ liệu từ API
const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    // Gọi API
    const response = await authorizedAxiosInstance.get<{ result: DashboardData }>('/api/dashboard');
    return response.data.result;
  } catch (error) {
    console.log('Error fetching dashboard data, using mock data', error);
    // Nếu có lỗi, sử dụng dữ liệu mẫu
    return dashboardData;
  }
};

// Hook chính để lấy dữ liệu Dashboard
export const useDashboardData = () => {
  const { data: user } = useAccount();
  
  // Sử dụng React Query để quản lý và cache dữ liệu
  return useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: fetchDashboardData,
    initialData: dashboardData,
    enabled: !!user?.id, // Chỉ gọi API khi đã có user
    refetchInterval: 60000, // Tự động cập nhật mỗi phút
    refetchOnWindowFocus: true, // Cập nhật khi focus lại tab
    retry: 1, // Thử lại 1 lần nếu có lỗi
    staleTime: 30000, // Dữ liệu được coi là "stale" sau 30 giây
  });
};

// Hook để lấy dữ liệu năng lượng theo loại thời gian
export const useEnergyData = (timeRange: 'day' | 'week' | 'month' | 'year' = 'day') => {
  const { data } = useDashboardData();
  
  if (!data) return [];
  
  switch (timeRange) {
    case 'day':
      return data.dailyEnergyData;
    case 'week':
      return data.weeklyEnergyData;
    case 'month':
      return data.monthlyEnergyData;
    case 'year':
      return data.yearlyEnergyData;
    default:
      return data.dailyEnergyData;
  }
};

// Hook để lấy danh sách thiết bị
export const useDevices = () => {
  const { data } = useDashboardData();
  return data?.devices || [];
};

// Hook để lấy danh sách thiết bị đang hoạt động
export const useActiveDevices = () => {
  const devices = useDevices();
  return devices.filter((device: { status: string }) => device.status === 'on');};

// Hook để lấy phân phối năng lượng
export const useEnergyDistribution = () => {
  const { data } = useDashboardData();
  return data?.energyDistribution || [];
};

// Hook để lấy danh sách cảnh báo
export const useAlerts = () => {
  const { data } = useDashboardData();
  return data?.alerts || [];
};

// Hook để lấy danh sách cảnh báo chưa đọc
export const useUnreadAlerts = () => {
  const alerts = useAlerts();
  return alerts.filter((alert: { read: boolean }) => !alert.read);};

// Hook để lấy thống kê nhanh
export const useQuickStats = () => {
  const { data } = useDashboardData();
  return data?.quickStats || [];
};

// Hook để cập nhật trạng thái thiết bị
export const useDeviceControl = () => {
  const { data, refetch } = useDashboardData();
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  
  const toggleDevice = async (deviceId: number, newStatus: "on" | "off") => {
    setLoading(prev => ({ ...prev, [deviceId]: true }));
    
    try {
      await authorizedAxiosInstance.post(`/api/devices/${deviceId}/toggle`, {
        status: newStatus
      });
      
      await refetch();
    } catch (error) {
      console.error('Error toggling device', error);
    } finally {
      setLoading(prev => ({ ...prev, [deviceId]: false }));
    }
  };
  
  return { toggleDevice, loading };
};