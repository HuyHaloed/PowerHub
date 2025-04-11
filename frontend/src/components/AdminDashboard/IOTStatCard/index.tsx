import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart } from 'lucide-react';
import { IOTStatistics } from '@/types/adminDashboard.types';
import { 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from 'recharts';

interface IOTStatCardProps {
  statistics: IOTStatistics;
}

export default function IOTStatCard({ statistics }: IOTStatCardProps) {
  // Transform device type distribution for pie chart
  const deviceTypeData = Object.entries(statistics.deviceTypeDistribution).map(
    ([name, value]) => ({ name, value })
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="mr-2 h-5 w-5" /> 
            Device Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Devices</p>
              <p className="text-2xl font-bold">{statistics.totalDevices}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Devices</p>
              <p className="text-2xl font-bold text-green-600">
                {statistics.activeDevices}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Energy</p>
              <p className="text-2xl font-bold">
                {statistics.totalEnergyConsumption.toFixed(1)} kWh
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Device Uptime</p>
              <p className="text-2xl font-bold">
                {statistics.averageDeviceUptime.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="mr-2 h-5 w-5" /> 
            Device Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={deviceTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceTypeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name) => [
                    `${value} (${((value / statistics.totalDevices) * 100).toFixed(1)}%)`, 
                    name
                  ]}                 />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-2">
            {deviceTypeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <div 
                  className="h-3 w-3 mr-1 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs">{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}