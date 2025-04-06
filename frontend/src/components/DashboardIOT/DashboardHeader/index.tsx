import { useState, useEffect } from "react";
import { Bell, Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccount } from "@/hooks/useAccount";
import { useUnreadAlerts } from "@/hooks/useDashboardIOTData";

interface DashboardHeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export default function DashboardHeader({ toggleSidebar, isSidebarOpen }: DashboardHeaderProps) {
  const { data: user } = useAccount();
  const unreadAlerts = useUnreadAlerts();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('vi-VN', options);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchValue);
    // Thực hiện tìm kiếm
    setShowSearchBox(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-2" 
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
        
        <div className="hidden md:block">
          <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500">{formatDate(currentTime)}</p>
        </div>
      </div>
      
      {/* Right side */}
      <div className="flex items-center space-x-4">
        {showSearchBox ? (
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Tìm kiếm..."
              className="h-9 pl-8 pr-4 w-64"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              autoFocus
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7" 
              onClick={() => setShowSearchBox(false)}
            >
              <X size={16} />
            </Button>
          </form>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowSearchBox(true)}
          >
            <Search size={20} />
          </Button>
        )}

        <div className="text-right hidden sm:block">
          <span className="block text-sm text-gray-500">Thời gian hiện tại</span>
          <span className="block text-sm font-medium">{formatTime(currentTime)}</span>
        </div>
        
        <div className="relative">
          <Button variant="ghost" size="icon">
            <Bell size={20} />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                {unreadAlerts.length}
              </span>
            )}
          </Button>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium">{user?.name || "Người dùng"}</p>
            <p className="text-xs text-gray-500">{user?.subscription?.plan || "Free"}</p>
          </div>
          <div className="relative">
            <img 
              src={user?.avatar || "/api/placeholder/40/40"} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border-2 border-gray-200"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
        </div>
      </div>
    </header>
  );
}