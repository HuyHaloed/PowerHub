import React, { useState, useEffect } from 'react';
import { ZapOff, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import authorizedAxiosInstance from '@/lib/axios';

const DeviceThresholdIndicator = ({ device }: { device: { id: string; consumption: number } }) => {

  interface Threshold {
    isEnabled: boolean;
    action: 'turnOff' | 'turnOn';
    value: number;
  }

  const [threshold, setThreshold] = useState<Threshold | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchThreshold = async () => {
      try {
        setIsLoading(true);
        const response = await authorizedAxiosInstance.get(`/devices/${device.id}/threshold`);
        setThreshold(response.data);
      } catch (error) {
        console.error("Không thể lấy thông tin ngưỡng quá tải:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreshold();
  }, [device.id]);

  if (isLoading || !threshold) {
    return null;
  }

  // Không hiển thị gì nếu ngưỡng quá tải chưa được kích hoạt
  if (!threshold.isEnabled) {
    return null;
  }

  // Kiểm tra xem thiết bị có vượt ngưỡng không
  const isOverThreshold = threshold.action === 'turnOff' 
    ? device.consumption >= threshold.value 
    : device.consumption <= threshold.value;

  const thresholdText = threshold.action === 'turnOff'
    ? `Thiết bị sẽ tự động tắt khi tiêu thụ vượt quá ${threshold.value}W`
    : `Thiết bị sẽ tự động bật khi tiêu thụ thấp hơn ${threshold.value}W`;

  const currentStatusText = isOverThreshold
    ? 'Đã vượt ngưỡng thiết lập!'
    : 'Đang hoạt động dưới ngưỡng thiết lập';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`absolute top-2 left-2 p-1 rounded-full ${isOverThreshold ? 'bg-orange-100' : 'bg-blue-100'}`}>
            {isOverThreshold ? (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            ) : (
              <ZapOff className="h-4 w-4 text-blue-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="p-2">
            <p className="font-medium">{thresholdText}</p>
            <p className="text-sm mt-1">{currentStatusText}</p>
            <p className="text-xs mt-1">Mức tiêu thụ hiện tại: {device.consumption}W</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

};export default DeviceThresholdIndicator;