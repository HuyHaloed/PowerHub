import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEnergyData } from "@/hooks/useDashboardIOTData";

type TimeRange = 'day' | 'week' | 'month' | 'year';

export default function EnergyConsumptionChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const data = useEnergyData(timeRange);
  
  const timeRanges = [
    { value: 'day', label: 'Ngày' },
    { value: 'week', label: 'Tuần' },
    { value: 'month', label: 'Tháng' },
    { value: 'year', label: 'Năm' }
  ];
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">
          Tiêu thụ điện năng
        </CardTitle>
        <div className="flex space-x-1">
          {timeRanges.map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range.value as TimeRange)}
              className="h-8 text-xs"
            >
              {range.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => [`${value} kWh`, 'Tiêu thụ']} />              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Tiêu thụ điện" 
                stroke="#0088FE" 
                activeDot={{ r: 8 }} 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}