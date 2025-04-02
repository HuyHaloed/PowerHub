import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEnergyDistribution } from "@/hooks/useDashboardData";

export default function EnergyDistributionChart() {
  const data = useEnergyDistribution();
  
  // Custom legend renderer to add percentage
  const renderCustomizedLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <ul className="flex flex-wrap justify-center mt-4 gap-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center">
            <div
              className="h-3 w-3 mr-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs">{entry.value} ({entry.payload.value}%)</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-md font-medium">
          Phân phối tiêu thụ điện
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}%`, 'Tỷ lệ sử dụng']}
              />
              <Legend content={renderCustomizedLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}