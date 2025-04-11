import React, { useState, useEffect } from 'react';
import { Outlet } from "react-router-dom";
import DashboardHeader from '@/components/DashboardIOT/DashboardHeader';
import DashboardFooter from '@/components/DashboardIOT/DashboardFooter';

export default function DashboardLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${!isMobile ? "ml-64" : ""}`}>
        {/* Dashboard Header */}
        <DashboardHeader 
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        
        {/* Main Content */}
        <main className="flex-grow">
          <Outlet context={{ isMobile, isSidebarOpen, setSidebarOpen }} />
        </main>
        
        {/* Dashboard Footer */}
        <DashboardFooter />
      </div>
    </div>
  );
}