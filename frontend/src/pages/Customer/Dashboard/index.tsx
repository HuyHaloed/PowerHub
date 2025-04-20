import React from 'react';
import { useOutletContext } from "react-router-dom";
import { useDashboardData, useActiveDevices, useQuickStats } from '@/hooks/useDashboardIOTData';
import { useLatestEnvironmentData } from '@/hooks/useEnvironmentData';
import DashboardSidebar from '@/components/DashboardIOT/DashboardSidebar';
import QuickStatCard from '@/components/DashboardIOT/QuickStatCard';
import EnergyConsumptionChart from '@/components/DashboardIOT/EnergyTotalbyRangeTimeChart';
import DeviceStatusCard from '@/components/DashboardIOT/DeviceStatusCard';
import EnergyDistributionChart from '@/components/DashboardIOT/EnergyDistributionChart';
import UserInfoCard from '@/components/DashboardIOT/UserInfoCard';
import { Bell, Thermometer, Droplets } from 'lucide-react';
import DevicesView from '@/pages/Customer/Dashboard/DevicesView';
import AnalyticsView from '@/pages/Customer/Dashboard/AnalyticsView';
import SettingsView from '@/pages/Customer/Dashboard/SettingsView';
import { Stat, Device } from '@/types/dashboard.types';

// Custom Alert Component
const CustomAlert = ({ 
  title, 
  message, 
  severity = "info" 
}: { 
  title: string, 
  message: string, 
  severity?: "info" | "warning" | "error" 
}) => {
  const severityStyles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    error: "bg-red-50 border-red-200 text-red-800"
  };

  return (
    <div className={`
      p-4 rounded-lg border flex items-start space-x-3
      ${severityStyles[severity]}
    `}>
      <Bell className="h-5 w-5 mt-1 flex-shrink-0" />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

// New Environment Data Card Component
const EnvironmentDataCard = ({ 
  title, 
  value = null, 
  unit = "", 
  icon,
  isSubscribed = false,
  lastUpdated = null
}: { 
  title: string, 
  value: number | null, 
  unit: string,
  icon: React.ReactNode,
  isSubscribed?: boolean,
  lastUpdated?: string | null
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

type LayoutContextType = {
  isMobile: boolean;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
};

// Temperature Card Component
const TemperatureCard = () => {
  const { data, isLoading, hasSubscription, hasData } = useLatestEnvironmentData();
  
  return (
    <EnvironmentDataCard 
      title="Nhiệt độ" 
      value={hasData && data ? data.temperature : null} 
      unit="°C" 
      icon={<Thermometer className="h-6 w-6" />}
      isSubscribed={hasSubscription && hasData}
      lastUpdated={hasData && data ? data.timestamp : null}
    />
  );
};

// Humidity Card Component
const HumidityCard = () => {
  const { data, isLoading, hasSubscription, hasData } = useLatestEnvironmentData();
  
  return (
    <EnvironmentDataCard 
      title="Độ ẩm" 
      value={hasData && data ? data.humidity : null} 
      unit="%" 
      icon={<Droplets className="h-6 w-6" />}
      isSubscribed={hasSubscription && hasData}
      lastUpdated={hasData && data ? data.timestamp : null}
    />
  );
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useDashboardData();
  const { data: activeDevicesData, isLoading: isActiveDevicesLoading } = useActiveDevices();
  const { data: quickStatsData, isLoading: isQuickStatsLoading } = useQuickStats();
  const { isMobile, isSidebarOpen, setSidebarOpen } = useOutletContext<LayoutContextType>();
  
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "devices":
        return <DevicesView />;
      case "analytics":
        return <AnalyticsView />;
      case "settings":
        return <SettingsView />;
      default:
        return renderDashboard();
    }
  };
  
  const renderDashboard = () => {
    if (isDashboardLoading || isQuickStatsLoading) {
      return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
    }
    
    if (dashboardError || !dashboardData) {
      return (
        <CustomAlert 
          title="Lỗi" 
          message="Không thể tải dữ liệu dashboard. Vui lòng thử lại sau."
          severity="error"
        />
      );
    }
    const unreadAlerts = dashboardData.alerts?.filter(alert => !alert.read) || [];
    
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {quickStatsData?.map((stat: Stat) => (
            <QuickStatCard key={stat.id} stat={stat} />
          ))}
        </div>
        {unreadAlerts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-3">Cảnh báo gần đây</h2>
            <div className="space-y-3">
              {unreadAlerts.map((alert) => (
                <CustomAlert 
                  key={alert.id}
                  title={alert.title}
                  message={alert.message}
                  severity={alert.severity === "error" ? "error" : alert.severity === "warning" ? "warning" : "info"}
                />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3">
            <EnergyConsumptionChart />
          </div>
          <div>
            <UserInfoCard user={dashboardData.user} />
          </div>
          
          <div className="lg:col-span-2">
            <EnergyDistributionChart />
          </div>
          
          {/* Temperature and Humidity Cards - Side by side, directly below the pie chart */}
          <div>
            <TemperatureCard />
          </div>
          
          <div>
            <HumidityCard />
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-3">Thiết bị đang hoạt động</h2>
            <div className="space-y-4">
              {activeDevicesData && activeDevicesData.length > 0 ? (
                activeDevicesData.slice(0, 3).map((device: Device) => (
                  <DeviceStatusCard key={device.id} device={device} />
                ))
              ) : (
                <p className="text-gray-500 text-sm">Không có thiết bị nào đang hoạt động</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };  

  return (
    <>
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      {renderContent()}
    </>
  );
}