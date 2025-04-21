import React, { useState } from 'react';
import { useLatestEnvironmentData, useEnvironmentLocations } from '@/hooks/useEnvironmentData';
import { Thermometer, Droplets, MapPin } from 'lucide-react';

const EnvironmentDataCard = ({ 
  title, 
  value = null, 
  unit = "", 
  icon,
  isSubscribed = true,
  lastUpdated = null,
  location = null
}: { 
  title: string, 
  value: number | null, 
  unit: string,
  icon: React.ReactNode,
  isSubscribed?: boolean,
  lastUpdated?: string | null,
  location?: string | null
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="text-gray-500">
          {icon}
        </div>
      </div>
      
      {isSubscribed ? (
        <div className="mt-2">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">{value !== null ? value.toFixed(1) : '--'}</span>
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
          <p className="text-sm text-gray-400 mt-2">Chưa đăng ký dịch vụ này</p>
        </div>
      )}
    </div>
  );
};

export const TemperatureCard = () => {
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(undefined);
//   const { locations, isLoading: locationsLoading } = useEnvironmentLocations();
  const { data, isLoading, hasSubscription, hasData } = useLatestEnvironmentData(selectedLocation);
  
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLocation(value === 'all' ? undefined : value);
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* {hasSubscription && locations.length > 0 && (
        <div className="mb-2">
          <select 
            className="text-sm rounded border border-gray-300 p-1 w-full"
            value={selectedLocation || 'all'}
            onChange={handleLocationChange}
          >
            <option value="all">Tất cả vị trí</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      )} */}
      
      <div className="flex-grow">
        <EnvironmentDataCard 
          title="Nhiệt độ" 
          value={hasData && data ? data.temperature : null} 
          unit="°C" 
          icon={<Thermometer className="h-6 w-6" />}
          isSubscribed={hasSubscription && hasData}
          lastUpdated={hasData && data ? data.timestamp : null}
          location={hasData && data ? data.location : null}
        />
      </div>
    </div>
  );
};

export const HumidityCard = () => {
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(undefined);
//   const { locations, isLoading: locationsLoading } = useEnvironmentLocations();
  const { data, isLoading, hasSubscription, hasData } = useLatestEnvironmentData(selectedLocation);
  
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLocation(value === 'all' ? undefined : value);
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* {hasSubscription && locations.length > 0 && (
        <div className="mb-2">
          <select 
            className="text-sm rounded border border-gray-300 p-1 w-full"
            value={selectedLocation || 'all'}
            onChange={handleLocationChange}
          >
            <option value="all">Tất cả vị trí</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      )} */}
      
      <div className="flex-grow">
        <EnvironmentDataCard 
          title="Độ ẩm" 
          value={hasData && data ? data.humidity : null} 
          unit="%" 
          icon={<Droplets className="h-6 w-6" />}
          isSubscribed={hasSubscription && hasData}
          lastUpdated={hasData && data ? data.timestamp : null}
          location={hasData && data ? data.location : null}
        />
      </div>
    </div>
  );
};