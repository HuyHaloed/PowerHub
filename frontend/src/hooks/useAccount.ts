import { useQuery } from "@tanstack/react-query";
import authorizedAxiosInstance from "@/lib/axios";

// Định nghĩa kiểu dữ liệu cho user
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone_number?: string;
}

// Function để lấy thông tin user từ API
const fetchUser = async () => {
  const response = await authorizedAxiosInstance.get<any>("/auth/account");
  return response.data.data;
};

// Dữ liệu mặc định khi chưa load được
const defaultUser: User = {
  id: "1",
  email: "koikoidth12@gmail.com",
  name: "Anonymous",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", // Avatar mặc định
  phone_number: "0123456789",
};

// Hook để quản lý thông tin user
export const useAccount = () => {
  return useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    initialData: defaultUser,
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache trong 5 phút
    refetchOnMount: true, // Tự động fetch lại khi component mount
    refetchOnWindowFocus: true, // Fetch lại khi focus vào window
  });
};
