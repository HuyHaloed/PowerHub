import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useEnergyDistribution } from '@/hooks/useEnergyData';

// Bảng màu đẹp cho biểu đồ lấy từ ai
const COLORS = [
  '#6A5ACD', // Slate Blue (Pastel Deep Blue)
  '#FF6B6B', // Pastel Red
  '#4ECDC4', // Turquoise (Pastel Teal)
  '#A8DADC', // Pastel Blue-Gray
  '#FFD166', // Pastel Yellow
  '#6B5B95', // Pastel Indigo
  '#F4A261', // Pastel Orange
  '#2A9D8F', // Pastel Green-Blue
  '#E9C46A', // Pastel Mustard
  '#264653', // Dark Teal (Deeper Pastel)
  '#9B5DE5', // Pastel Purple
  '#00BBF9'  // Pastel Bright Blue
];

const EnergyDistributionChart: React.FC = () => {
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const { data, isLoading, error } = useEnergyDistribution(date);

  const processChartData = () => {
    if (!data || data.length === 0) return [];
    
    const deviceMap = new Map();
    
    data.forEach(item => {
      if (deviceMap.has(item.name)) {
        const existingItem = deviceMap.get(item.name);
        existingItem.value += item.value;
        existingItem.consumption += item.consumption;
      } else {
        deviceMap.set(item.name, {
          deviceId: item.deviceId,
          name: item.name,
          value: item.value,
          consumption: item.consumption
        });
      }
    });
    const groupedData = Array.from(deviceMap.values());
    groupedData.sort((a, b) => b.value - a.value);
    return groupedData.map(item => ({
      ...item,
      value: Math.round(item.value * 10) / 10
    }));
  };
  const chartData = useMemo(() => {
    const processed = processChartData();
    return processed.map((item, index) => ({
      ...item,
      color: COLORS[index % COLORS.length] 
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{`${payload[0].value}%`}</p>
          <p className="text-xs text-gray-600">{`${payload[0].payload.consumption.toFixed(2)} kWh`}</p>
        </div>
      );
    }
    return null;
  };
  const CustomLegend = ({ payload }: any) => {
    return (
      <ul className="flex flex-wrap justify-center mt-2">
        {payload.map((entry: any, index: number) => (
          <li key={`legend-${index}`} className="flex items-center mx-2 mb-1">
            <div 
              className="w-3 h-3 mr-1" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Phân bố tiêu thụ điện</h2>
        
        <div className="flex items-center">
          <label htmlFor="date-select" className="mr-2 text-sm text-gray-600">
            Ngày:
          </label>
          <input
            id="date-select"
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
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
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Không có dữ liệu cho ngày đã chọn</p>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="40%"
                labelLine={false}
                label={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} layout="horizontal" verticalAlign="bottom" align="center" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default EnergyDistributionChart;