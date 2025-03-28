import authorizedAxiosInstance from "@/lib/axios";

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

export async function login(values: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await authorizedAxiosInstance.post("/auth/login", {
      username: values.email,
      password: values.password,
    });
    console.log(response.data);

    if (response.data.data.token) {
      localStorage.setItem("token", response.data.data.token);
      return {
        success: true,
        message: "Đăng nhập thành công",
        data: response.data,
      };
    }

    return {
      success: false,
      message: "Mật khẩu hoặc email không đúng",
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Đăng nhập thất bại",
    };
    // error.response?.data?.message ||
  }
}
