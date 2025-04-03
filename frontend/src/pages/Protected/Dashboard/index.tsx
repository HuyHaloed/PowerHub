import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDashboardData, useActiveDevices, useQuickStats } from '@/hooks/useDashboardData';
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';
import QuickStatCard from '@/components/Dashboard/QuickStatCard';
import EnergyConsumptionChart from '@/components/Dashboard/EnergyConsumptionChart';
import DeviceStatusCard from '@/components/Dashboard/DeviceStatusCard';
import EnergyDistributionChart from '@/components/Dashboard/EnergyDistributionChart';
import UserInfoCard from '@/components/Dashboard/UserInfoCard';
import { Bell } from 'lucide-react';
import DevicesView from '@/pages/Protected/Dashboard/DevicesView';
import AnalyticsView from '@/pages/Protected/Dashboard/AnalyticsView';
import SettingsView from '@/pages/Protected/Dashboard/SettingsView';
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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { data: dashboardData, isLoading, error } = useDashboardData();
  const activeDevices = useActiveDevices();
  const quickStats = useQuickStats();
  // Check screen size for responsive layout
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };
  
  // Content based on active tab
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
    if (isLoading) {
      return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
    }
    
    if (error || !dashboardData) {
      return (
        <CustomAlert 
          title="Lỗi" 
          message="Không thể tải dữ liệu dashboard. Vui lòng thử lại sau."
          severity="error"
        />
      );
    }
    
    // Unread alerts
    const unreadAlerts = dashboardData.alerts.filter(alert => !alert.read);
    
    return (
        
      <div className="p-6">
        {/* Quick Stats */}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {quickStats.map((stat) => (
            <QuickStatCard key={stat.id} stat={stat} />
          ))}
        </div>
        
        {/* Alerts */}
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
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Energy Consumption Chart */}
          <div className="lg:col-span-2">
            <EnergyConsumptionChart />
          </div>
          
          {/* User Info */}
          <div>
            <UserInfoCard user={dashboardData.user} />
          </div>
          
          {/* Energy Distribution */}
          <div className="lg:col-span-2">
            <EnergyDistributionChart />
          </div>
          
          {/* Active Devices */}
          <div>
            <h2 className="text-lg font-medium mb-3">Thiết bị đang hoạt động</h2>
            <div className="space-y-4">
              {activeDevices.length > 0 ? (
                activeDevices.slice(0, 3).map((device) => (
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
      {/* <Helmet>
        <title>Power Hub | Dashboard</title>
      </Helmet> */}
      
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <DashboardSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobile={isMobile}
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        {/* Main Content */}
        <div className={`flex-1 ${!isMobile ? "ml-64" : ""}`}>
          <DashboardHeader 
            toggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />
          <main>
            {renderContent()}
          </main>
        </div>
      </div>
    </>
  );
}
