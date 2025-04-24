import authorizedAxiosInstance from "@/lib/axios";
import { LoginRequest, LoginResponse, User } from "@/types/auth";

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

  // Lưu role nếu là admin
  setRole(role: string) {
    if (role === "Admin") {
      sessionStorage.setItem("user_role", "Admin");
    }
  },

  getRole(): string | null {
    return sessionStorage.getItem("user_role");
  },

  removeRole() {
    sessionStorage.removeItem("user_role");
  },

  // Kiểm tra xem người dùng có phải admin không
  isAdmin(): boolean {
    return this.getRole() === "Admin";
  },

  // Xóa toàn bộ thông tin auth
  clear() {
    this.removeToken();
    this.removeRole();
  }
};

export async function login(values: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await authorizedAxiosInstance.post("/auth/login", {
      email: values.email,
      password: values.password,
    });

    if (response.data && response.data.token) {
      const user = response.data.user;
      
      // Lưu token
      AuthStorage.setToken(response.data.token);

      // Nếu là admin, lưu thêm role
      if (user.role === "Admin") {
        AuthStorage.setRole("Admin");
      }

      const userData: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || undefined,
        subscription: user.subscription,
        preferences: user.preferences
      };

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

export function logout() {
  try {
    // Gọi API logout nếu cần
    authorizedAxiosInstance.post("/auth/logout");

    // Xóa session
    AuthStorage.clear();

    // Chuyển hướng
    window.location.href = "/login";
  } catch (error) {
    console.error("Logout error:", error);
  }
}
