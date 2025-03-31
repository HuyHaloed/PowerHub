import { useState } from "react";
import logo from "@/assets/imgs/logo.png";
import { Button } from "../ui/button";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AlignRight, X, Bell } from "lucide-react";
import { paths } from "@/utils/path";
import { useAccount } from "@/hooks/useAccount";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import path from "path";

interface ItemProp {
  name: string;
  path: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "appointment" | "system" | "update";
}

const items: ItemProp[] = [
  { name: "Home", path: paths.Home },
  { name: "Clinic", path: paths.Clinic },
  { name: "Services", path: paths.DoctorSearch },
  { name: "Contact us", path: "/contact" },
];

const mockNotifications: Notification[] = [
  {
    id: 1,
    title: "Xác nhận lịch hẹn",
    message: "Lịch hẹn với BS. Trần Thị B đã được xác nhận",
    time: "5 phút trước",
    isRead: false,
    type: "appointment",
  },
  {
    id: 2,
    title: "Nhắc nhở lịch hẹn",
    message: "Bạn có lịch hẹn khám vào ngày mai lúc 9:00",
    time: "1 giờ trước",
    isRead: false,
    type: "appointment",
  },
  {
    id: 3,
    title: "Cập nhật hệ thống",
    message: "Hệ thống vừa được cập nhật tính năng mới",
    time: "2 giờ trước",
    isRead: true,
    type: "system",
  },
];

export default function Header() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { data: user, isLoading } = useAccount();
  const navigate = useNavigate();
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Đăng xuất thành công");
    navigate("/sign-in");
  };

  const handleReadNotification = (id: number) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif,
      ),
    );
  };

  const handleReadAll = () => {
    setNotifications(
      notifications.map((notif) => ({ ...notif, isRead: true })),
    );
  };

  return (
    <div className="p-4 border-b-3 border-primary flex flex-wrap items-center justify-between relative">
      <Link to={paths.Home}>
        <img src={logo} alt="logo" className="md:max-w-[300px] max-w-[150px]" />
      </Link>

      {/* Nút mở nav */}
      <AlignRight
        size={40}
        className="md:hidden cursor-pointer"
        onClick={() => setIsOpen(true)}
      />

      {/* Nav chính cho màn hình lớn */}
      <div className="md:flex items-center gap-5 hidden">
        {items.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={cn(
              "text-xl",
              location.pathname === item.path ? "text-primary font-bold" : "",
            )}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="md:flex items-center gap-5 hidden">
        {isLoading ? (
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        ) : user?.email ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">{unreadCount}</span>
                    </div>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <div className="flex justify-between items-center p-4 border-b">
                  <span className="font-semibold">Thông báo</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-600 hover:text-blue-700"
                      onClick={handleReadAll}
                    >
                      Đánh dấu tất cả đã đọc
                    </Button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Không có thông báo nào
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                          !notif.isRead ? "bg-blue-50" : ""
                        }`}
                        onClick={() => handleReadNotification(notif.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 p-2 rounded-full ${
                              notif.type === "appointment"
                                ? "bg-green-100"
                                : notif.type === "system"
                                  ? "bg-blue-100"
                                  : "bg-yellow-100"
                            }`}
                          >
                            {notif.type === "appointment" ? (
                              <svg
                                className="w-4 h-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            ) : notif.type === "system" ? (
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4 text-yellow-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">
                              {notif.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {notif.message}
                            </p>
                            <span className="text-xs text-gray-400 mt-2 block">
                              {notif.time}
                            </span>
                          </div>
                          {!notif.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 text-center border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-sm text-gray-600 hover:text-gray-900"
                      onClick={() => navigate("/notifications")}
                    >
                      Xem tất cả thông báo
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <div className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-full transition-colors">
                  <div className="relative">
                    <img
                      src={
                        user.avatar ||
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                      }
                      alt="avatar"
                      className="w-8 h-8 rounded-full border-2 border-gray-200"
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-sm font-medium">{user.name}</span>
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => navigate("/profile")}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Trang cá nhân
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => navigate("/dashboard")}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Quản lý hệ thống
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Link to="/sign-in" className="text-xl">
            <Button>Đăng nhập</Button>
          </Link>
        )}
      </div>

      {/* Sidebar Nav */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <span className="text-xl font-bold">Menu</span>
          <X
            size={30}
            className="cursor-pointer"
            onClick={() => setIsOpen(false)}
          />
        </div>
        <div className="flex flex-col p-4 gap-4">
          {items.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className="text-lg text-gray-700 hover:text-primary"
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <Link
            to="/sign-in"
            className="text-lg text-gray-700 hover:text-primary"
          >
            <Button className="w-full mt-4">Đăng nhập</Button>
          </Link>
        </div>
      </div>

      {/* Overlay để đóng nav */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
