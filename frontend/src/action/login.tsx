
import authorizedAxiosInstance from "@/lib/axios";
import { LoginRequest, LoginResponse, User } from "@/types/auth";

export async function login(values: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await authorizedAxiosInstance.post("/auth/login", {
      email: values.email,
      password: values.password,
    });
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
      const userData: User = {
        id: response.data.user.id,
        name: response.data.user.name,
        email: response.data.user.email,
        avatar: response.data.user.avatar || undefined,
        subscription: response.data.user.subscription,
        preferences: response.data.user.preferences
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