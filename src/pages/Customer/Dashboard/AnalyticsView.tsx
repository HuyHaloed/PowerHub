import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Download, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useEnergyData, useEnergyDistribution } from '@/hooks/useDashboardData';

export default function AnalyticsView() {
  // States for date range selection
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  // Get energy data based on selected time range
  const energyData = useEnergyData(timeRange);
  const energyDistribution = useEnergyDistribution();
  
  // Comparison data (simulated)
  const comparisonValue = timeRange === 'day' ? 5 : timeRange === 'week' ? 12 : timeRange === 'month' ? 8 : 15;
  const isIncrease = comparisonValue > 0;
  
  // Calculate some statistics
  const totalConsumption = energyData.reduce((sum, item) => sum + item.value, 0);
  const avgConsumption = totalConsumption / energyData.length;
  const peakConsumption = Math.max(...energyData.map(item => item.value));
  const lowestConsumption = Math.min(...energyData.map(item => item.value));
  
  // Cost calculation (simplified)
  const costPerKwh = 3500; // 3,500 VND per kWh
  const estimatedCost = totalConsumption * costPerKwh;
  
  // Format date for display
  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, 'dd/MM/yyyy', { locale: vi });
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Phân tích tiêu thụ điện</h1>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 pl-3 pr-3">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateDisplay(startDate)} - {formatDateDisplay(endDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={startDate}
                  selected={{
                    from: startDate,

                    to: endDate
                  }}
                  onSelect={(range) => {
                    setStartDate(range?.from);
                    setEndDate(range?.to);
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Select value={timeRange} onValueChange={(value: 'day' | 'week' | 'month' | 'year') => setTimeRange(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Khoảng thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Theo ngày</SelectItem>
              <SelectItem value="week">Theo tuần</SelectItem>
              <SelectItem value="month">Theo tháng</SelectItem>
              <SelectItem value="year">Theo năm</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Xuất dữ liệu
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tổng tiêu thụ</CardDescription>
            <CardTitle className="text-2xl">{totalConsumption.toLocaleString()} kWh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              {isIncrease ? (
                <TrendingUp className="mr-2 h-4 w-4 text-red-500" />
              ) : (
                <TrendingDown className="mr-2 h-4 w-4 text-green-500" />
              )}
              <span className={`text-sm ${isIncrease ? 'text-red-500' : 'text-green-500'}`}>
                {Math.abs(comparisonValue)}% so với kỳ trước
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tiêu thụ trung bình</CardDescription>
            <CardTitle className="text-2xl">{avgConsumption.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Zap className="mr-2 h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-500">
                {timeRange === 'day' ? 'Mỗi giờ' : timeRange === 'week' ? 'Mỗi ngày' : timeRange === 'month' ? 'Mỗi ngày' : 'Mỗi tháng'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tiêu thụ cao nhất</CardDescription>
            <CardTitle className="text-2xl">{peakConsumption.toLocaleString()} kWh</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-sm text-gray-500">
              {timeRange === 'day' ? '18:00 - 20:00' : timeRange === 'week' ? 'Thứ 7' : timeRange === 'month' ? 'Ngày 15' : 'Tháng 7'}
            </span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chi phí ước tính</CardDescription>
            <CardTitle className="text-2xl">{estimatedCost.toLocaleString()} VNĐ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-gray-500">
              Giá điện: {costPerKwh.toLocaleString()} VNĐ/kWh
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Detail Analysis Tabs */}
      <Tabs defaultValue="consumption" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="consumption">Tiêu thụ điện</TabsTrigger>
          <TabsTrigger value="distribution">Phân phối tiêu thụ</TabsTrigger>
          <TabsTrigger value="comparison">So sánh</TabsTrigger>
          <TabsTrigger value="predict">Dự báo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="consumption">
          <Card>
            <CardHeader>
              <CardTitle>Biểu đồ tiêu thụ điện năng</CardTitle>
              <CardDescription>
                Phân tích tiêu thụ điện theo {timeRange === 'day' ? 'giờ' : timeRange === 'week' ? 'ngày' : timeRange === 'month' ? 'tháng' : 'năm'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={energyData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} kWh`, 'Tiêu thụ']} />
                    <Legend />
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
        </TabsContent>
        
        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Phân phối tiêu thụ theo thiết bị</CardTitle>
              <CardDescription>
                Tỷ lệ tiêu thụ điện theo từng loại thiết bị
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={energyDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {energyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Tỷ lệ sử dụng']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>So sánh với kỳ trước</CardTitle>
              <CardDescription>
                So sánh mức tiêu thụ hiện tại với kỳ trước đó
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={energyData.map(item => ({
                      name: item.name,
                      'Kỳ này': item.value,
                      'Kỳ trước': item.value * (1 - comparisonValue / 100)
                    }))}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Kỳ này" fill="#0088FE" />
                    <Bar dataKey="Kỳ trước" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="predict">
          <Card>
            <CardHeader>
              <CardTitle>Dự báo tiêu thụ</CardTitle>
              <CardDescription>
                Dự báo mức tiêu thụ điện trong thời gian tới
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      ...energyData,

                      ...Array(4).fill(null).map((_, index) => {
                        const lastValue = energyData[energyData.length - 1].value;
                        const predictedValue = lastValue * (1 + 0.05 * (index + 1));
                        
                        return {
                          name: `Dự báo ${index + 1}`,
                          value: lastValue,
                          prediction: predictedValue
                        };
                      })
                    ]}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      name="Tiêu thụ thực tế" 
                      stroke="#0088FE" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="prediction" 
                      name="Dự báo" 
                      stroke="#FF8042" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-700 mb-2">Nhận xét</h4>
                <p className="text-sm text-gray-700">
                  Dựa trên mô hình dự báo, lượng tiêu thụ điện dự kiến sẽ tăng khoảng 5-20% trong thời gian tới.
                  Đề xuất tối ưu hóa việc sử dụng điều hòa và các thiết bị có công suất lớn vào giờ thấp điểm.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}