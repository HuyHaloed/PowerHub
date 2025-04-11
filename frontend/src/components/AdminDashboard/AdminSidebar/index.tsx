import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Zap, 
  FileText, 
  MessageCircle, 
  Settings, 
  ChevronLeft, 
  Home 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

interface AdminSidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ 
  isMobile, 
  isOpen, 
  onClose 
}: AdminSidebarProps) {
  const location = useLocation();

  const sidebarNavItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
      segment: "dashboard"
    },
    {
      title: "User Management",
      icon: Users,
      href: "/admin/users",
      segment: "users"
    },
    {
      title: "Device Management",
      icon: Zap,
      href: "/admin/devices",
      segment: "devices"
    },
    {
      title: "Blog Management",
      icon: FileText,
      href: "/admin/blogs",
      segment: "blogs"
    },
    {
      title: "Customer Feedback",
      icon: MessageCircle,
      href: "/admin/feedback",
      segment: "feedback"
    },
    {
      title: "System Settings",
      icon: Settings,
      href: "/admin/settings",
      segment: "settings"
    }
  ];

  const isActive = (segment: string) => 
    location.pathname.includes(`/admin/${segment}`);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed left-0 top-0 h-full bg-white shadow-lg z-50 transition-all duration-300 w-64",
          isMobile 
            ? (isOpen ? "translate-x-0" : "-translate-x-full") 
            : ""
        )}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={logo} 
              alt="Power Hub Logo" 
              className="w-10 h-10 mr-2" 
            />
            <h1 className="text-lg font-bold">Power Hub Admin</h1>
          </div>

          {/* Mobile Close Button */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {sidebarNavItems.map((item) => (
            <Link 
              key={item.href} 
              to={item.href}
              className="block"
            >
              <Button
                variant={isActive(item.segment) ? "default" : "ghost"}
                className="w-full justify-start"
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Link to="/" className="w-full">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}