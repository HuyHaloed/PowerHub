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
import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { signup } from "@/action/signup";
import { Eye, EyeOff, Mail, User, Phone, Lock } from "lucide-react"; // Thêm biểu tượng

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
  name: z.string().min(2, {
    message: "Tên phải có ít nhất 2 ký tự.",
  }),
  phone: z.string().refine(
    (value) => {
      const phoneRegex = /^[0-9]{10,15}$/;
      return phoneRegex.test(value);
    },
    {
      message: "Số điện thoại không hợp lệ.",
    },
  ),
  password: z.string().min(2, {
    message: "Mật khẩu phải có ít nhất 2 ký tự.",
  }),
});

export default function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animateForm, setAnimateForm] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  // Hiệu ứng animation khi trang tải
  useEffect(() => {
    // Đặt timeout để kích hoạt animation sau khi component được mount
    setTimeout(() => {
      setAnimateForm(true);
    }, 100);
  }, []);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      phone: "",
      password: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const response = await signup(values);

      if (response.success) {
        toast.success(response.message);
        navigate(paths.Login);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row rounded-xl overflow-hidden shadow-2xl max-w-6xl mx-auto bg-white">
          {/* Left side - Image and content */}
          <div className="md:w-1/2 relative overflow-hidden bg-[var(--primary-ground)]">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-ground)]/90 to-[var(--primary-ground)]/70 z-10"></div>
            
            {/* Background image */}
            <img
              src={loginImage}
              alt="Signup"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-90 scale-110 hover:scale-100 transition-transform duration-5000"
            />
            
            {/* Content */}
            <div className="relative z-20 flex flex-col justify-center items-center h-full p-12 text-white">
              <div className={`transform transition-all duration-1000 ${animateForm ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">POWER HUB</h2>
                <p className="text-xl md:text-2xl font-semibold mb-8 text-center">
                  Quản lý năng lượng thông minh
                </p>
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-4">HÃY CHO TÔI BIẾT VẤN ĐỀ CỦA BẠN</h3>
                  <p className="text-white/80">
                    Tham gia cùng chúng tôi để quản lý năng lượng hiệu quả và thông minh hơn
                  </p>
                </div>
                
                {/* Features list with animations */}
                <div className="mt-8 space-y-4">
                  {[
                    "Giám sát năng lượng thời gian thực",
                    "Tiết kiệm chi phí điện năng",
                    "Tự động hóa ngôi nhà thông minh",
                    "Phân tích và gợi ý tối ưu",
                  ].map((feature, index) => (
                    <div 
                      key={index} 
                      className="flex items-center space-x-2 opacity-0 animate-fadeIn"
                      style={{ animationDelay: `${index * 300}ms`, animationFillMode: 'forwards' }}
                    >
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Sign up form */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className={`transition-all duration-1000 ease-out ${animateForm ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'}`}>
              <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Đăng ký tài khoản</h1>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Tên đăng nhập */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className={`transition-all duration-300 transform ${activeField === 'name' ? 'scale-[1.02]' : ''}`}>
                        <FormLabel className="text-gray-700 flex items-center text-base font-medium">
                          <User className="w-4 h-4 mr-2" /> Họ và tên
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              placeholder="Nguyễn Văn A"
                              {...field}
                              disabled={loading}
                              className="h-12 pl-4 pr-10 border-2 border-gray-200 rounded-lg focus:border-[var(--primary-ground)] transition-all duration-300 focus:ring-2 focus:ring-[var(--primary-ground)]/20"
                              onFocus={() => setActiveField('name')}
                              onBlur={() => setActiveField(null)}
                            />
                            <div className="absolute bottom-0 left-0 h-0.5 bg-[var(--primary-ground)] w-0 group-hover:w-full transition-all duration-500"></div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className={`transition-all duration-300 transform ${activeField === 'email' ? 'scale-[1.02]' : ''}`}>
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
                              onFocus={() => setActiveField('email')}
                              onBlur={() => setActiveField(null)}
                            />
                            <div className="absolute bottom-0 left-0 h-0.5 bg-[var(--primary-ground)] w-0 group-hover:w-full transition-all duration-500"></div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  
                  {/* Số điện thoại */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className={`transition-all duration-300 transform ${activeField === 'phone' ? 'scale-[1.02]' : ''}`}>
                        <FormLabel className="text-gray-700 flex items-center text-base font-medium">
                          <Phone className="w-4 h-4 mr-2" /> Số điện thoại
                        </FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input
                              placeholder="0394529624"
                              {...field}
                              disabled={loading}
                              className="h-12 pl-4 pr-10 border-2 border-gray-200 rounded-lg focus:border-[var(--primary-ground)] transition-all duration-300 focus:ring-2 focus:ring-[var(--primary-ground)]/20"
                              onFocus={() => setActiveField('phone')}
                              onBlur={() => setActiveField(null)}
                            />
                            <div className="absolute bottom-0 left-0 h-0.5 bg-[var(--primary-ground)] w-0 group-hover:w-full transition-all duration-500"></div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  
                  {/* Mật khẩu */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className={`transition-all duration-300 transform ${activeField === 'password' ? 'scale-[1.02]' : ''}`}>
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
                              onFocus={() => setActiveField('password')}
                              onBlur={() => setActiveField(null)}
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
                      </FormItem>
                    )}
                  />
                  
                  {/* Submit button with animation */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-[var(--primary-ground)] hover:bg-[var(--primary-ground)]/90 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg relative overflow-hidden group"
                    >
                      <span className="relative z-10">
                        {loading ? "Đang xử lý..." : "Đăng ký"}
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
                  </div>
                  
                  <div className="text-center mt-6">
                    <p className="text-gray-600">
                      Đã có tài khoản?{" "}
                      <Link to={paths.Login} className="text-[var(--primary-ground)] font-medium hover:underline">
                        Đăng nhập ngay
                      </Link>
                    </p>
                  </div>
                </form>
              </Form>
              
              {/* Social sign up */}
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Hoặc đăng ký với</span>
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