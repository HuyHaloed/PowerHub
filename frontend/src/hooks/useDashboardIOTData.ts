import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardData, Alert, Device, EnergyConsumption } from '@/types/dashboard.types';
import authorizedAxiosInstance from '@/lib/axios';
import { useAccount } from '@/hooks/useAccount';

// Fetch dashboard data from API
const fetchDashboardData = async (): Promise<DashboardData> => {
  const response = await authorizedAxiosInstance.get('/dashboard');
  return response.data;
};

// Hook for dashboard data
export const useDashboardData = () => {
  const { data: user } = useAccount();
  
  return useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: fetchDashboardData,
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
    refetchOnWindowFocus: true,
    retry: 1,
    staleTime: 30000,
  });
};

// Fetch energy data by time range
const fetchEnergyData = async (timeRange: string, startDate?: Date, endDate?: Date): Promise<EnergyConsumption[]> => {
  try {
    const params = new URLSearchParams();
    params.append('timeRange', timeRange);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    
    const response = await authorizedAxiosInstance.get(`/energy/consumption?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching energy data', error);
    throw error; // Rethrow to let the caller handle the error
  }
};

// Hook for energy data
export const useEnergyData = (timeRange: 'day' | 'week' | 'month' | 'year' = 'day', startDate?: Date, endDate?: Date) => {
  const { data: user } = useAccount();
  
  return useQuery({
    queryKey: ['energyData', user?.id, timeRange, startDate, endDate],
    queryFn: () => fetchEnergyData(timeRange, startDate, endDate),
    enabled: !!user?.id,
    staleTime: 60000,
  });
};

// Fetch energy distribution data
const fetchEnergyDistribution = async (): Promise<any[]> => {
  try {
    const response = await authorizedAxiosInstance.get('/energy/distribution');
    return response.data;
  } catch (error) {
    console.error('Error fetching energy distribution', error);
    throw error;
  }
};

// Hook for energy distribution
export const useEnergyDistribution = () => {
  const { data: user } = useAccount();
  
  return useQuery({
    queryKey: ['energyDistribution', user?.id],
    queryFn: fetchEnergyDistribution,
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });
};

// Fetch devices
const fetchDevices = async (filters: { status?: string; location?: string; type?: string; search?: string } = {}): Promise<Device[]> => {
  try {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.location) params.append('location', filters.location);
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    
    const response = await authorizedAxiosInstance.get(`/devices?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching devices', error);
    throw error;
  }
};

// Hook for devices
export const useDevices = (filters: { status?: string; location?: string; type?: string; search?: string } = {}) => {
  const { data: user } = useAccount();
  
  const result = useQuery({
    queryKey: ['devices', user?.id, filters],
    queryFn: () => fetchDevices(filters),
    enabled: !!user?.id,
  });
  
  return {
    devices: result.data || [],
    isLoading: result.isLoading,
    error: result.error,
    fetchDevices: () => result.refetch()
  };
};

// Hook for active devices
export const useActiveDevices = () => {
  const { data: user } = useAccount();
  
  return useQuery({
    queryKey: ['activeDevices', user?.id],
    queryFn: () => authorizedAxiosInstance.get('/devices/active').then(res => res.data),
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });
};

// Toggle device status mutation
export const useDeviceControl = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async ({ deviceId, status }: { deviceId: number | string, status: "on" | "off" }) => {
      return authorizedAxiosInstance.put(`/devices/${deviceId}/control`, { status });
    },
    onSuccess: () => {
      // Invalidate and refetch queries that depend on this data
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['activeDevices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
  
  return { 
    toggleDevice: (deviceId: number, newStatus: "on" | "off") => mutation.mutate({ deviceId, status: newStatus }),
    loading: mutation.isPending 
  };
};

// Fetch alerts
const fetchAlerts = async (unreadOnly = false): Promise<Alert[]> => {
  try {
    const endpoint = unreadOnly ? '/dashboard/alerts/unread' : '/dashboard/alerts';
    const response = await authorizedAxiosInstance.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching alerts', error);
    throw error;
  }
};

// Hook for alerts
export const useAlerts = (unreadOnly = false) => {
  const { data: user } = useAccount();
  
  return useQuery({
    queryKey: ['alerts', user?.id, unreadOnly],
    queryFn: () => fetchAlerts(unreadOnly),
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });
};

// Hook for unread alerts
export const useUnreadAlerts = () => {
  return useAlerts(true);
};

// Fetch quick stats
const fetchQuickStats = async () => {
  try {
    const response = await authorizedAxiosInstance.get('/dashboard/quick-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching quick stats', error);
    throw error;
  }
};

// Hook for quick stats
export const useQuickStats = () => {
  const { data: user } = useAccount();
  
  return useQuery({
    queryKey: ['quickStats', user?.id],
    queryFn: fetchQuickStats,
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });
};

// Analytics data fetching
export const useAnalyticsData = (timeRange: string, startDate?: Date, endDate?: Date) => {
  const { data: user } = useAccount();
  
  return useQuery({
    queryKey: ['analytics', user?.id, timeRange, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      
      const response = await authorizedAxiosInstance.get(`/analytics?${params.toString()}`);
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });
};

// Compare energy usage
export const useEnergyComparison = (timeRange: string, startDate?: Date, endDate?: Date) => {
  const { data: user } = useAccount();
  
  return useQuery({
    queryKey: ['energyComparison', user?.id, timeRange, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      
      const response = await authorizedAxiosInstance.get(`/energy/compare?${params.toString()}`);
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });
};

// Energy predictions
export const useEnergyPredictions = (timeRange: string, periods: number = 4) => {
  const { data: user } = useAccount();
  
  return useQuery({
    queryKey: ['energyPredictions', user?.id, timeRange, periods],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      params.append('periods', periods.toString());
      
      const response = await authorizedAxiosInstance.get(`/energy/predictions?${params.toString()}`);
      return response.data;
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
  });
};