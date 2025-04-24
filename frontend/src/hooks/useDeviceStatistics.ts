import { useState, useEffect } from 'react';
import axios from 'axios';

interface DeviceTypeDistributionItem {
  type: string;
  count: number;
  percentage: number;
}

interface DeviceStatistics {
  totalDevices: number;
  activeDevices: number;
  totalEnergyConsumption: number;
  averageDeviceUptime: number;
  deviceTypeDistribution: DeviceTypeDistributionItem[];
}

export function useDeviceStatistics() {
  const [statistics, setStatistics] = useState<DeviceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeviceStatistics = async () => {
      try {
        const response = await axios.get('device/device-statistics');
        setStatistics(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch device statistics');
        setLoading(false);
      }
    };

    fetchDeviceStatistics();
  }, []);

  return { statistics, loading, error };
}