import authorizedAxiosInstance from "@/lib/axios";

// interface SignupResponse {
//   code: string;
//   message: string;
//   result?: {
//     token: string;
//   };
// }

interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export async function signup(values: SignupRequest) {
  try {
    const response = await authorizedAxiosInstance.post("/auth/register", {
      email: values.email,
      password: values.password,
      name: values.name,
      phoneNumber: values.phone,
      dob: "2000-01-01",
      address: "Hà Nội",
      gender: "Male"
    });

    if (response.data.result) {
      return {
        success: true,
        message: `Tài khoản ${values.email} đã đăng ký tài khoản thành công`,
      };
    }

    return {
      success: false,
      message: "Đăng ký thất bại",
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại",
    };
  }
}
