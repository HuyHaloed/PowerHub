import React, { useState, useEffect } from 'react';
import { ZapOff, AlertTriangle, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import authorizedAxiosInstance from '@/lib/axios';
import { toast } from 'react-toastify';

const DeviceThresholdIndicator = ({ device, onAlertDismissed }: { 
  device: { id: string; consumption: number }; 
  onAlertDismissed?: () => void;
}) => {

  interface Threshold {
    isEnabled: boolean;
    action: 'turnOff' | 'turnOn';
    value: number;
  }

  const [threshold, setThreshold] = useState<Threshold | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alertId, setAlertId] = useState<string | null>(null);

  useEffect(() => {
    const fetchThreshold = async () => {
      try {
        setIsLoading(true);
        const response = await authorizedAxiosInstance.get(`/devices/${device.id}/threshold`);
        setThreshold(response.data);
        
        // Check if there's an active alert for this device
        const alertsResponse = await authorizedAxiosInstance.get('/alerts');
        const deviceAlerts = alertsResponse.data.filter(
          (alert: any) => alert.message && alert.message.includes(device.id)
        );
        
        if (deviceAlerts.length > 0) {
          setAlertId(deviceAlerts[0].id);
        }
      } catch (error) {
        console.error("Không thể lấy thông tin ngưỡng quá tải:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreshold();
  }, [device.id]);

  // Handle dismissing/deleting the alert
  const handleDismissAlert = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    
    if (!alertId) return;
    
    try {
      await authorizedAxiosInstance.delete(`/thresholds/alerts/${alertId}`);
      setAlertId(null);
      toast.success("Đã xóa thông báo ngưỡng quá tải");
      
      // Call the callback if provided
      if (onAlertDismissed) {
        onAlertDismissed();
      }
    } catch (error) {
      console.error("Không thể xóa thông báo:", error);
      toast.error("Không thể xóa thông báo");
    }
  };

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
    <div className="absolute top-2 left-2 flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`p-1 rounded-full ${isOverThreshold ? 'bg-orange-100' : 'bg-blue-100'}`}>
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
              {alertId && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="mt-2 w-full"
                  onClick={handleDismissAlert}
                >
                  Xóa thông báo
                </Button>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Nút xóa thông báo xuất hiện khi có alert */}
      {alertId && (
        <button
          onClick={handleDismissAlert}
          className="p-1 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
          title="Xóa thông báo ngưỡng quá tải"
        >
          <X className="h-4 w-4 text-red-500" />
        </button>
      )}
    </div>
  );
};

export default DeviceThresholdIndicator;