import authorizedAxiosInstance from "@/lib/axios";
import { SignupRequest, SignupResponse } from "@/types/auth";

export async function signup(values: SignupRequest): Promise<SignupResponse> {
  try {
    const response = await authorizedAxiosInstance.post("/auth/register", {
      name: values.name,
      email: values.email,
      password: values.password,
      phone: values.phone
    });
    if (response.data && response.data.token) {
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
    const errorMessage = error.response?.data?.message || 
                          "Đăng ký thất bại, vui lòng thử lại sau";
    
    return {
      success: false,
      message: errorMessage
    };
  }
}