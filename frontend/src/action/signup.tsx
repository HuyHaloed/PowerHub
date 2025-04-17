// src/action/signup.tsx
import authorizedAxiosInstance from "@/lib/axios";
import { SignupRequest, SignupResponse } from "@/types/auth";

export async function signup(values: SignupRequest): Promise<SignupResponse> {
  try {
    // Gọi API register từ backend
    const response = await authorizedAxiosInstance.post("/auth/register", {
      name: values.name,
      email: values.email,
      password: values.password,
      phone: values.phone
    });

    // Kiểm tra nếu API trả về thành công
    if (response.data && response.data.token) {
      // Trong một số trường hợp, bạn có thể muốn lưu token ngay sau khi đăng ký
      // localStorage.setItem("token", response.data.token);
      
      return {
        success: true,
        message: `Tài khoản ${values.email} đã đăng ký thành công`,
        data: {
          token: response.data.token,
          user: response.data.user
        }
      };
    }

    return {
      success: true,
      message: `Tài khoản ${values.email} đã đăng ký thành công`,
    };
  } catch (error: any) {
    // Xử lý các lỗi từ API
    const errorMessage = error.response?.data?.message || 
                          "Đăng ký thất bại, vui lòng thử lại sau";
    
    return {
      success: false,
      message: errorMessage
    };
  }
}