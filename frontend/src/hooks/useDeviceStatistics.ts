import { useState, useEffect } from 'react';
import axios from 'axios';
import { DeviceStatistics} from '@/types/device';



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