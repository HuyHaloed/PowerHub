import React, { useState } from 'react';
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
import { Mail, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import authorizedAxiosInstance from "@/lib/axios";
import { paths } from "@/utils/path";

const formSchema = z.object({
  email: z.string().refine(
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    {
      message: "Email không hợp lệ.",
    }
  ),
});

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const response = await authorizedAxiosInstance.post("/auth/forgot-password", {
        email: values.email,
      });

      if (response.data.success) {
        toast.success("Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.");
        setEmailSent(true);
      } else {
        toast.error(response.data.message || "Không thể gửi email đặt lại mật khẩu");
      }
    } catch (error: any) {
      const errorMessage = 
        error.response?.data?.message || 
        "Có lỗi xảy ra. Vui lòng thử lại sau.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <Mail className="mx-auto h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Kiểm tra Email của bạn
          </h2>
          <p className="text-gray-600 mb-6">
            Chúng tôi đã gửi một liên kết đặt lại mật khẩu tới email của bạn. 
            Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
          </p>
          <Link to={paths.Login}>
            <Button variant="outline" className="w-full">
              Quay lại trang đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row rounded-xl overflow-hidden shadow-2xl max-w-6xl mx-auto bg-white">
          {/* Phần trái - Hình ảnh và slogan */}
          <div className="md:w-1/2 relative overflow-hidden bg-[var(--primary-ground)]">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary-ground)]/90 to-[var(--primary-ground)]/70 z-10"></div>
            
            {/* Nội dung bên trái */}
            <div className="relative z-20 flex flex-col justify-center items-center h-full p-12 text-white">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">POWER HUB</h2>
                <p className="text-xl md:text-2xl font-semibold mb-8 text-center">
                  Quản lý năng lượng thông minh
                </p>
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-4">QUÊN MẬT KHẨU?</h3>
                  <p className="text-white/80">
                    Đừng lo! Chúng tôi sẽ giúp bạn khôi phục quyền truy cập vào tài khoản.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Phần phải - Form quên mật khẩu */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Quên Mật Khẩu</h1>
            
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
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[var(--primary-ground)] hover:bg-[var(--primary-ground)]/90 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                >
                  {loading ? "Đang xử lý..." : "Gửi Liên Kết Đặt Lại Mật Khẩu"}
                </Button>
                
                <div className="text-center mt-4">
                  <Link 
                    to={paths.Login} 
                    className="text-[var(--primary-ground)] font-medium hover:underline flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại trang đăng nhập
                  </Link>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}