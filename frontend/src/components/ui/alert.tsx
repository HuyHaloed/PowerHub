import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff, Trash2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import authorizedAxiosInstance from '@/lib/axios';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  date: string;
  isRead?: boolean;
}

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<string | null>(null);
  const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await authorizedAxiosInstance.get('/alerts');
      if (response.data) {
        // Sắp xếp cảnh báo theo thời gian giảm dần (mới nhất đầu tiên)
        const sortedAlerts = response.data.sort((a: Alert, b: Alert) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAlerts(sortedAlerts);
      }
    } catch (error) {
      console.error('Lỗi khi tải cảnh báo:', error);
      toast.error('Không thể tải cảnh báo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const markAsRead = async (alertId: string) => {
    try {
      await authorizedAxiosInstance.patch(`/alerts/${alertId}/read`);
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc cảnh báo:', error);
      toast.error('Không thể đánh dấu cảnh báo');
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      await authorizedAxiosInstance.delete(`/thresholds/alerts/${alertId}`);
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
      toast.success('Đã xóa cảnh báo');
    } catch (error) {
      console.error('Lỗi khi xóa cảnh báo:', error);
      toast.error('Không thể xóa cảnh báo');
    } finally {
      setAlertToDelete(null);
      setIsConfirmDeleteOpen(false);
    }
  };

  const deleteAllAlerts = async () => {
    try {
      await authorizedAxiosInstance.delete('/thresholds/alerts/all');
      setAlerts([]);
      toast.success('Đã xóa tất cả cảnh báo');
    } catch (error) {
      console.error('Lỗi khi xóa tất cả cảnh báo:', error);
      toast.error('Không thể xóa các cảnh báo');
    } finally {
      setIsConfirmDeleteAllOpen(false);
    }
  };

  const handleDeleteClick = (alertId: string) => {
    setAlertToDelete(alertId);
    setIsConfirmDeleteOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-orange-100 text-orange-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Cảnh báo gần đây</CardTitle>
        <div className="flex items-center space-x-2">
          {alerts.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsConfirmDeleteAllOpen(true)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Xóa tất cả
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {alerts.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-3 border rounded-lg relative ${
                  alert.isRead ? 'bg-white' : 'bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-2">
                    <Bell className={`h-5 w-5 ${
                      alert.severity === 'error' ? 'text-red-500' :
                      alert.severity === 'warning' ? 'text-orange-500' :
                      'text-blue-500'
                    }`} />
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge className={`ml-2 text-xs ${getSeverityColor(alert.severity)}`}>
                          {alert.severity === 'error' ? 'Lỗi' :
                           alert.severity === 'warning' ? 'Cảnh báo' :
                           alert.severity === 'info' ? 'Thông tin' : 'Thành công'}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1">{alert.message}</p>
                      <span className="text-xs text-gray-500 block mt-1">
                        {formatDate(alert.date)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {!alert.isRead && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => markAsRead(alert.id)}
                        title="Đánh dấu đã đọc"
                      >
                        <BellOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" 
                      onClick={() => handleDeleteClick(alert.id)}
                      title="Xóa cảnh báo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Không có cảnh báo mới</p>
          </div>
        )}
      </CardContent>

      {/* Xác nhận xóa một cảnh báo */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="py-2">Bạn có chắc chắn muốn xóa cảnh báo này không?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>Hủy</Button>
            <Button 
              variant="destructive"
              onClick={() => alertToDelete && deleteAlert(alertToDelete)}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Xác nhận xóa tất cả cảnh báo */}
      <Dialog open={isConfirmDeleteAllOpen} onOpenChange={setIsConfirmDeleteAllOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa tất cả</DialogTitle>
          </DialogHeader>
          <p className="py-2">Bạn có chắc chắn muốn xóa tất cả cảnh báo không?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDeleteAllOpen(false)}>Hủy</Button>
            <Button 
              variant="destructive"
              onClick={deleteAllAlerts}
            >
              Xóa tất cả
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AlertsPanel;