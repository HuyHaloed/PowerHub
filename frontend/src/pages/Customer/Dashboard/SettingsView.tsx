import { useEffect, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useUpdateProfile, useChangePassword, useDeleteAccount } from '@/hooks/UserSettingsService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function SettingsView() {
  const { data: user } = useAccount();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');

  // Hooks
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const deleteAccountMutation = useDeleteAccount();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate({ name, phone });
  };

  const handleChangePassword = () => {
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword,
    }, {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    });
  };

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate(deletePassword, {
      onSuccess: () => {
        window.location.href = '/';
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Personal Information Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Thông tin cá nhân</h2>
        <div className="space-y-4">
          <div>
            <Label>Họ và tên</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập họ và tên"
            />
          </div>
          <div>
            <Label>Số điện thoại</Label>
            <Input 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleUpdateProfile} disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Đổi mật khẩu</h2>
        <div className="space-y-4">
          <div>
            <Label>Mật khẩu hiện tại</Label>
            <Input 
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>
          <div>
            <Label>Mật khẩu mới</Label>
            <Input 
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
            />
          </div>
          <div>
            <Label>Xác nhận mật khẩu mới</Label>
            <Input 
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              // placeholder="Nhập lại mật khẩu mới"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="bg-white shadow rounded-lg p-6 border-red-500 border">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Xóa tài khoản</h2>
        <p className="text-sm text-gray-600 mb-4">
          Việc xóa tài khoản sẽ loại bỏ vĩnh viễn tất cả dữ liệu của bạn. 
          Hành động này không thể hoàn tác.
        </p>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">Xóa tài khoản</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa tài khoản</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Vui lòng nhập mật khẩu để xác nhận việc xóa tài khoản
              </p>
              <Input 
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Nhập mật khẩu"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Hủy</Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountMutation.isPending}
                >
                  {deleteAccountMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
