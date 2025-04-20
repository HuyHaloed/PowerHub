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
import { useEnergyConsumption } from '@/hooks/useEnergyData';

const timeRangeOptions = [
  { id: 'day', label: 'Ngày' },
  { id: 'week', label: 'Tuần' },
  { id: 'month', label: 'Tháng' },
  { id: 'year', label: 'Năm' }
];

const EnergyConsumptionChart = () => {
  const [timeRange, setTimeRange] = useState('day');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // Get data with improved date handling in the hook
  const { data, isLoading, error } = useEnergyConsumption(timeRange, selectedDate);

  // Format the data for display
  const formatChartData = (data: { date: string; value: number }[]) => {
    if (!data || data.length === 0) return [];
    
    // Sort the data by date first
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sortedData.map(item => ({
      time: formatTime(item.date, timeRange),
      consumption: item.value ? parseFloat(item.value.toFixed(2)) : 0,
      timestamp: new Date(item.date),
      rawDate: item.date // Keep original date for debugging
    }));
  };

  const formatTime = (dateString: string, timeRange: string) => {
    const date = new Date(dateString);
    
    switch (timeRange) {
      case 'day':
        return date.getHours() + ':00';
      case 'week':
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return days[date.getDay()];
      case 'month':
        return date.getDate() + '/' + (date.getMonth() + 1);
      case 'year':
        const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        return months[date.getMonth()];
      default:
        return dateString;
    }
  };

  const getChartTitle = () => {
    switch (timeRange) {
      case 'day':
        return 'Tiêu thụ điện năng trong ngày';
      case 'week':
        return 'Tiêu thụ điện năng trong tuần';
      case 'month':
        return 'Tiêu thụ điện năng trong tháng';
      case 'year':
        return 'Tiêu thụ điện năng trong năm';
      default:
        return 'Tiêu thụ điện năng';
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h2 className="text-lg font-medium">{getChartTitle()}</h2>
        
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

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {timeRange === 'day' ? 'Chọn ngày:' : 
           timeRange === 'week' ? 'Chọn tuần bắt đầu từ:' : 
           timeRange === 'month' ? 'Chọn tháng:' : 'Chọn năm:'}
        </label>
        <input
          type={timeRange === 'year' ? 'month' : 'date'}
          value={selectedDate}
          onChange={handleDateChange}
          className="px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : error ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-red-500">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
        </div>
      ) : data && data.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Không có dữ liệu tiêu thụ điện trong khoảng thời gian này.</p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formatChartData(data)}
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
                labelFormatter={(label) => `${label}`}
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
      )}
    </div>
  );
};

export default EnergyConsumptionChart;