import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useIOTStatistics } from '@/hooks/useAdminDashboard';
import IOTStatCard from '@/components/AdminDashboard/IOTStatCard';
import { 
  BarChart2, 
  PieChart, 
  Calendar 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

export default function IOTStatistics() {
  const { statistics, loading } = useIOTStatistics();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');

  // Mock data for demonstration (in real app, this would come from an API)
  const mockEnergyData = [
    { name: 'Jan', energy: 400 },
    { name: 'Feb', energy: 300 },
    { name: 'Mar', energy: 200 },
    { name: 'Apr', energy: 278 },
    { name: 'May', energy: 189 },
    { name: 'Jun', energy: 239 },
  ];

  return (
    <div className="p-6 space-y-6">
      <IOTStatCard statistics={statistics} />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <BarChart2 className="mr-2 h-5 w-5" />
              Energy Consumption Trend
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select 
                value={timeRange}
                onValueChange={(value: 'day' | 'week' | 'month' | 'year') => setTimeRange(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Last 24 Hours</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mockEnergyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="energy" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Type Distribution */}
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
                {/* Pie chart would go here */}
                <div className="flex flex-col justify-center items-center h-full">
                  <p>Pie Chart Placeholder</p>
                </div>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Energy Consumption Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Energy Consumption Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Energy Consumed</p>
                <p className="text-2xl font-bold">
                  {statistics.totalEnergyConsumption.toFixed(2)} kWh
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Daily Consumption</p>
                <p className="text-2xl font-bold">
                  {(statistics.totalEnergyConsumption / 30).toFixed(2)} kWh
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Devices</p>
                <p className="text-2xl font-bold">
                  {statistics.totalDevices}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Devices</p>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.activeDevices}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}