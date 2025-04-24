import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import authorizedAxiosInstance from '@/lib/axios';
import { useAccount } from '@/hooks/useAccount';

interface UpdateProfileRequest {
  name: string;
  phone?: string;
  language?: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Update Profile Hook
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) =>
      authorizedAxiosInstance.put('/auth/profile', data).then(res => res.data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin thành công');
      queryClient.invalidateQueries({ queryKey: ['account'] }); // Giả sử có hook useAccount
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Cập nhật thông tin thất bại';
      toast.error(errorMessage);
    },
  });
};

// Change Password Hook
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => {
      if (data.newPassword !== data.confirmPassword) {
        toast.error('Mật khẩu xác nhận không khớp');
        return Promise.reject(new Error('Confirm password does not match'));
      }

      if (data.newPassword.length < 8) {
        toast.error('Mật khẩu phải có ít nhất 8 ký tự');
        return Promise.reject(new Error('Password too short'));
      }

      return authorizedAxiosInstance
        .post('/auth/change-password', {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        })
        .then(res => {
          toast.success('Đổi mật khẩu thành công');
          return res.data;
        })
        .catch(error => {
          const errorMessage = error.response?.data?.message || 'Đổi mật khẩu thất bại';
          toast.error(errorMessage);
          throw error;
        });
    },
  });
};

// Delete Account Hook
export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: (password: string) =>
      authorizedAxiosInstance
        .post('/auth/delete-account', { password })
        .then(res => {
          sessionStorage.removeItem('auth_token');
          toast.success('Xóa tài khoản thành công');
          return res.data;
        })
        .catch(error => {
          const errorMessage = error.response?.data?.message || 'Xóa tài khoản thất bại';
          toast.error(errorMessage);
          throw error;
        }),
  });
};
