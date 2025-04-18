import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useEnergyDistribution } from '@/hooks/useDashboardIOTData';
import { EnergyDistribution } from '@/types/dashboard.types';

const EnergyDistributionChart: React.FC = () => {
  const { data: energyDistributionData = [] } = useEnergyDistribution();

  // Ensure data is an array and map it to the format recharts expects
  const chartData = Array.isArray(energyDistributionData) 
    ? energyDistributionData.map((item: EnergyDistribution) => ({
        name: item.name,
        value: item.value,
        color: item.color
      }))
    : [];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">Phân phối năng lượng</h2>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || `hsl(${index * 360 / chartData.length}, 70%, 50%)`} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [
                `${value.toLocaleString()} kWh`, 
                name
              ]}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center text-gray-500 py-8">
          Không có dữ liệu phân phối năng lượng
        </div>
      )}
    </div>
  );
};

export default EnergyDistributionChart;