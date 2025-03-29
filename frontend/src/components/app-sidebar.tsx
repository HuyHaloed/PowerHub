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
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: paths.AdminDashboard,
    icon: Home,
  },
  {
    title: "Doctors",
    url: paths.AdminDoctors,
    icon: Inbox,
  },
  {
    title: "Appointments",
    url: paths.AdminAppointments,
    icon: Calendar,
  },
  // {
  //     title: "Search",
  //     url: "#",
  //     icon: Search,
  // },
  {
    title: "Settings",
    url: paths.AdminSettings,
    icon: Settings,
  },
];

export function AppSidebar() {
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
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
