import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import axios from 'axios';

// Base API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get auth token from sessionStorage
const getAuthToken = () => {
  return sessionStorage.getItem('auth_token');
};

interface DeviceEnergyChartProps {
  deviceId: string;
}

const DeviceEnergyChart: React.FC<DeviceEnergyChartProps> = ({ deviceId }) => {
  const [timeRange, setTimeRange] = useState('day');
  const [energyData, setEnergyData] = useState<any[]>([]);
  const [deviceDetails, setDeviceDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Time range options
  const timeRangeOptions = [
    { id: 'day', label: 'Ngày' },
    { id: 'week', label: 'Tuần' },
    { id: 'month', label: 'Tháng' },
  ];

  // Fetch device energy data
  useEffect(() => {
    const fetchDeviceEnergyData = async () => {
      setIsLoading(true);
      try {
        const token = getAuthToken();
        
        // Fetch device details
        const deviceResponse = await axios.get(`${API_URL}/devices/${deviceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setDeviceDetails(deviceResponse.data);
        
        // Fetch device energy data
        const startDate = getStartDateForTimeRange(timeRange);
        const energyResponse = await axios.get(
          `${API_URL}/analytics/devices?deviceId=${deviceId}&timeRange=${timeRange}&startDate=${startDate.toISOString()}`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (energyResponse.data && energyResponse.data.length > 0) {
          setEnergyData(energyResponse.data[0].data || []);
        } else {
          setEnergyData([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching device energy data:', err);
        setError(err);
        setEnergyData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (deviceId) {
      fetchDeviceEnergyData();
    }
  }, [deviceId, timeRange]);

  // Get start date based on time range
  const getStartDateForTimeRange = (range: string): Date => {
    const today = new Date();
    switch (range) {
      case 'week':
        return new Date(today.setDate(today.getDate() - 7));
      case 'month':
        return new Date(today.setDate(today.getDate() - 30));
      case 'day':
      default:
        return new Date(today.setHours(0, 0, 0, 0));
    }
  };

  // Format time based on time range
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    
    switch (timeRange) {
      case 'day':
        return date.getHours() + ':00';
      case 'week':
        return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
      case 'month':
        return date.getDate() + '/' + (date.getMonth() + 1);
      default:
        return dateString;
    }
  };

  // Prepare chart data
  const formatChartData = () => {
    return energyData.map((item: any) => ({
      time: formatTime(item.date),
      consumption: parseFloat(item.value.toFixed(2))
    }));
  };

  // Calculate energy metrics
  const calculateMetrics = () => {
    if (energyData.length === 0) {
      return {
        total: 0,
        average: 0,
        peak: 0,
        cost: 0
      };
    }

    const values = energyData.map(item => item.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const peak = Math.max(...values);
    
    // Assume 2500 VND per kWh
    const costPerKwh = 2500;
    const cost = total * costPerKwh;

    return {
      total: total.toFixed(2),
      average: average.toFixed(2),
      peak: peak.toFixed(2),
      cost: cost.toLocaleString()
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h2 className="text-lg font-medium">
          {deviceDetails ? `Tiêu thụ điện: ${deviceDetails.name}` : 'Tiêu thụ điện của thiết bị'}
        </h2>
        
        <div className="flex space-x-2 mt-2 sm:mt-0">
          {timeRangeOptions.map(option => (
            <button
              key={option.id}
              className={`px-3 py-1 text-sm rounded ${
                timeRange === option.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setTimeRange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : error ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-red-500">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
        </div>
      ) : energyData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Không có dữ liệu tiêu thụ trong thời gian này</p>
        </div>
      ) : (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formatChartData()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis unit=" kWh" />
                <Tooltip 
                  formatter={(value) => [`${value} kWh`, 'Tiêu thụ']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="consumption"
                  stroke="#4CAF50"
                  activeDot={{ r: 8 }}
                  name="Tiêu thụ điện"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Tổng tiêu thụ</p>
              <p className="text-xl font-semibold">{metrics.total} kWh</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Trung bình</p>
              <p className="text-xl font-semibold">{metrics.average} kWh</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Cao nhất</p>
              <p className="text-xl font-semibold">{metrics.peak} kWh</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600">Chi phí ước tính</p>
              <p className="text-xl font-semibold">{metrics.cost} VNĐ</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DeviceEnergyChart;