import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Plus, Trash2 } from "lucide-react";
import { toast } from 'react-toastify';
import { Device } from '@/types/dashboard.types';
import authorizedAxiosInstance from '@/lib/axios';

interface DeviceScheduleEvent {
  id: string;
  deviceId: string;
  title: string;
  time: string;
  days: string[];
  action: 'on' | 'off';
  active: boolean;
}

interface DeviceSchedulerProps {
  devices: Device[];
  onScheduleUpdate?: () => void;
}

export default function DeviceScheduler({ devices, onScheduleUpdate }: DeviceSchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // Trạng thái cho các schedule
  const [schedules, setSchedules] = useState<DeviceScheduleEvent[]>([]);
  const [newSchedule, setNewSchedule] = useState<Omit<DeviceScheduleEvent, 'id'>>({
    deviceId: "",
    title: "",
    time: "12:00",
    days: [],
    action: "on",
    active: true
  });

  // Demo data - trong thực tế bạn sẽ lấy từ API
  const daysOfWeek = [
    { value: "monday", label: "Thứ 2" },
    { value: "tuesday", label: "Thứ 3" },
    { value: "wednesday", label: "Thứ 4" },
    { value: "thursday", label: "Thứ 5" },
    { value: "friday", label: "Thứ 6" },
    { value: "saturday", label: "Thứ 7" },
    { value: "sunday", label: "Chủ nhật" },
  ];

  // Lấy schedule cho ngày đã chọn - demo
  const getSchedulesForDate = () => {
    return schedules.filter(schedule => {
      if (!date) return false;
      const dayIndex = date.getDay();
      const dayMap: Record<number, string> = {
        0: "sunday",
        1: "monday",
        2: "tuesday",
        3: "wednesday",
        4: "thursday",
        5: "friday",
        6: "saturday"
      };
      return schedule.days.includes(dayMap[dayIndex]);
    });
  };

  const handleAddSchedule = async () => {
    if (!selectedDevice || !newSchedule.time || newSchedule.days.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin lịch");
      return;
    }

    try {
      // Trong thực tế, bạn sẽ gọi API để lưu lịch
      // const response = await authorizedAxiosInstance.post('/device-schedules', {
      //   deviceId: selectedDevice,
      //   title: newSchedule.title || `${newSchedule.action === 'on' ? 'Bật' : 'Tắt'} thiết bị`,
      //   time: newSchedule.time,
      //   days: newSchedule.days,
      //   action: newSchedule.action,
      //   active: true
      // });
      
      // Giả lập response từ server
      const newScheduleItem: DeviceScheduleEvent = {
        ...newSchedule,
        deviceId: selectedDevice,
        id: Math.random().toString(36).substring(2, 9), // Tạo ID tạm thời
        title: newSchedule.title || `${newSchedule.action === 'on' ? 'Bật' : 'Tắt'} thiết bị`
      };
      
      setSchedules([...schedules, newScheduleItem]);
      
      toast.success("Đã thêm lịch mới thành công!");
      resetNewScheduleForm();
      setIsScheduleModalOpen(false);
      
      if (onScheduleUpdate) {
        onScheduleUpdate();
      }
    } catch (err) {
      toast.error("Không thể thêm lịch: " + (err as Error).message);
      console.error(err);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      // Trong thực tế, bạn sẽ gọi API để xóa lịch
      // await authorizedAxiosInstance.delete(`/device-schedules/${scheduleId}`);
      
      setSchedules(schedules.filter(s => s.id !== scheduleId));
      toast.success("Đã xóa lịch thành công!");
      
      if (onScheduleUpdate) {
        onScheduleUpdate();
      }
    } catch (err) {
      toast.error("Không thể xóa lịch: " + (err as Error).message);
      console.error(err);
    }
  };

  const handleToggleScheduleActive = async (scheduleId: string, currentActive: boolean) => {
    try {
      // Trong thực tế, bạn sẽ gọi API để cập nhật trạng thái
      // await authorizedAxiosInstance.patch(`/device-schedules/${scheduleId}`, {
      //   active: !currentActive
      // });
      
      setSchedules(schedules.map(s => 
        s.id === scheduleId ? {...s, active: !currentActive} : s
      ));
      
      toast.success(`Đã ${!currentActive ? 'kích hoạt' : 'vô hiệu hóa'} lịch!`);
      
      if (onScheduleUpdate) {
        onScheduleUpdate();
      }
    } catch (err) {
      toast.error("Không thể cập nhật trạng thái lịch: " + (err as Error).message);
      console.error(err);
    }
  };

  const resetNewScheduleForm = () => {
    setSelectedDevice("");
    setNewSchedule({
      deviceId: "",
      title: "",
      time: "12:00",
      days: [],
      action: "on",
      active: true
    });
  };

  const handleDayToggle = (day: string) => {
    if (newSchedule.days.includes(day)) {
      setNewSchedule({
        ...newSchedule,
        days: newSchedule.days.filter(d => d !== day)
      });
    } else {
      setNewSchedule({
        ...newSchedule,
        days: [...newSchedule.days, day]
      });
    }
  };

  const getDeviceNameById = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device ? device.name : "Không xác định";
  };

  const schedulesForDate = getSchedulesForDate();

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Lịch thiết bị</h1>
        <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Thêm lịch mới
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tạo lịch tự động</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Thiết bị</label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thiết bị" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name} ({device.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tiêu đề lịch (tùy chọn)</label>
                <Input 
                  placeholder="Nhập tiêu đề" 
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Thời gian</label>
                <Input 
                  type="time" 
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Hành động</label>
                <Select 
                  value={newSchedule.action} 
                  onValueChange={(value: 'on' | 'off') => setNewSchedule({...newSchedule, action: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hành động" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on">Bật thiết bị</SelectItem>
                    <SelectItem value="off">Tắt thiết bị</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ngày trong tuần</label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={day.value}
                        checked={newSchedule.days.includes(day.value)}
                        onCheckedChange={() => handleDayToggle(day.value)}
                      />
                      <label htmlFor={day.value} className="text-sm">
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleAddSchedule}>
                  Thêm lịch
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lịch</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal mb-4"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: vi }) : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                      setIsDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                Lịch cho ngày {date ? format(date, "dd/MM/yyyy", { locale: vi }) : ""}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Thêm
              </Button>
            </CardHeader>
            <CardContent>
              {schedulesForDate.length > 0 ? (
                <div className="space-y-4">
                  {schedulesForDate.map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${schedule.action === 'on' ? 'bg-green-100' : 'bg-red-100'}`}>
                          <Clock className={`h-5 w-5 ${schedule.action === 'on' ? 'text-green-500' : 'text-red-500'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{schedule.title}</p>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <span>{schedule.time}</span>
                            <span>•</span>
                            <span>{getDeviceNameById(schedule.deviceId)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          checked={schedule.active}
                          onCheckedChange={() => handleToggleScheduleActive(schedule.id, schedule.active)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSchedule(schedule.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Không có lịch nào cho ngày này</p>
                  <Button variant="link" onClick={() => setIsScheduleModalOpen(true)}>
                    Thêm lịch mới
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}