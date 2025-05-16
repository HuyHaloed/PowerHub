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
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import { 
  useEnergyConsumption,
  useEnergyDistribution,
  useEnergyPredictions,
  useEnergyComparison
} from '@/hooks/useEnergyData';

import PredictionChart from '@/components/DashboardIOT/PredictionChart';

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
  
  const periods = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : timeRange === 'month' ? 31 : timeRange === 'year' ? 12 : 7;
  const { data: predictionsData, isLoading: isPredictionsLoading } = 
    useEnergyPredictions(timeRange, periods);
  
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

  const renderLoading = () => (
    <div className="h-72 flex items-center justify-center">
      <p className="text-gray-500">Đang tải dữ liệu...</p>
    </div>
  );

  const renderConsumptionTab = () => {
    if (isConsumptionLoading) return renderLoading();
    const data = formatConsumptionData(consumptionData);
    const total = data.reduce((sum, item) => sum + item.consumption, 0);
    const avg = data.length > 0 ? total / data.length : 0;
    const cost = total * 2500;
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold mb-4">Tiêu thụ điện</h2>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" />
            <YAxis unit=" kWh" />
            <Tooltip formatter={(value: any) => [`${value} kWh`, 'Tiêu thụ']} />
            <Legend />
            <Area
              type="monotone"
              dataKey="consumption"
              stroke="#4CAF50"
              fillOpacity={1}
              fill="url(#colorConsumption)"
              name="Tiêu thụ điện"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-lg font-medium mb-2">Tổng tiêu thụ</h3>
            <p className="text-3xl font-bold text-blue-600">{total.toFixed(2)} kWh</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="text-lg font-medium mb-2">Tiêu thụ trung bình</h3>
            <p className="text-3xl font-bold text-green-600">{avg.toFixed(2)} kWh</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="text-lg font-medium mb-2">Chi phí ước tính</h3>
            <p className="text-3xl font-bold text-purple-600">{cost.toLocaleString()} VNĐ</p>
          </div>
        </div>
      </div>
    );
  };

  const renderDistributionTab = () => {
    if (isDistributionLoading) return renderLoading();
    const chartData = distributionData?.map(item => ({
      name: item.name,
      value: item.value,
      color: item.color
    })) || [];
    const total = chartData.reduce((sum: number, item: any) => sum + item.value, 0);
    const maxType = chartData.reduce((max: any, item: any) => (item.value > (max?.value || 0) ? item : max), { name: '', value: 0, color: '' });
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold mb-4">Phân bố tiêu thụ</h2>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => [`${value} kWh`, 'Tiêu thụ']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-lg font-medium mb-2">Tổng loại</h3>
            <p className="text-3xl font-bold text-blue-600">{chartData.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="text-lg font-medium mb-2">Tổng tiêu thụ</h3>
            <p className="text-3xl font-bold text-green-600">{total.toFixed(2)} kWh</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="text-lg font-medium mb-2">Loại cao nhất</h3>
            <p className="text-3xl font-bold text-purple-600">{maxType ? `${maxType.name} (${maxType.value.toFixed(2)} kWh)` : '—'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderPredictionsTab = () => {
    if (isPredictionsLoading) return renderLoading();
    const data = formatPredictionData(predictionsData);
    const uniquePredictionData: typeof data = [];
    const seenTimes = new Set();
    for (const item of data) {
      if (!seenTimes.has(item.time)) {
        uniquePredictionData.push(item);
        seenTimes.add(item.time);
      }
    }
    let fullXAxis: string[] = [];
    if (timeRange === 'day') {
      fullXAxis = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    } else if (timeRange === 'week') {
      fullXAxis = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    } else if (timeRange === 'month') {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      fullXAxis = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}/${now.getMonth() + 1}`);
    } else if (timeRange === 'year') {
      fullXAxis = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    }
    const mergedData = fullXAxis.map(label => {
      const found = uniquePredictionData.find(item => item.time === label);
      return found || { time: label, prediction: 0 };
    });
    const total = mergedData.reduce((sum: number, item: any) => sum + item.prediction, 0);
    const avg = mergedData.length > 0 ? total / mergedData.length : 0;
    const max = mergedData.reduce((max: number, item: any) => (item.prediction > max ? item.prediction : max), 0);
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold mb-4">Dự đoán tiêu thụ</h2>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9C27B0" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#9C27B0" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" />
            <YAxis unit=" kWh" />
            <Tooltip formatter={(value: any) => [`${value} kWh`, 'Dự đoán']} />
            <Legend />
            <Area
              type="monotone"
              dataKey="prediction"
              stroke="#9C27B0"
              fillOpacity={1}
              fill="url(#colorPrediction)"
              name="Dự đoán tiêu thụ"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="text-lg font-medium mb-2">Tổng dự đoán</h3>
            <p className="text-3xl font-bold text-blue-600">{total.toFixed(2)} kWh</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h3 className="text-lg font-medium mb-2">Dự đoán trung bình</h3>
            <p className="text-3xl font-bold text-green-600">{avg.toFixed(2)} kWh</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="text-lg font-medium mb-2">Dự đoán cao nhất</h3>
            <p className="text-3xl font-bold text-purple-600">{max.toFixed(2)} kWh</p>
          </div>
        </div>
      </div>
    );
  };

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
    const compData = formatComparisonData();
    const totalCurrent = compData.reduce((sum: number, item: any) => sum + item.current, 0);
    const totalPrev = compData.reduce((sum: number, item: any) => sum + item.previous, 0);
    const percentChange = totalPrev === 0 ? 0 : ((totalCurrent - totalPrev) / totalPrev) * 100;
    const isIncrease = percentChange >= 0;

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 border border-gray-200 shadow-md rounded">
            <p className="font-medium">{label}</p>
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-green-600">Kỳ hiện tại: {payload[0]?.payload?.current?.toFixed(2)} kWh</span>
              <span className="text-blue-600">Kỳ trước: {payload[0]?.payload?.previous?.toFixed(2)} kWh</span>
            </div>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold mb-4">So sánh tiêu thụ</h2>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={compData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="barCurrentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#A5D6A7" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="barPrevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2196F3" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#90CAF9" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" />
            <YAxis unit=" kWh" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="current" name="Kỳ hiện tại" fill="url(#barCurrentGradient)" radius={[12, 12, 0, 0]} barSize={28} />
            <Bar dataKey="previous" name="Kỳ trước" fill="url(#barPrevGradient)" radius={[12, 12, 0, 0]} barSize={28} />
            <Line type="monotone" dataKey="current" stroke="#388E3C" name="Hiện tại" strokeWidth={3} dot={{ r: 6, fill: '#388E3C', stroke: '#fff', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="previous" stroke="#1976D2" name="Trước" strokeWidth={3} dot={{ r: 6, fill: '#1976D2', stroke: '#fff', strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" /></svg>
            <div>
              <h3 className="text-lg font-medium mb-1">Tổng kỳ hiện tại</h3>
              <p className="text-3xl font-bold text-blue-600">{totalCurrent.toFixed(2)} kWh</p>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center gap-3">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20V10m0 0l-6 6m6-6l6 6" /></svg>
            <div>
              <h3 className="text-lg font-medium mb-1">Tổng kỳ trước</h3>
              <p className="text-3xl font-bold text-green-600">{totalPrev.toFixed(2)} kWh</p>
            </div>
          </div>
          <div className={`p-4 rounded-lg border flex items-center gap-3 ${isIncrease ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
            {isIncrease ? (
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            ) : (
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            )}
            <div>
              <h3 className="text-lg font-medium mb-1">% Thay đổi</h3>
              <p className={`text-3xl font-bold ${isIncrease ? 'text-red-500' : 'text-green-600'}`}>{isIncrease ? '+' : ''}{percentChange.toFixed(2)}%</p>
              <span className="text-xs text-gray-500">{isIncrease ? 'Tăng' : 'Giảm'} so với kỳ trước</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Phân tích năng lượng</h1>
      
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
        

        <div className="p-4">
          {selectedTab === 'consumption' && renderConsumptionTab()}
          {selectedTab === 'distribution' && renderDistributionTab()}
          {selectedTab === 'predictions' && renderPredictionsTab()}
          {selectedTab === 'comparison' && renderComparisonTab()}
        </div>
      </div>
      
      <div className="p-6">
      <PredictionChart
      />
    </div>
    </div>
  );
}

export default AnalyticsView;