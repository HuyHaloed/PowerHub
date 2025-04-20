import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { paths } from "@/utils/path";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const items = [
  {
    title: "Dashboard",
    url: paths.AdminDashboard,
    icon: Home,
  },
  {
    title: "Blogs Management",
    url: paths.AdminBlogs,
    icon: Inbox,
  },
  {
    title: "Users Management",
    url: paths.AdminUsers,
    icon: Search,
  },
  {
    title: "Devices Management",
    url: paths.AdminDevices,
    icon: Search,
  },
  {
    title: "Customers Feedback",
    url: paths.AdminCustomersFeed,
    icon: Search,
  },
  {
    title: "IOT Status",
    url: paths.AdminIOTStatus,
    icon: Calendar,
  },
  {
    title: "System Settings",
    url: paths.AdminSettings,
    icon: Calendar,
  }
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-6 p-6 bg-white rounded-lg shadow-sm border">
            <Avatar className="w-10 h-10">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Link to={paths.Home}>
                <p className="font-bold">Phòng khám Lavender</p>
              </Link>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Đang hoạt động
                </Badge>
                <span className="text-sm text-gray-500">ID: #12345</span>
              </div>
            </div>
          </div>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={`${
                          isActive
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "hover:bg-accent hover:text-accent-foreground"
                        } flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}