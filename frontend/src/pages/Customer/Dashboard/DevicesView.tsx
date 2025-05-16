import React, { useState, useEffect } from 'react';
import { useDevices, useDeviceControl } from '@/hooks/useDeviceAPI';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import DeviceStatusCard from '@/components/DashboardIOT/DeviceStatusCard';
import { Plus, Search, Filter, Sliders, ZapOff } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Device } from '@/types/dashboard.types';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import authorizedAxiosInstance from '@/lib/axios';
import { ShareDeviceModal } from '@/components/DashboardIOT/ShareDeviceModal';
import VoiceMicro from '@/components/DashboardIOT/VoiceMicro';
import DeviceScheduler from '@/components/DashboardIOT/DeviceScheduler'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Thêm interface cho thiết lập ngưỡng quá tải
interface OverloadThreshold {
  isEnabled: boolean;
  value: number; // giá trị ngưỡng (Watt)
  action: 'turnOn' | 'turnOff'; // hành động khi vượt ngưỡng
}

export default function DevicesView() {
  const { devices: allDevices, isLoading, error, fetchDevices } = useDevices();
  const { toggleDevice, isLoading: isToggling } = useDeviceControl();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "on" | "off">("all");
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOverloadModalOpen, setIsOverloadModalOpen] = useState(false);
  const [selectedDeviceForThreshold, setSelectedDeviceForThreshold] = useState<Device | null>(null);
  const [overloadThreshold, setOverloadThreshold] = useState<OverloadThreshold>({
    isEnabled: false,
    value: 100,
    action: 'turnOff',
  });
  const [newDevice, setNewDevice] = useState({
    name: "",
    type: "",
    location: "",
    properties: {
      brand: "",
      model: "",
      serialNumber: "",
      powerRating: 0,
    },
  });

  useEffect(() => {
    let result = [...allDevices];
    if (activeFilter !== "all") {
      result = result.filter(device => device.status === activeFilter);
    }
    if (locationFilter) {
      result = result.filter(device => device.location === locationFilter);
    }
    if (typeFilter) {
      result = result.filter(device => device.type === typeFilter);
    }
    if (searchTerm) {
      result = result.filter(device => 
        device.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredDevices(result);
  }, [allDevices, activeFilter, locationFilter, typeFilter, searchTerm]);

  // Xử lý lỗi
  useEffect(() => {
    if (error) {
      toast.error("Không thể tải dữ liệu thiết bị: " + error.message);
    }
  }, [error]);

  // Lấy danh sách vị trí và loại thiết bị duy nhất cho bộ lọc
  const locations = Array.from(new Set(allDevices.map(device => device.location))).filter(Boolean) as string[];
  const deviceTypes = Array.from(new Set(allDevices.map(device => device.type))).filter(Boolean) as string[];

  // Nhóm thiết bị theo vị trí
  const devicesByLocation: Record<string, Device[]> = {};
  filteredDevices.forEach(device => {
    const location = device.location || 'Không xác định';
    if (!devicesByLocation[location]) {
      devicesByLocation[location] = [];
    }
    devicesByLocation[location].push(device);
  });

  // Lấy thông tin ngưỡng quá tải cho thiết bị
  const fetchDeviceThreshold = async (deviceId: string) => {
    try {
      const response = await authorizedAxiosInstance.get(`/devices/${deviceId}/threshold`);
      if (response.data) {
        setOverloadThreshold({
          isEnabled: response.data.isEnabled,
          value: response.data.value,
          action: response.data.action,
        });
      }
    } catch (error) {
      console.error("Không thể lấy thông tin ngưỡng quá tải:", error);
      // Set default values if no threshold is set
      setOverloadThreshold({
        isEnabled: false,
        value: 100,
        action: 'turnOff',
      });
    }
  };

  const handleToggleDevice = async (deviceName: string, newStatus: "on" | "off") => {
    try {
      await toggleDevice(deviceName, newStatus);
      toast.success(`Đã ${newStatus === 'on' ? 'bật' : 'tắt'} thiết bị thành công`);
      fetchDevices();
    } catch (err) {
      toast.error("Không thể thay đổi trạng thái thiết bị");
      console.error(err);
    }
  };

  // Đặt lại bộ lọc
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

  // Xử lý thay đổi input trong form thêm thiết bị
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name in newDevice.properties) {
      setNewDevice({
        ...newDevice,
        properties: {
          ...newDevice.properties,
          [name]: name === "powerRating" ? parseInt(value) || 0 : value,
        },
      });
    } else {
      setNewDevice({
        ...newDevice,
        [name]: value,
      });
    }
  };

  // Xử lý thêm thiết bị mới
  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authorizedAxiosInstance.post('/devices', {
        Name: newDevice.name,
        Type: newDevice.type,
        Location: newDevice.location,
        Properties: newDevice.properties,
      });
  
      // Kiểm tra userIds
      const userIds = response.data.userIds || [];
      const firstUserId = userIds.length > 0 ? userIds[0] : null;
  
      toast.success("Thêm thiết bị thành công!");
      setIsAddModalOpen(false);
      fetchDevices();
      setNewDevice({
        name: "",
        type: "",
        location: "",
        properties: {
          brand: "",
          model: "",
          serialNumber: "",
          powerRating: 0,
        },
      });
    } catch (err) {
      toast.error("Không thể thêm thiết bị: " + (err as Error).message);
      console.error(err);
    }
  };

  // Mở modal thiết lập ngưỡng quá tải
  const openOverloadModal = (device: Device) => {
    setSelectedDeviceForThreshold(device);
    fetchDeviceThreshold(device.id);
    setIsOverloadModalOpen(true);
  };

  // Lưu thiết lập ngưỡng quá tải
  const saveOverloadThreshold = async () => {
    if (!selectedDeviceForThreshold) return;

    try {
      await authorizedAxiosInstance.post(`/devices/${selectedDeviceForThreshold.id}/threshold`, overloadThreshold);
      toast.success("Đã lưu thiết lập ngưỡng quá tải!");
      setIsOverloadModalOpen(false);
      // Refresh device list to make sure threshold indicators update
      fetchDevices();
    } catch (err) {
      toast.error("Không thể lưu thiết lập ngưỡng quá tải: " + (err as Error).message);
      console.error(err);
    }
  };

  // Kiểm tra xem thiết bị có đang vượt ngưỡng hay không
  const isDeviceExceedingThreshold = (device: Device, threshold: OverloadThreshold) => {
    if (!threshold.isEnabled) return false;
    
    if (threshold.action === 'turnOff') {
      return device.consumption >= threshold.value;
    } else {
      return device.consumption <= threshold.value;
    }
  };

  // Hiển thị thẻ thiết bị với nút thiết lập ngưỡng quá tải
  const renderDeviceCard = (device: Device) => (
    <div key={device.id} className="relative">
      <DeviceStatusCard 
        device={device} 
        onToggle={(status) => handleToggleDevice(device.name, status)}
      />
      <div className="absolute top-2 right-2 flex gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                className="p-1 bg-orange-100 rounded-full hover:bg-orange-200 transition-colors"
                onClick={() => openOverloadModal(device)}
              >
                <ZapOff className="h-4 w-4 text-orange-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Thiết lập ngưỡng quá tải</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <ShareDeviceModal 
          device={device}
          onDeviceShared={() => fetchDevices()}
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <VoiceMicro />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Quản lý thiết bị</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Bộ lọc
          </Button> */}
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Thêm thiết bị mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm thiết bị mới</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddDevice} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium">Tên thiết bị</label>
                  <Input
                    id="name"
                    name="name"
                    value={newDevice.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên thiết bị"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium">Loại thiết bị</label>
                  <Input
                    id="type"
                    name="type"
                    value={newDevice.type}
                    onChange={handleInputChange}
                    placeholder="Nhập loại thiết bị (e.g., Light, AC)"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium">Vị trí</label>
                  <Input
                    id="location"
                    name="location"
                    value={newDevice.location}
                    onChange={handleInputChange}
                    placeholder="Nhập vị trí (e.g., Phòng khách)"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium">Thương hiệu</label>
                  <Input
                    id="brand"
                    name="brand"
                    value={newDevice.properties.brand}
                    onChange={handleInputChange}
                    placeholder="Nhập thương hiệu"
                  />
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm font-medium">Model</label>
                  <Input
                    id="model"
                    name="model"
                    value={newDevice.properties.model}
                    onChange={handleInputChange}
                    placeholder="Nhập model"
                  />
                </div>
                <div>
                  <label htmlFor="serialNumber" className="block text-sm font-medium">Số serial</label>
                  <Input
                    id="serialNumber"
                    name="serialNumber"
                    value={newDevice.properties.serialNumber}
                    onChange={handleInputChange}
                    placeholder="Nhập số serial"
                  />
                </div>
                <div>
                  <label htmlFor="powerRating" className="block text-sm font-medium">Công suất (W)</label>
                  <Input
                    id="powerRating"
                    name="powerRating"
                    type="number"
                    value={newDevice.properties.powerRating}
                    onChange={handleInputChange}
                    placeholder="Nhập công suất"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit">Thêm</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Modal thiết lập ngưỡng quá tải */}
      <Dialog open={isOverloadModalOpen} onOpenChange={setIsOverloadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thiết lập ngưỡng quá tải</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="threshold-enabled"
                checked={overloadThreshold.isEnabled}
                onCheckedChange={(checked) => setOverloadThreshold({...overloadThreshold, isEnabled: checked})}
              />
              <Label htmlFor="threshold-enabled">
                {overloadThreshold.isEnabled ? 'Kích hoạt' : 'Không kích hoạt'}
              </Label>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Ngưỡng điện năng tiêu thụ: {overloadThreshold.value} Watt
              </label>
              <Slider
                defaultValue={[overloadThreshold.value]}
                min={10}
                max={1000}
                step={10}
                onValueChange={(value) => setOverloadThreshold({...overloadThreshold, value: value[0]})}
                disabled={!overloadThreshold.isEnabled}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Hành động khi vượt ngưỡng</label>
              <Select
                value={overloadThreshold.action}
                onValueChange={(value: 'turnOn' | 'turnOff') => setOverloadThreshold({...overloadThreshold, action: value})}
                disabled={!overloadThreshold.isEnabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn hành động" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="turnOff">Tắt thiết bị</SelectItem>
                  <SelectItem value="turnOn">Bật thiết bị</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-gray-50 rounded-md p-3 text-sm">
              <div className="font-medium mb-1">Cách hoạt động:</div>
              <p className="text-gray-600">
                {overloadThreshold.isEnabled
                  ? overloadThreshold.action === 'turnOff'
                    ? `Khi mức tiêu thụ điện của thiết bị vượt quá ${overloadThreshold.value} Watt, thiết bị sẽ tự động tắt.`
                    : `Khi mức tiêu thụ điện của thiết bị giảm xuống dưới ${overloadThreshold.value} Watt, thiết bị sẽ tự động bật.`
                  : 'Tính năng ngưỡng quá tải đang tắt cho thiết bị này.'}
              </p>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsOverloadModalOpen(false)}>Hủy</Button>
              <Button onClick={saveOverloadThreshold}>Lưu</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tìm kiếm và Bộ lọc */}
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

      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Thiết bị</TabsTrigger>
          <TabsTrigger value="scheduler">Lịch trình</TabsTrigger>
        </TabsList>
        
        <TabsContent value="devices">
          {Object.keys(devicesByLocation).length > 0 ? (
            Object.keys(devicesByLocation).map((location) => (
              <div key={location} className="mb-8">
                <h2 className="text-lg font-medium mb-4">{location}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {devicesByLocation[location].map(renderDeviceCard)}
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
        </TabsContent>
        
        <TabsContent value="scheduler">
          <DeviceScheduler devices={filteredDevices} />
        </TabsContent>
      </Tabs>
    </div>
  );
}