import { useEffect } from "react";
import { useAccount } from "@/hooks/useAccount";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import  {Link} from "react-router-dom";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  LayoutDashboard,
  Zap,
  BarChart3,
  Settings,
  Home,
  HelpCircle,
  Bell
} from "lucide-react";
import { useUnreadAlerts } from "@/hooks/useDashboardIOTData";

interface DashboardSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardSidebar({
  activeTab,
  setActiveTab,
  isMobile,
  isOpen,
  onClose
}: DashboardSidebarProps) {
  const { data: user } = useAccount();
  const navigate = useNavigate();
  const { data: unreadAlertsData = [] } = useUnreadAlerts();
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (isMobile) {
      onClose();
    }
  };
  
  const handleLogout = () => {
      sessionStorage.removeItem("auth_token");
      toast.success("Đăng xuất thành công");
      navigate("/");
    };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('dashboard-sidebar');
      if (isMobile && isOpen && sidebar && !sidebar.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, isOpen, onClose]);
  
  const sidebarClass = cn(
    "fixed left-0 top-0 h-full bg-white shadow-lg z-40 transition-all duration-300 flex flex-col",
    isMobile ? (isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full") : "w-64"
  );

  const navigationItems = [
    {
      title: "Tổng quan",
      tab: "dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      title: "Thiết bị",
      tab: "devices",
      icon: <Zap size={18} />,
    },
    {
      title: "Phân tích",
      tab: "analytics",
      icon: <BarChart3 size={18} />,
    },
    {
      title: "Cài đặt",
      tab: "settings",
      icon: <Settings size={18} />,
    },
  ];

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-30"
          onClick={onClose}
        />
      )}
      <div id="dashboard-sidebar" className={sidebarClass}>
        <div className="p-2 border-b flex items-center ">
          <div className="bg-white text-white p-2 rounded mr-2">
          <motion.img 
            src={logo} 
            alt="logo" 
            className="md:max-w-[75px] max-w-[100px] ml-10 group-hover:scale-110 transition-transform duration-300"
            whileHover={{ scale: 1.1 }}
          />
          </div>
          <h1 className="text-lg font-bold">Power Hub</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 ">
          <div className="space-y-1">
            {navigationItems.map((item) => (
              <Button
                key={item.tab}
                variant={activeTab === item.tab ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  activeTab === item.tab ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : ""
                )}
                onClick={() => handleTabChange(item.tab)}
              >
                <span className="mr-2">{item.icon}</span>
                {item.title}
                {item.tab === "dashboard" && unreadAlertsData.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadAlertsData.length}
                  </span>
                )}
              </Button>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/')}>
              <Home size={18} className="mr-2" />
              Trang chủ
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Bell size={18} className="mr-2" />
              Thông báo
              {unreadAlertsData.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadAlertsData.length}
                </span>
              )}
            </Button>
            <Link to="/contact" className="w-full">
              <Button variant="ghost" className="w-full justify-start">
                <HelpCircle size={18} className="mr-2" />
                Trợ giúp
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="p-4 border-t">
          <div className="flex items-center mb-3">
            <img 
              src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
              alt="Avatar" 
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <p className="font-medium text-sm">{user?.name || "Người dùng"}</p>
              <p className="text-xs text-gray-500">{user?.email || "user@example.com"}</p>
            </div>
          </div>
            <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
              Đăng xuất
            </Button>
        </div>
      </div>
    </>
  );
}