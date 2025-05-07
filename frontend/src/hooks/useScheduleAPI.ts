// src/hooks/useScheduleAPI.ts
import { useState, useCallback, useEffect } from 'react';
import authorizedAxiosInstance from '@/lib/axios';
import { DeviceSchedule } from '@/types/dashboard.types';
import { toast } from 'react-toastify';

export function useSchedules() {
  const [schedules, setSchedules] = useState<DeviceSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSchedules = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authorizedAxiosInstance.get('/schedules');
      setSchedules(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError(err instanceof Error ? err : new Error('Đã xảy ra lỗi khi tải lịch trình'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSchedule = useCallback(async (schedule: DeviceSchedule) => {
    try {
      const response = await authorizedAxiosInstance.post('/schedules', schedule);
      toast.success('Lịch trình đã được tạo thành công');
      await fetchSchedules();
      return response.data;
    } catch (err) {
      toast.error('Không thể tạo lịch trình');
      throw err;
    }
  }, [fetchSchedules]);

  const updateSchedule = useCallback(async (id: string, schedule: DeviceSchedule) => {
    try {
      const response = await authorizedAxiosInstance.put(`/schedules/${id}`, schedule);
      toast.success('Lịch trình đã được cập nhật');
      await fetchSchedules();
      return response.data;
    } catch (err) {
      toast.error('Không thể cập nhật lịch trình');
      throw err;
    }
  }, [fetchSchedules]);

// src/hooks/useScheduleAPI.ts (continued)
const deleteSchedule = useCallback(async (deviceId: string) => {
    try {
      await authorizedAxiosInstance.delete(`/schedules/${deviceId}`);
      toast.success('Lịch trình đã được xóa');
      await fetchSchedules();
      return true;
    } catch (err) {
      toast.error('Không thể xóa lịch trình');
      throw err;
    }
  }, [fetchSchedules]);

  const toggleScheduleStatus = useCallback(async (deviceId: string, isActive: boolean) => {
    try {
      await authorizedAxiosInstance.put(`/schedules/${deviceId}/status`, { isActive });
      toast.success(`Lịch trình đã được ${isActive ? 'kích hoạt' : 'vô hiệu hóa'}`);
      await fetchSchedules();
      return true;
    } catch (err) {
      toast.error('Không thể cập nhật trạng thái lịch trình');
      throw err;
    }
  }, [fetchSchedules]);

  const getScheduleForDevice = useCallback(async (deviceId: string) => {
    try {
      const response = await authorizedAxiosInstance.get(`/schedules/${deviceId}`);
      return response.data;
    } catch (err) {
    //   // Don't show error toast here as it's expected to not find schedules for some devices
    //   if (err.response && err.response.status !== 404) {
    //     toast.error('Không thể tải lịch trình');
    //   }
      return null;
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    isLoading,
    error,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleScheduleStatus,
    getScheduleForDevice
  };
}