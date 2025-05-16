import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2 } from 'lucide-react';
import { toast } from 'react-toastify';
import authorizedAxiosInstance from '@/lib/axios';
import { Device } from '@/types/dashboard.types';

interface ShareDeviceModalProps {
  device: Device;
  onDeviceShared?: () => void;
}

export function ShareDeviceModal({ device, onDeviceShared }: ShareDeviceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleShareDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authorizedAxiosInstance.post('/devices/share', {
        DeviceId: device.id,
        EmailToShare: email
      });

      toast.success("Chia sẻ thiết bị thành công!");
      setEmail('');
      setIsOpen(false);
      onDeviceShared && onDeviceShared();

    } catch (error: any) {
      if (error.response) {
        switch (error.response.status) {
          case 400:
            toast.error(error.response.data.message || "Không thể chia sẻ thiết bị");
            break;
          case 404:
            toast.error("Không tìm thấy thiết bị");
            break;
          case 403:
            toast.error("Bạn không có quyền chia sẻ thiết bị này");
            break;
          default:
            toast.error("Đã xảy ra lỗi khi chia sẻ thiết bị");
        }
      } else {
        toast.error("Lỗi kết nối. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Share2 className="h-4 w-4 " />
          Chia sẻ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chia sẻ thiết bị: {device.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleShareDevice} className="space-y-4">
          <div>
            <label htmlFor="shareEmail" className="block text-sm font-medium mb-2">
              Địa chỉ email người dùng muốn chia sẻ
            </label>
            <Input
              id="shareEmail"
              type="email"
              placeholder="Nhập địa chỉ email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Người dùng với email này sẽ được truy cập thiết bị của bạn
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? "Đang chia sẻ..." : "Chia sẻ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}