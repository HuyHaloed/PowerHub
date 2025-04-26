import React, { useState, useEffect } from 'react';
import { Thermometer, Droplets, MapPin } from 'lucide-react';
import { useAdafruitData } from '@/hooks/useEnvironmentData';

const EnvironmentDataCard = ({ 
  title, 
  value = null, 
  unit = "", 
  icon,
  isLoading = false,
  lastUpdated = null,
  location = "Phòng khách"
}: { 
  title: string, 
  value: number | null, 
  unit: string,
  icon: React.ReactNode,
  isLoading?: boolean,
  lastUpdated?: string | null,
  location?: string | null
}) => {
  // Thêm state để theo dõi giá trị trước đó và tạo hiệu ứng
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Xử lý hiệu ứng khi giá trị thay đổi
  useEffect(() => {
    if (value !== prevValue && prevValue !== null) {
      setIsUpdating(true);
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
    setPrevValue(value);
  }, [value, prevValue]);
  
  return (
    <div className={`bg-white rounded-lg shadow p-6 h-full transition-all duration-200 ${isUpdating ? 'bg-blue-50' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="text-gray-500">
          {icon}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : value !== null ? (
        <div className="mt-2">
          <div className={`flex items-baseline transition-all duration-300 ${isUpdating ? 'text-blue-600 scale-105' : ''}`}>
            <span className="text-3xl font-bold">{value.toFixed(1)}</span>
            <span className="ml-1 text-gray-500">{unit}</span>
          </div>
          {location && (
            <p className="text-sm text-gray-600 mt-1 flex items-center">
              <MapPin className="h-3 w-3 mr-1" /> {location}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Cập nhật cuối: {lastUpdated ? new Date(lastUpdated).toLocaleString('vi-VN') : '--'}
          </p>
        </div>
      ) : (
        <div className="mt-4 text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-400 font-medium">Không có dữ liệu</p>
          <p className="text-sm text-gray-400 mt-2">Đang chờ cập nhật từ Adafruit</p>
        </div>
      )}
    </div>
  );
};

export const TemperatureCard = () => {
  const { data, isLoading, error } = useAdafruitData();
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow">
        <EnvironmentDataCard 
          title="Nhiệt độ" 
          value={data.temperature !== undefined ? data.temperature : null} 
          unit="°C" 
          icon={<Thermometer className="h-6 w-6" />}
          isLoading={isLoading}
          lastUpdated={data.lastUpdated}
          location="Phòng khách"
        />
      </div>
    </div>
  );
};

export const HumidityCard = () => {
  const { data, isLoading, error } = useAdafruitData();
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-grow">
        <EnvironmentDataCard 
          title="Độ ẩm" 
          value={data.humidity !== undefined ? data.humidity : null} 
          unit="%" 
          icon={<Droplets className="h-6 w-6" />}
          isLoading={isLoading}
          lastUpdated={data.lastUpdated}
          location="Phòng khách"
        />
      </div>
    </div>
  );
};

export { EnvironmentDataCard };