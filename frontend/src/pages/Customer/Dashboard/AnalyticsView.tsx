import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  useEnergyConsumption,
  useEnergyDistribution,
  useEnergyPredictions,
  useEnergyComparison
} from '@/hooks/useEnergyData';

const timeRangeOptions = [
  { id: 'day', label: 'Ngày' },
  { id: 'week', label: 'Tuần' },
  { id: 'month', label: 'Tháng' },
  { id: 'year', label: 'Năm' }
];

const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState('day');
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTab, setSelectedTab] = useState('consumption');

  const { data: consumptionData, isLoading: isConsumptionLoading } = 
    useEnergyConsumption(timeRange, startDate, endDate);
  
  const { data: distributionData, isLoading: isDistributionLoading } = 
    useEnergyDistribution(endDate);
  
  const { data: predictionsData, isLoading: isPredictionsLoading } = 
    useEnergyPredictions(timeRange, 7);
  
  const { data: comparisonData, isLoading: isComparisonLoading } = 
    useEnergyComparison(timeRange, startDate, endDate);


  const formatConsumptionData = (data: any[]) => {
    if (!data) return [];
    return data.map(item => ({
      time: formatTime(item.date, timeRange),
      consumption: parseFloat(item.value.toFixed(2))
    }));
  };

  const formatPredictionData = (data: any[]) => {
    if (!data) return [];
    return data.map(item => ({
      time: formatTime(item.date, timeRange),
      prediction: parseFloat(item.value.toFixed(2))
    }));
  };


  const formatTime = (dateString: string, timeRange: string) => {
    const date = new Date(dateString);
    
    switch (timeRange) {
      case 'day':
        return date.getHours() + ':00';
      case 'week':
        return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
      case 'month':
        return date.getDate() + '/' + (date.getMonth() + 1);
      case 'year':
        return ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'][date.getMonth()];
      default:
        return dateString;
    }
  };

  // Render loading state
  const renderLoading = () => (
    <div className="h-72 flex items-center justify-center">
      <p className="text-gray-500">Đang tải dữ liệu...</p>
    </div>
  );

  // Render consumption tab
  const renderConsumptionTab = () => {
    if (isConsumptionLoading) return renderLoading();
    
    return (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formatConsumptionData(consumptionData)}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis unit=" kWh" />
            <Tooltip formatter={(value) => [`${value} kWh`, 'Tiêu thụ']} />
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
    );
  };

  // Render distribution tab
  const renderDistributionTab = () => {
    if (isDistributionLoading) return renderLoading();
    
    const chartData = distributionData?.map(item => ({
      name: item.name,
      value: item.value,
      color: item.color
    })) || [];
    
    return (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render predictions tab
  const renderPredictionsTab = () => {
    if (isPredictionsLoading) return renderLoading();
    
    return (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formatPredictionData(predictionsData)}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis unit=" kWh" />
            <Tooltip formatter={(value) => [`${value} kWh`, 'Dự đoán']} />
            <Legend />
            <Line
              type="monotone"
              dataKey="prediction"
              stroke="#9C27B0"
              activeDot={{ r: 8 }}
              name="Dự đoán tiêu thụ"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render comparison tab
  const renderComparisonTab = () => {
    if (isComparisonLoading) return renderLoading();
    
    if (!comparisonData) return (
      <div className="h-72 flex items-center justify-center">
        <p className="text-gray-500">Không có dữ liệu so sánh</p>
      </div>
    );
    
    const formatComparisonData = () => {
      const currentData = comparisonData.currentPeriod?.map((item: any) => ({
        time: formatTime(item.date, timeRange),
        current: parseFloat(item.value.toFixed(2)),
        previous: 0
      })) || [];
      
      comparisonData.previousPeriod?.forEach((item: any, index: number) => {
        if (index < currentData.length) {
          currentData[index].previous = parseFloat(item.value.toFixed(2));
        }
      });
      
      return currentData;
    };
    
    return (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formatComparisonData()}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis unit=" kWh" />
            <Tooltip formatter={(value) => [`${value} kWh`, '']} />
            <Legend />
            <Bar dataKey="current" name="Kỳ hiện tại" fill="#4CAF50" />
            <Bar dataKey="previous" name="Kỳ trước" fill="#2196F3" />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="font-medium">
            So với kỳ trước: 
            <span className={`ml-2 ${comparisonData.comparison.change >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {comparisonData.comparison.change >= 0 ? '+' : ''}{comparisonData.comparison.change}%
            </span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Phân tích năng lượng</h1>
      
      {/* Filter controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h2 className="text-lg font-medium mb-2">Thời gian</h2>
            <div className="flex space-x-2">
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
          
          <div className="flex space-x-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Từ ngày</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Đến ngày</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b">
          <nav className="flex">
            <button
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                selectedTab === 'consumption' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab('consumption')}
            >
              Tiêu thụ
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                selectedTab === 'distribution' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab('distribution')}
            >
              Phân bố
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                selectedTab === 'predictions' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab('predictions')}
            >
              Dự đoán
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                selectedTab === 'comparison' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab('comparison')}
            >
              So sánh
            </button>
          </nav>
        </div>
        
        {/* Tab content */}
        <div className="p-4">
          {selectedTab === 'consumption' && renderConsumptionTab()}
          {selectedTab === 'distribution' && renderDistributionTab()}
          {selectedTab === 'predictions' && renderPredictionsTab()}
          {selectedTab === 'comparison' && renderComparisonTab()}
        </div>
      </div>
      
      {/* Stats and insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-10">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-2">Tổng tiêu thụ</h3>
          <p className="text-3xl font-bold text-blue-600">
            {!isConsumptionLoading && consumptionData 
              ? `${consumptionData.reduce((sum: number, item: any) => sum + item.value, 0).toFixed(2)} kWh`
              : '—'}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-2">Tiêu thụ trung bình</h3>
          <p className="text-3xl font-bold text-green-600">
            {!isConsumptionLoading && consumptionData && consumptionData.length > 0
              ? `${(consumptionData.reduce((sum: number, item: any) => sum + item.value, 0) / consumptionData.length).toFixed(2)} kWh`
              : '—'}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-2">Chi phí ước tính</h3>
          <p className="text-3xl font-bold text-purple-600">
            {!isConsumptionLoading && consumptionData
              ? `${(consumptionData.reduce((sum: number, item: any) => sum + item.value, 0) * 2500).toLocaleString()} VNĐ`
              : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsView;