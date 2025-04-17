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
import { Eye, EyeOff, Lock, Mail } from "lucide-react"; // Thêm các biểu tượng

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
        navigate(paths.Dashboard);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Đăng nhập thất bại, vui lòng thử lại");
    } finally {
      setLoading(false);
    }
  }

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
              
              {/* Các nút đăng nhập với mạng xã hội */}
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Hoặc đăng nhập với</span>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                  >
                    <svg className="w-5 h-5 text-[#3b5998]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.093 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                  >
                    <svg className="w-5 h-5 text-[#1da1f2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                  >
                    <svg className="w-5 h-5 text-[#ea4335]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.086-9.8l4.5-2.6-4.5-2.6v5.2z" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}