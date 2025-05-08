import { useState, useEffect } from 'react';
import authorizedAxiosInstance from '@/lib/axios';

export interface DeviceSchedule {
  id: string;
  deviceId: string;
  onTime: string;
  offTime: string;
  daysOfWeek: number[];
  adafruitFeed: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleParams {
  deviceId: string;
  onTime: string;
  offTime: string;
  daysOfWeek: number[];
}

export interface UpdateScheduleParams extends CreateScheduleParams {
  id: string;
  isActive?: boolean;
}

export const useDeviceSchedule = (deviceId?: string) => {
  const [schedule, setSchedule] = useState<DeviceSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch schedule for a specific device
  const fetchSchedule = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authorizedAxiosInstance.get(`/devices/${id}/schedule`);
      if (response.data) {
        setSchedule(response.data);
      } else {
        setSchedule(null);
      }
    } catch (err) {
      console.error("Lỗi khi tải lịch trình thiết bị:", err);
      setError("Không thể tải lịch trình thiết bị");
      setSchedule(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new schedule
  const createSchedule = async (params: CreateScheduleParams): Promise<DeviceSchedule | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authorizedAxiosInstance.post('/schedules', params);
      if (response.data) {
        setSchedule(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      console.error("Lỗi khi tạo lịch trình thiết bị:", err);
      setError("Không thể tạo lịch trình thiết bị");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing schedule
  const updateSchedule = async (params: UpdateScheduleParams): Promise<DeviceSchedule | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authorizedAxiosInstance.put(`/schedules/${params.id}`, params);
      if (response.data) {
        setSchedule(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      console.error("Lỗi khi cập nhật lịch trình thiết bị:", err);
      setError("Không thể cập nhật lịch trình thiết bị");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a schedule
  const deleteSchedule = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authorizedAxiosInstance.delete(`/schedules/${id}`);
      if (response.status === 200) {
        setSchedule(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Lỗi khi xóa lịch trình thiết bị:", err);
      setError("Không thể xóa lịch trình thiết bị");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle schedule active status
  const toggleScheduleStatus = async (id: string, isActive: boolean): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authorizedAxiosInstance.patch(`/schedules/${id}/status`, { isActive });
      if (response.status === 200) {
        setSchedule(prev => prev ? { ...prev, isActive } : null);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Lỗi khi thay đổi trạng thái lịch trình:", err);
      setError("Không thể thay đổi trạng thái lịch trình");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load schedule data on component mount if deviceId is provided
  useEffect(() => {
    if (deviceId) {
      fetchSchedule(deviceId);
    }
  }, [deviceId]);

  return {
    schedule,
    isLoading,
    error,
    fetchSchedule,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleScheduleStatus
  };
};