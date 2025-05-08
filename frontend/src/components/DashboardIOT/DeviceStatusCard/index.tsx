import React, { useState, useEffect } from 'react';
import { Device } from '@/types/dashboard.types';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Lightbulb, Tv, AirVent, AreaChart, Thermometer, Refrigerator, Plug, Laptop, ZapOff, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import authorizedAxiosInstance from '@/lib/axios';
import { useDeviceEnergyData } from '@/hooks/useDeviceEnergyData';

interface DeviceStatusCardProps {
  device: Device;
  onToggle: (status: "on" | "off") => void;
  isToggling?: boolean;
}

// Interface for threshold settings
interface OverloadThreshold {
  isEnabled: boolean;
  value: number;
  action: 'turnOn' | 'turnOff';
  feedName: string;
}

const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({ 
  device, 
  onToggle,
  isToggling = false
}) => {
  const [threshold, setThreshold] = useState<OverloadThreshold | null>(null);
  const [isLoadingThreshold, setIsLoadingThreshold] = useState(false);
  const [lastThresholdCheck, setLastThresholdCheck] = useState<number>(0);
  
  // Use our new hook to get real-time energy consumption
  const { getDeviceEnergyData, isLoading: isLoadingEnergyData } = useDeviceEnergyData([device.id]);
  const energyData = getDeviceEnergyData(device.id);

  // Use energy data from Adafruit IO if available, otherwise use the value from the device object
  const currentConsumption = energyData?.consumption !== undefined ? energyData.consumption : device.consumption;

  // Xác định feedName dựa trên loại thiết bị
  const determineFeedName = (deviceType: string): string => {
    const type = deviceType.toLowerCase();
    if (type.includes('light')) {
      return 'powerlight';
    } else if (type.includes('fan')) {
      return 'powerfan';
    } else if (type.includes('air') || type.includes('ac')) {
      return 'powerac';
    } else if (type.includes('tv')) {
      return 'powertv';
    } else {
      return 'powerlight'; // Mặc định nếu không xác định được
    }
  };

  // Fetch threshold info when the component mounts
  useEffect(() => {
    const fetchThreshold = async () => {
      try {
        setIsLoadingThreshold(true);
        const response = await authorizedAxiosInstance.get(`/devices/${device.id}/threshold`);
        if (response.data) {
          // Dùng feedName dựa trên loại thiết bị
          const feedName = determineFeedName(device.type);
          
          setThreshold({
            isEnabled: response.data.isEnabled,
            value: response.data.value,
            action: response.data.action,
            feedName: feedName
          });
        }
      } catch (error) {
        console.error("Không thể lấy thông tin ngưỡng quá tải:", error);
      } finally {
        setIsLoadingThreshold(false);
      }
    };

    fetchThreshold();
  }, [device.id, device.type]);

  // Kiểm tra cập nhật trạng thái thiết bị dựa vào ngưỡng
  useEffect(() => {
    // Chỉ kiểm tra nếu threshold đã được kích hoạt và có dữ liệu tiêu thụ
    if (threshold?.isEnabled && currentConsumption !== undefined && !isLoadingThreshold) {
      const isExceeding = isExceedingThreshold();
      
      // Tránh kiểm tra liên tục bằng cách chỉ kiểm tra sau mỗi 5 giây
      const now = Date.now();
      if (now - lastThresholdCheck > 5000) {
        checkAndApplyThreshold(isExceeding);
        setLastThresholdCheck(now);
      }
    }
  }, [currentConsumption, threshold?.isEnabled, device.status]);

  // Kiểm tra và áp dụng ngưỡng nếu cần
  const checkAndApplyThreshold = async (isExceeding: boolean) => {
    if (!threshold || !threshold.isEnabled) return;
    
    // Xác định trạng thái mục tiêu dựa trên ngưỡng và hành động
    let targetStatus: "on" | "off" | null = null;
    
    if (isExceeding) {
      // Nếu vượt ngưỡng
      if (threshold.action === 'turnOff') {
        targetStatus = 'off';
      } else if (threshold.action === 'turnOn') {
        targetStatus = 'on';
      }
    } 
    
    // Chỉ kích hoạt khi có trạng thái mục tiêu và khác trạng thái hiện tại
    const currentStatus = device.status.toLowerCase() as "on" | "off";
    
    if (targetStatus && targetStatus !== currentStatus) {
      try {
        // Gọi API để thay đổi trạng thái thiết bị theo ngưỡng
        await authorizedAxiosInstance.post(`/thresholds/check/${device.id}`);
        
        // Nếu thành công, thông báo cho component cha
        onToggle(targetStatus);
        
        console.log(`Thiết bị ${device.name} đã được ${targetStatus === 'on' ? 'bật' : 'tắt'} do ${threshold.action === 'turnOff' ? 'vượt quá' : 'thấp hơn'} ngưỡng ${threshold.value}W`);
      } catch (error) {
        console.error("Lỗi khi áp dụng ngưỡng quá tải:", error);
      }
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
      return currentConsumption >= threshold.value;
    } else {
      return currentConsumption <= threshold.value;
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
              <p className="text-xs font-medium mt-1">Mức tiêu thụ hiện tại: {formatConsumption(currentConsumption)}</p>
              <p className="text-xs mt-1">Feed: <span className="font-medium">{threshold.feedName}</span></p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

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
  
  // Format the last updated timestamp
  const formatLastUpdated = () => {
    const timestamp = energyData?.lastUpdated 
      ? new Date(energyData.lastUpdated)
      : new Date(device.lastUpdated);
      
    return timestamp.toLocaleString();
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
              {isLoadingEnergyData ? (
                <span className="text-xs text-gray-400">Đang tải...</span>
              ) : (
                formatConsumption(currentConsumption)
              )}
              
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
          <span className="text-xs text-gray-500 block">Cập nhật cuối: {formatLastUpdated()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceStatusCard;