// src/components/DashboardIOT/DeviceStatusCard.tsx
import React from 'react';
import { Device } from '@/types/dashboard.types';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Lightbulb, Tv, AirVent, AreaChart, Thermometer, Refrigerator, Plug, Laptop } from 'lucide-react';

interface DeviceStatusCardProps {
  device: Device;
  onToggle: (status: "on" | "off") => void;
  isToggling?: boolean; // Thêm tham số với dấu ? để biểu thị nó là tùy chọn
}

const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({ 
  device, 
  onToggle,
  isToggling = false
}) => {
  const getDeviceIcon = () => {
    const isOn = device.status.toUpperCase() === 'ON';
    
    switch(device.type?.toLowerCase()) {
      case 'light':
        return <Lightbulb className={`h-5 w-5 ${isOn ? 'text-yellow-500' : 'text-gray-400'}`} />;
      case 'tv':
      case 'entertainment':
        return <Tv className={`h-5 w-5 ${isOn ? 'text-blue-500' : 'text-gray-400'}`} />;
      case 'ac':
        return <AirVent className={`h-5 w-5 ${isOn ? 'text-blue-500' : 'text-gray-400'}`} />;
      case 'sensor':
        return <AreaChart className={`h-5 w-5 ${isOn ? 'text-green-500' : 'text-gray-400'}`} />;
      case 'thermostat':
        return <Thermometer className={`h-5 w-5 ${isOn ? 'text-red-500' : 'text-gray-400'}`} />;
      case 'refrigerator':
        return <Refrigerator className={`h-5 w-5 ${isOn ? 'text-blue-500' : 'text-gray-400'}`} />;
      case 'computer':
      case 'laptop':
        return <Laptop className={`h-5 w-5 ${isOn ? 'text-purple-500' : 'text-gray-400'}`} />;
      default:
        return <Plug className={`h-5 w-5 ${isOn ? 'text-blue-500' : 'text-gray-400'}`} />;
    }
  };
  const handleToggle = () => {
    const newStatus = (device.status.toUpperCase() === 'ON') ? 'off' : 'on';
    onToggle(newStatus);
  };
  const formatConsumption = (value: number): string => {
    if (value === 0) return '0 W';
    if (value < 1000) return `${value} W`;
    return `${(value / 1000).toFixed(1)} kW`;
  };
  
  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md ${device.status === 'on' ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white' : 'bg-white'}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${device.status === 'on' ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {getDeviceIcon()}
            </div>
            <div>
              <h3 className="font-medium text-gray-800 line-clamp-1">{device.name}</h3>
              <p className="text-sm text-gray-500">{device.location}</p>
            </div>
          </div>
          <Switch
            checked={device.status.toUpperCase() === 'ON'}
            disabled={isToggling}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-[var(--primary-ground)] data-[state=unchecked]:bg-gray-200"
          />

        </div>
        
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-500">Tiêu thụ</span>
            <p className={`font-medium ${device.status.toUpperCase() === 'ON' ? 'text-blue-600' : 'text-gray-400'}`}>
              {formatConsumption(device.consumption)}
            </p>
          </div>
          <div>
            <Badge 
              variant="outline" 
              className={`${
                device.status.toUpperCase() === 'ON' 
                  ? 'border-green-200 bg-green-50 text-green-700' 
                  : 'border-gray-200 bg-gray-50 text-gray-500'
              }`}
            >
              {device.status.toUpperCase() === 'ON' ? 'Đang hoạt động' : 'Đã tắt'}
            </Badge>
          </div>
        </div>
        
        <div className="mt-2">
          <span className="text-xs text-gray-500 block">Cập nhật cuối: {device.lastUpdated}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceStatusCard;