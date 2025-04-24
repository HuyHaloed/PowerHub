// Cập nhật trong pages/Login/index.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import loginImage from "@/assets/login-image.jpg";
import { Link, useNavigate } from "react-router-dom";
import { paths } from "@/utils/path";
import { login } from "@/action/login";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import authorizedAxiosInstance from '@/lib/axios';

const formSchema = z.object({
  email: z.string().refine(
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    {
      message: "Email không hợp lệ.",
    },
  ),
  password: z.string().min(2, {
    message: "Mật khẩu phải có ít nhất 2 ký tự.",
  }),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animateForm, setAnimateForm] = useState(false);

  // Hiệu ứng animation khi trang tải
  useEffect(() => {
    // Đặt timeout để kích hoạt animation sau khi component được mount
    setTimeout(() => {
      setAnimateForm(true);
    }, 100);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const response = await login(values);

      if (response.success) {
        toast.success(response.message);
        // Kiểm tra role của người dùng và chuyển hướng tương ứng
        if (response.data?.user.role === 'Admin') {
          navigate(paths.AdminDashboard);
        } else {
          navigate(paths.Dashboard);
        }
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Đăng nhập thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  }

  // Xử lý đăng nhập Google thành công
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setLoading(true);
      const token = credentialResponse.credential;
      if (!token) {
        toast.error("Không nhận được thông tin xác thực từ Google");
        return;
      }

      const response = await authorizedAxiosInstance.post('/auth/google-login', { token });
      
      if (response.data.success) {
        toast.success("Đăng nhập Google thành công!");
        // Kiểm tra role của người dùng và chuyển hướng tương ứng
        if (response.data?.user?.role === 'Admin') {
          navigate(paths.AdminDashboard);
        } else {
          navigate(paths.Dashboard);
        }
      } else {
        toast.error(response.data.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      toast.error("Đăng nhập Google thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý lỗi đăng nhập Google
  const handleGoogleError = () => {
    toast.error("Đăng nhập Google thất bại, vui lòng thử lại");
  };

  return (
    <div className="min-h-screen flex items-center bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row rounded-xl overflow-hidden shadow-2xl max-w-6xl mx-auto bg-white">
          {/* Phần trái - Hình ảnh và slogan */}
          <div className="md:w-1/2 relative overflow-hidden bg-[var(--primary-ground)]">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-ground)]/90 to-[var(--primary-ground)]/70 z-10"></div>
            
            {/* Hình ảnh minh họa */}
            <img
              src={loginImage}
              alt="Login"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-90 scale-110 hover:scale-100 transition-transform duration-5000"
            />
            
            {/* Nội dung bên trái */}
            <div className="relative z-20 flex flex-col justify-center items-center h-full p-12 text-white">
              <div className={`transform transition-all duration-1000 ${animateForm ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">POWER HUB</h2>
                <p className="text-xl md:text-2xl font-semibold mb-8 text-center">
                  Quản lý năng lượng thông minh
                </p>
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-4">HÃY CHO TÔI BIẾT VẤN ĐỀ CỦA BẠN</h3>
                  <p className="text-white/80">
                    Chúng tôi sẽ giúp bạn giám sát và tối ưu hóa năng lượng cho ngôi nhà thông minh của bạn
                  </p>
                </div>
              </div>
              
              {/* Animated dots */}
              <div className="flex space-x-3 mt-10">
                <div className="h-3 w-3 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="h-3 w-3 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }}></div>
                <div className="h-3 w-3 rounded-full bg-white animate-bounce" style={{ animationDelay: "600ms" }}></div>
              </div>
            </div>
          </div>
          
          {/* Phần phải - Form đăng nhập */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className={`transition-all duration-1000 ease-out ${animateForm ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
              <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Đăng nhập</h1>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 flex items-center text-base font-medium">
                          <Mail className="w-4 h-4 mr-2" /> Email
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              placeholder="your.email@example.com"
                              {...field}
                              disabled={loading}
                              className="h-12 pl-4 pr-10 border-2 border-gray-200 rounded-lg focus:border-[var(--primary-ground)] transition-all duration-300 focus:ring-2 focus:ring-[var(--primary-ground)]/20"
                            />
                            <div className="absolute bottom-0 left-0 h-0.5 bg-[var(--primary-ground)] w-0 group-hover:w-full transition-all duration-500"></div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 flex items-center text-base font-medium">
                          <Lock className="w-4 h-4 mr-2" /> Mật khẩu
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              placeholder="●●●●●●"
                              type={showPassword ? "text" : "password"}
                              {...field}
                              disabled={loading}
                              className="h-12 pl-4 pr-12 border-2 border-gray-200 rounded-lg focus:border-[var(--primary-ground)] transition-all duration-300 focus:ring-2 focus:ring-[var(--primary-ground)]/20"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-[var(--primary-ground)]"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={loading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </Button>
                            <div className="absolute bottom-0 left-0 h-0.5 bg-[var(--primary-ground)] w-0 group-hover:w-full transition-all duration-500"></div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                        <div className="flex justify-end mt-1">
                          <Link to="/forgot-password" className="text-sm text-[var(--primary-ground)] hover:underline">
                            Quên mật khẩu?
                          </Link>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-[var(--primary-ground)] hover:bg-[var(--primary-ground)]/90 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg relative overflow-hidden group"
                  >
                    <span className="relative z-10">
                      {loading ? "Đang xử lý..." : "Đăng nhập"}
                    </span>
                    {!loading && (
                      <span className="absolute inset-0 h-full w-full bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left opacity-25"></span>
                    )}
                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </Button>
                  
                  <div className="text-center mt-6">
                    <p className="text-gray-600">
                      Chưa có tài khoản?{" "}
                      <Link to={paths.Signup} className="text-[var(--primary-ground)] font-medium hover:underline">
                        Đăng ký ngay
                      </Link>
                    </p>
                  </div>
                </form>
              </Form>
              
                              {/* Phần đăng nhập với Google */}
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Hoặc</span>
                  </div>
                </div>
                
                {/* Container cho GoogleLogin được căn giữa */}
                <div className="mt-6 flex justify-center">
                  <div className="transform transition-all duration-300 hover:scale-105">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      useOneTap
                      type="standard"
                      theme="outline"
                      size="large"
                      text="signin_with"
                      shape="rectangular"
                      logo_alignment="center"
                      width="400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}