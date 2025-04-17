// src/pages/Customer/Dashboard/DevicesView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDevices, useDeviceControl } from '@/hooks/useDeviceAPI';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeviceStatusCard from '@/components/DashboardIOT/DeviceStatusCard';
import { Plus, Search, Filter, Sliders } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Device } from '@/types/dashboard.types';
import { toast } from 'react-toastify';

export default function DevicesView() {
  const { devices: allDevices, isLoading, error, fetchDevices } = useDevices();
  const { toggleDevice, isLoading: isToggling } = useDeviceControl();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "on" | "off">("all");
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  
  // Áp dụng bộ lọc
  useEffect(() => {
    // Áp dụng các bộ lọc cho dữ liệu thiết bị hiện tại
    let result = [...allDevices];
    
    // Lọc theo trạng thái
    if (activeFilter !== "all") {
      result = result.filter(device => device.status === activeFilter);
    }
    
    // Lọc theo vị trí
    if (locationFilter) {
      result = result.filter(device => device.location === locationFilter);
    }
    
    // Lọc theo loại
    if (typeFilter) {
      result = result.filter(device => device.type === typeFilter);
    }
    
    // Lọc theo tìm kiếm
    if (searchTerm) {
      result = result.filter(device => 
        device.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredDevices(result);
  }, [allDevices, activeFilter, locationFilter, typeFilter, searchTerm]);
  
  // Hiển thị thông báo lỗi nếu có
  useEffect(() => {
    if (error) {
      toast.error("Không thể tải dữ liệu thiết bị: " + error.message);
    }
  }, [error]);
  
  // Get unique locations for filtering
  const locations = Array.from(new Set(allDevices.map(device => device.location))).filter(Boolean) as string[];
  const deviceTypes = Array.from(new Set(allDevices.map(device => device.type))).filter(Boolean) as string[];
  
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
  const handleToggleDevice = async (id: number, newStatus: "on" | "off") => {
    try {
      await toggleDevice(id, newStatus);
      toast.success(`Đã ${newStatus === 'on' ? 'bật' : 'tắt'} thiết bị thành công`);
    } catch (err) {
      toast.error("Không thể thay đổi trạng thái thiết bị");
      console.error(err);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setActiveFilter("all");
    setLocationFilter(null);
    setTypeFilter(null);
  };

  // Xử lý tìm kiếm 
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Hiển thị loading
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
              onChange={(e) => handleSearch(e.target.value)}
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
          <div className="mt-4 flex flex-wrap items-center gap-2">
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