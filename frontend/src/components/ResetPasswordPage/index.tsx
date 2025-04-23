import React, { useState, useEffect } from 'react';
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
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import authorizedAxiosInstance from "@/lib/axios";

// Validate password: 
// - Ít nhất 8 ký tự
// - Phải có ít nhất 1 chữ hoa
// - Phải có ít nhất 1 chữ thường
// - Phải có ít nhất 1 số
const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
    .refine(
      (password) => /[A-Z]/.test(password), 
      { message: "Mật khẩu phải chứa ít nhất 1 chữ hoa" }
    )
    .refine(
      (password) => /[a-z]/.test(password), 
      { message: "Mật khẩu phải chứa ít nhất 1 chữ thường" }
    )
    .refine(
      (password) => /[0-9]/.test(password), 
      { message: "Mật khẩu phải chứa ít nhất 1 chữ số" }
    ),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"]
});

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Lấy token từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    
    if (!resetToken) {
      toast.error("Không tìm thấy token đặt lại mật khẩu");
    } else {
      setToken(resetToken);
    }
  }, []);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: ""
    }
  });

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    if (!token) {
      toast.error("Token đặt lại mật khẩu không hợp lệ");
      return;
    }

    try {
      setLoading(true);
      const response = await authorizedAxiosInstance.post("/auth/reset-password", {
        token: token,
        newPassword: values.newPassword
      });

      if (response.data.success) {
        toast.success("Đặt lại mật khẩu thành công");
        // Chuyển hướng đến trang đăng nhập
        window.location.href = "/sign-in";
      } else {
        toast.error(response.data.message || "Không thể đặt lại mật khẩu");
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

  // Hàm toggle hiển thị mật khẩu
  const togglePasswordVisibility = (field: 'newPassword' | 'confirmPassword') => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="min-h-screen flex items-center bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
            Đặt Lại Mật Khẩu
          </h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 flex items-center text-base font-medium">
                      <Lock className="w-4 h-4 mr-2" /> Mật Khẩu Mới
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Input
                          type={showPassword.newPassword ? "text" : "password"}
                          placeholder="Nhập mật khẩu mới"
                          {...field}
                          disabled={loading}
                          className="h-12 pl-4 pr-12 border-2 border-gray-200 rounded-lg focus:border-[var(--primary-ground)] transition-all duration-300"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-[var(--primary-ground)]"
                          onClick={() => togglePasswordVisibility('newPassword')}
                          disabled={loading}
                        >
                          {showPassword.newPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 flex items-center text-base font-medium">
                      <Lock className="w-4 h-4 mr-2" /> Xác Nhận Mật Khẩu
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Input
                          type={showPassword.confirmPassword ? "text" : "password"}
                          placeholder="Nhập lại mật khẩu mới"
                          {...field}
                          disabled={loading}
                          className="h-12 pl-4 pr-12 border-2 border-gray-200 rounded-lg focus:border-[var(--primary-ground)] transition-all duration-300"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-[var(--primary-ground)]"
                          onClick={() => togglePasswordVisibility('confirmPassword')}
                          disabled={loading}
                        >
                          {showPassword.confirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[var(--primary-ground)] hover:bg-[var(--primary-ground)]/90 text-white rounded-lg font-medium transition-all duration-300"
              >
                {loading ? "Đang xử lý..." : "Đặt Lại Mật Khẩu"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}