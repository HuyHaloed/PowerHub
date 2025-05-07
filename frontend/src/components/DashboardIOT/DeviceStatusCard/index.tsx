// src/components/DashboardIOT/DeviceStatusCard.tsx
import React, { useState, useEffect } from 'react';
import { Device } from '@/types/dashboard.types';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Lightbulb, Tv, AirVent, AreaChart, Thermometer, Refrigerator, Plug, Laptop, ZapOff, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import authorizedAxiosInstance from '@/lib/axios';

interface DeviceStatusCardProps {
  device: Device;
  onToggle: (status: "on" | "off") => void;
  isToggling?: boolean;
}

// Thêm interface cho thiết lập ngưỡng quá tải
interface OverloadThreshold {
  isEnabled: boolean;
  value: number;
  action: 'turnOn' | 'turnOff';
}

const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({ 
  device, 
  onToggle,
  isToggling = false
}) => {
  const [threshold, setThreshold] = useState<OverloadThreshold | null>(null);
  const [isLoadingThreshold, setIsLoadingThreshold] = useState(false);

  // Fetch threshold info when the component mounts
  useEffect(() => {
    const fetchThreshold = async () => {
      try {
        setIsLoadingThreshold(true);
        const response = await authorizedAxiosInstance.get(`/devices/${device.id}/threshold`);
        if (response.data) {
          setThreshold({
            isEnabled: response.data.isEnabled,
            value: response.data.value,
            action: response.data.action,
          });
        }
      } catch (error) {
        console.error("Không thể lấy thông tin ngưỡng quá tải:", error);
      } finally {
        setIsLoadingThreshold(false);
      }
    };

    fetchThreshold();
  }, [device.id]);

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
  
  // Check if device is exceeding threshold
  const isExceedingThreshold = (): boolean => {
    if (!threshold || !threshold.isEnabled) return false;
    
    if (threshold.action === 'turnOff') {
      return device.consumption >= threshold.value;
    } else {
      return device.consumption <= threshold.value;
    }
  };
  
  // Get threshold indicator if needed
  const getThresholdIndicator = () => {
    if (!threshold || !threshold.isEnabled) return null;
    
    const isExceeding = isExceedingThreshold();
    const thresholdText = threshold.action === 'turnOff'
      ? `Thiết bị sẽ tự động tắt khi tiêu thụ vượt quá ${threshold.value}W`
      : `Thiết bị sẽ tự động bật khi tiêu thụ thấp hơn ${threshold.value}W`;

    const currentStatusText = isExceeding
      ? 'Đã vượt ngưỡng thiết lập!'
      : 'Đang hoạt động dưới ngưỡng thiết lập';
      
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`absolute top-3 right-3 p-1 rounded-full ${isExceeding ? 'bg-orange-100' : 'bg-blue-100'}`}>
              {isExceeding ? (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              ) : (
                <ZapOff className="h-4 w-4 text-blue-600" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <div className="p-1 max-w-xs">
              <p className="font-medium text-sm">{thresholdText}</p>
              <p className="text-xs mt-1">{currentStatusText}</p>
              <p className="text-xs font-medium mt-1">Mức tiêu thụ hiện tại: {formatConsumption(device.consumption)}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md relative ${device.status === 'on' ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white' : 'bg-white'}`}>
      {/* Add threshold indicator if enabled */}
      {getThresholdIndicator()}
      
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
        
        {/* Consumption and status section */}
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs text-gray-500">Tiêu thụ</span>
            <p className={`font-medium ${device.status.toUpperCase() === 'ON' ? 'text-blue-600' : 'text-gray-400'}`}>
              {formatConsumption(device.consumption)}
              
              {/* Display small threshold indicator next to consumption if applicable */}
              {threshold?.isEnabled && (
                <span className={`ml-2 text-xs font-normal ${isExceedingThreshold() ? 'text-orange-500' : 'text-blue-500'}`}>
                  {isExceedingThreshold() 
                    ? `↑ Ngưỡng: ${threshold.value}W` 
                    : `↓ Ngưỡng: ${threshold.value}W`}
                </span>
              )}
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
          <span className="text-xs text-gray-500 block">Cập nhật cuối: {new Date(device.lastUpdated).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceStatusCard;