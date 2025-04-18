import authorizedAxiosInstance from "@/lib/axios";
import { LoginRequest, LoginResponse, User } from "@/types/auth";

// Quản lý token và user trong sessionStorage
export const AuthStorage = {
  // Lưu token
  setToken(token: string) {
    sessionStorage.setItem("auth_token", token);
  },

  // Lấy token
  getToken(): string | null {
    return sessionStorage.getItem("auth_token");
  },

  // Xóa token khi logout
  removeToken() {
    sessionStorage.removeItem("auth_token");
  },

  // Lưu thông tin user
  setUser(user: User) {
    sessionStorage.setItem("user_data", JSON.stringify(user));
  },

  // Lấy thông tin user
  getUser(): User | null {
    const userData = sessionStorage.getItem("user_data");
    return userData ? JSON.parse(userData) : null;
  },

  // Xóa thông tin user
  removeUser() {
    sessionStorage.removeItem("user_data");
  },

  // Xóa toàn bộ thông tin auth
  clear() {
    this.removeToken();
    this.removeUser();
  }
};

export async function login(values: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await authorizedAxiosInstance.post("/auth/login", {
      email: values.email,
      password: values.password,
    });

    if (response.data && response.data.token) {
      // Lưu token vào sessionStorage
      AuthStorage.setToken(response.data.token);

      // Lưu thông tin user
      const userData: User = {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        avatar: response.data.user.avatar || undefined,
        subscription: response.data.user.subscription,
        preferences: response.data.user.preferences
      };
      
      // // Lưu user data vào sessionStorage
      // AuthStorage.setUser(userData);
      // nào ai muốn coi thông tin user thì bật cái trên lên nhe
      return {
        success: true,
        message: "Đăng nhập thành công",
        data: {
          token: response.data.token,
          user: userData
        }
      };
    }

    return {
      success: false,
      message: "Mật khẩu hoặc email không đúng",
    };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || "Đăng nhập thất bại, vui lòng thử lại sau";
    
    console.error("Login error:", error);
    
    return {
      success: false,
      message: errorMessage,
    };
  }
}

// Hàm logout
export function logout() {
  try {
    // Gọi API logout nếu cần
    authorizedAxiosInstance.post("/auth/logout");
    
    // Xóa thông tin auth khỏi sessionStorage
    AuthStorage.clear();

    // Chuyển hướng đến trang login nếu cần
    window.location.href = "/login";
  } catch (error) {
    console.error("Logout error:", error);
  }
}