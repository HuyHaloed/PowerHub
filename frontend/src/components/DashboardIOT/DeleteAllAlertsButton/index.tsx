import React from 'react';
import { Button } from "@/components/ui/button";
import authorizedAxiosInstance from '@/lib/axios';
import { toast } from 'react-toastify';
import { Trash2 } from 'lucide-react';

const DeleteAllAlertsButton = ({ onAllAlertsDeleted }: { onAllAlertsDeleted?: () => void }) => {
  const handleDeleteAllAlerts = async () => {
    try {
      // Use the correct API endpoint that matches the controller route
      await authorizedAxiosInstance.delete('/thresholds/alerts/all');
      toast.success("Đã xóa tất cả thông báo ngưỡng quá tải");
      
      // Call the callback if provided
      if (onAllAlertsDeleted) {
        onAllAlertsDeleted();
      }
    } catch (error) {
      console.error("Không thể xóa tất cả thông báo:", error);
      toast.error("Không thể xóa tất cả thông báo");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center"
      onClick={handleDeleteAllAlerts}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Xóa tất cả thông báo
    </Button>
  );
};

export default DeleteAllAlertsButton;