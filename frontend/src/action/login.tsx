import authorizedAxiosInstance from "@/lib/axios";

interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      avatar: string;
    };
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

export async function login(values: LoginRequest): Promise<LoginResponse> {
  // Mock account for testing
  const mockAccounts = [
    {
      email: "user@powerhub.com",
      password: "PowerHub2025!",
      user: {
        id: 1,
        name: "Nguyễn Văn A",
        email: "user@powerhub.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
      }
    }
  ];

  // Check against mock accounts first
  const matchedAccount = mockAccounts.find(
    account => 
      account.email === values.email && 
      account.password === values.password
  );

  if (matchedAccount) {
    // Generate a mock token
    const token = btoa(JSON.stringify(matchedAccount.user));
    localStorage.setItem("token", token);
    
    return {
      success: true,
      message: "Đăng nhập thành công",
      data: {
        token,
        user: matchedAccount.user
      }
    };
  }

  // If not found in mock accounts, attempt real API call
  try {
    const response = await authorizedAxiosInstance.post("/auth/login", {
      username: values.email,
      password: values.password,
    });

    if (response.data.data.token) {
      localStorage.setItem("token", response.data.data.token);
      return {
        success: true,
        message: "Đăng nhập thành công",
        data: response.data.data,
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
  }
}