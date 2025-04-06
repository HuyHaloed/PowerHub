import React, { useState } from 'react';
import { useDevices, useDeviceControl } from '@/hooks/useDashboardIOTData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeviceStatusCard from '@/components/DashboardIOT/DeviceStatusCard';
import { Plus, Search, Filter, Sliders } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Device } from '@/types/dashboard.types';

export default function DevicesView() {
  const allDevices = useDevices();
  const { toggleDevice } = useDeviceControl();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "on" | "off">("all");
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  
  // Get unique locations for filtering
  const locations = Array.from(new Set(allDevices.map(device => device.location))).filter(Boolean) as string[];
  const deviceTypes = Array.from(new Set(allDevices.map(device => device.type))).filter(Boolean) as string[];
  
  // Filter devices based on search, status, location and type
  const filteredDevices = allDevices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeFilter === "all" || device.status === activeFilter;
    const matchesLocation = !locationFilter || device.location === locationFilter;
    const matchesType = !typeFilter || device.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesLocation && matchesType;
  });
  
  // Group devices by location
  const devicesByLocation: Record<string, Device[]> = {};
  
  filteredDevices.forEach(device => {
    const location = device.location || 'Không xác định';
    if (!devicesByLocation[location]) {
      devicesByLocation[location] = [];
    }
    devicesByLocation[location].push(device);
  });
  
  // Handle device toggle
  const handleToggleDevice = (id: number, newStatus: "on" | "off") => {
    toggleDevice(id, newStatus);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setActiveFilter("all");
    setLocationFilter(null);
    setTypeFilter(null);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Quản lý thiết bị</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Bộ lọc
          </Button>
          <Button size="sm" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Thêm thiết bị mới
          </Button>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Tìm kiếm thiết bị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div>
            <Select value={activeFilter} onValueChange={(value: "all" | "on" | "off") => setActiveFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="on">Đang hoạt động</SelectItem>
                <SelectItem value="off">Đã tắt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={locationFilter ?? "all"} onValueChange={(value) => setLocationFilter(value === "all" ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Vị trí" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vị trí</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={typeFilter ?? "all"} onValueChange={(value) => setTypeFilter(value === "all" ? null : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Loại thiết bị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {deviceTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Active filters */}
        {(searchTerm || activeFilter !== "all" || locationFilter || typeFilter) && (
          <div className="mt-4 flex items-center gap-2">
            <div className="text-sm text-gray-500">Bộ lọc đang kích hoạt:</div>
            {searchTerm && (
              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Tìm kiếm: {searchTerm}
              </div>
            )}
            {activeFilter !== "all" && (
              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Trạng thái: {activeFilter === "on" ? "Đang hoạt động" : "Đã tắt"}
              </div>
            )}
            {locationFilter && (
              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Vị trí: {locationFilter}
              </div>
            )}
            {typeFilter && (
              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Loại: {typeFilter}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-7 ml-auto">
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>
      
      {/* Devices by Location */}
      {Object.keys(devicesByLocation).length > 0 ? (
        Object.keys(devicesByLocation).map((location) => (
          <div key={location} className="mb-8">
            <h2 className="text-lg font-medium mb-4">{location}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {devicesByLocation[location].map((device) => (
                <DeviceStatusCard 
                  key={device.id} 
                  device={device} 
                  onToggle={handleToggleDevice}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="rounded-full bg-gray-100 p-3">
              <Sliders className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Không tìm thấy thiết bị</h3>
            <p className="mt-2 text-sm text-gray-500 text-center max-w-xs">
              Không có thiết bị nào phù hợp với bộ lọc đã chọn. Hãy thử các bộ lọc khác.
            </p>
            <Button variant="outline" className="mt-4" onClick={resetFilters}>
              Xóa bộ lọc
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}