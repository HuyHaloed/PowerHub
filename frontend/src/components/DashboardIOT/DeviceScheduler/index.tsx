// File: src/components/DashboardIOT/DeviceScheduler/index.tsx
import React, { useState, useEffect } from 'react';
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
// Đảm bảo import đúng authorizedAxiosInstance
// Chúng ta sẽ cấu hình base URL cho nó bên dưới hoặc trong file authorizedAxiosInstance.ts
import authorizedAxiosInstance from '@/lib/axios';

// Cấu trúc dữ liệu lịch trình ở Frontend
interface DeviceScheduleEvent {
  id: string; // ID duy nhất cho mỗi mục lịch trình ở frontend
  deviceId: string;
  title: string;
  time: string; // Thời gian dưới dạng "HH:mm"
  days: string[]; // Các ngày trong tuần (ví dụ: ["monday", "wednesday"])
  action: 'on' | 'off'; // Hành động: 'on' hoặc 'off'
  active: boolean;
}

// Cấu trúc dữ liệu lịch trình ở Backend (theo API hiện tại)
interface BackendDeviceSchedule {
    deviceId?: string | null; // Có thể null
    onTime: string; // TimeSpan được serialize thành string "HH:mm:ss"
    offTime: string; // TimeSpan được serialize thành string "HH:mm:ss"
}


interface DeviceSchedulerProps {
  devices: Device[];
  onScheduleUpdate?: () => void;
}

// Cấu hình base URL cho axios instance nếu chưa được cấu hình ở nơi khác
// Nếu authorizedAxiosInstance đã có cấu hình base URL global, bạn không cần dòng này
// Tuy nhiên, để đảm bảo nó trỏ đến localhost:5000, chúng ta thêm nó ở đây
// Trong môi trường production, bạn sẽ thay thế bằng URL của API thật
if (!authorizedAxiosInstance.defaults.baseURL) {
    authorizedAxiosInstance.defaults.baseURL = 'http://localhost:5000';
}


export default function DeviceScheduler({ devices, onScheduleUpdate }: DeviceSchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Trạng thái cho các schedule hiển thị trên giao diện
  // Lưu ý: State này có thể không phản ánh chính xác 1-1 với backend do sự không khớp cấu trúc
  const [schedules, setSchedules] = useState<DeviceScheduleEvent[]>([]);
  const [newSchedule, setNewSchedule] = useState<Omit<DeviceScheduleEvent, 'id'>>({
    deviceId: "",
    title: "",
    time: "12:00",
    days: [],
    action: "on",
    active: true
  });

  const daysOfWeek = [
    { value: "monday", label: "Thứ 2" },
    { value: "tuesday", label: "Thứ 3" },
    { value: "wednesday", label: "Thứ 4" },
    { value: "thursday", label: "Thứ 5" },
    { value: "friday", label: "Thứ 6" },
    { value: "saturday", label: "Thứ 7" },
    { value: "sunday", label: "Chủ nhật" },
  ];

  // Effect để lấy lịch trình từ backend khi component mount hoặc danh sách thiết bị thay đổi
  const fetchSchedules = async () => {
    if (devices.length === 0) {
        setSchedules([]); // Reset schedules if no devices
        return;
    }

    try {
      // Với API backend hiện tại (GET api/scheduler/{deviceId}), chúng ta phải gọi API cho từng thiết bị
      const allSchedules: DeviceScheduleEvent[] = [];
      for (const device of devices) {
        try {
           // Gọi API lấy lịch trình cho từng thiết bị
          const response = await authorizedAxiosInstance.get<BackendDeviceSchedule>(`/api/scheduler/${device.id}`);
          const backendSchedule = response.data; // Backend trả về BackendDeviceSchedule (onTime, offTime)

          // Chuyển đổi từ cấu trúc backend sang cấu trúc frontend DeviceScheduleEvent
          // LƯU Ý: Việc ánh xạ này có thể không chính xác hoặc đầy đủ do sự không khớp cấu trúc dữ liệu backend/frontend
          // Backend chỉ có 1 OnTime và 1 OffTime duy nhất cho mỗi thiết bị, không có thông tin ngày hoặc nhiều lịch trình
          if (backendSchedule.onTime && backendSchedule.onTime !== "00:00:00") { // Giả định "00:00:00" là không có lịch
               try {
                   const [hours, minutes] = backendSchedule.onTime.split(':').map(Number);
                    allSchedules.push({
                        id: `${device.id}-on`, // Tạo ID tạm cho frontend
                        deviceId: device.id,
                        title: `Bật ${device.name}`,
                        time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
                        days: daysOfWeek.map(d => d.value), // Giả định áp dụng cho tất cả các ngày (do backend không có thông tin ngày)
                        action: 'on',
                        active: true, // Giả định mặc định là active
                    });
               } catch (e) {
                   console.error(`Error parsing OnTime for device ${device.id}: ${backendSchedule.onTime}`, e);
               }
          }
           if (backendSchedule.offTime && backendSchedule.offTime !== "00:00:00") { // Giả định "00:00:00" là không có lịch
               try {
                    const [hours, minutes] = backendSchedule.offTime.split(':').map(Number);
                     allSchedules.push({
                         id: `${device.id}-off`, // Tạo ID tạm cho frontend
                         deviceId: device.id,
                         title: `Tắt ${device.name}`,
                         time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
                         days: daysOfWeek.map(d => d.value), // Giả định áp dụng cho tất cả các ngày
                         action: 'off',
                         active: true, // Giả định mặc định là active
                     });
               } catch (e) {
                    console.error(`Error parsing OffTime for device ${device.id}: ${backendSchedule.offTime}`, e);
               }
          }

        } catch (error: any) {
           // Xử lý lỗi nếu không tìm thấy lịch trình cho thiết bị (ví dụ: API trả về 404)
           if (error.response && error.response.status === 404) {
               console.log(`No schedule found for device ${device.id}`);
           } else {
               console.error(`Error fetching schedule for device ${device.id}:`, error);
               // toast.error(`Không thể lấy lịch trình cho thiết bị ${device.name}`); // Có thể gây spam toast
           }
        }
      }
      setSchedules(allSchedules);

    } catch (err) {
      console.error("Không thể lấy danh sách lịch:", err);
      toast.error("Không thể lấy danh sách lịch.");
    }
  };

  useEffect(() => {
    fetchSchedules();

    // Effect re-run when devices list changes
  }, [devices]); // Dependency array

  // Lấy schedule cho ngày đã chọn - dựa trên state schedules ở frontend
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

    // LƯU Ý QUAN TRỌNG: API backend hiện tại (POST api/scheduler/{deviceId}) chỉ nhận OnTime và OffTime.
    // Nó không hỗ trợ lưu trữ thông tin ngày trong tuần hoặc nhiều lịch trình cho cùng một thiết bị.
    // Việc gọi API với cấu trúc hiện tại sẽ ghi đè OnTime/OffTime duy nhất của thiết bị.
    // Để hỗ trợ đầy đủ tính năng lập lịch từ frontend, bạn CẦN điều chỉnh API backend.
    // Dưới đây là cách gọi API dựa trên cấu trúc backend hiện có, nhưng nó có hạn chế.

    try {
      const [hours, minutes] = newSchedule.time.split(':').map(Number);
      const timeSpanString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

      // Chuẩn bị payload phù hợp với BackendDeviceSchedule
      const payload: Partial<BackendDeviceSchedule> = {};
      if (newSchedule.action === 'on') {
          payload.onTime = timeSpanString;
          // payload.offTime = "00:00:00"; // Có thể không cần gửi nếu backend xử lý null/mặc định
      } else { // action === 'off'
          payload.offTime = timeSpanString;
          // payload.onTime = "00:00:00"; // Có thể không cần gửi nếu backend xử lý null/mặc định
      }

      // Gọi API backend để thiết lập lịch trình
      const response = await authorizedAxiosInstance.post<BackendDeviceSchedule>(`/api/scheduler/${selectedDevice}`, payload);

      // Sau khi gọi API thành công, cập nhật state schedules
      // Cách tốt nhất là fetch lại toàn bộ lịch trình sau khi thêm/cập nhật
      // hoặc cập nhật state local dựa trên response nếu backend trả về dữ liệu đầy đủ.
      // Tạm thời fetch lại để đảm bảo đồng bộ với backend (dù backend có hạn chế)
      await fetchSchedules(); // Gọi lại hàm fetch

      toast.success("Đã thêm/cập nhật lịch thành công!");
      resetNewScheduleForm();
      setIsScheduleModalOpen(false);

      if (onScheduleUpdate) {
        onScheduleUpdate();
      }
    } catch (err) {
      toast.error("Không thể thêm/cập nhật lịch: " + (err as Error).message);
      console.error(err);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
     // LƯU Ý QUAN TRỌNG: API backend hiện tại (DELETE api/scheduler/{deviceId}) xóa TOÀN BỘ lịch trình
     // (OnTime và OffTime) cho thiết bị đó, không phải một lịch trình cụ thể theo ID.
     // Frontend quản lý lịch trình bằng ID riêng.
     // Để hỗ trợ xóa lịch trình cụ thể từ frontend, bạn CẦN điều chỉnh API backend.
     // Dưới đây là cách gọi API dựa trên cấu trúc backend hiện có, nó sẽ xóa cả OnTime và OffTime của thiết bị.

    try {
      // Tìm schedule cần xóa để lấy deviceId
      const scheduleToDelete = schedules.find(s => s.id === scheduleId);
      if (!scheduleToDelete) {
        toast.error("Không tìm thấy lịch để xóa.");
        return;
      }

      // Gọi API backend để xóa lịch trình của thiết bị
      // API này sẽ xóa cả OnTime và OffTime
      await authorizedAxiosInstance.delete(`/api/scheduler/${scheduleToDelete.deviceId}`);

      // Sau khi gọi API thành công, cập nhật state schedules
      // Tạm thời fetch lại để đảm bảo đồng bộ với backend
      await fetchSchedules(); // Gọi lại hàm fetch

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
      // LƯU Ý QUAN TRỌNG: API backend hiện tại KHÔNG có endpoint để bật/tắt trạng thái active của một lịch trình cụ thể.
      // Tính năng active/inactive chỉ đang được quản lý ở frontend state.
      // Để hỗ trợ tính năng này đầy đủ, bạn CẦN điều chỉnh API backend để có endpoint cập nhật trạng thái active.
      // Ví dụ: PATCH /api/schedules/{scheduleId} với body { "active": true/false }

      // Hiện tại, chúng ta chỉ cập nhật state ở frontend
      setSchedules(schedules.map(s =>
        s.id === scheduleId ? {...s, active: !currentActive} : s
      ));

      // Bạn có thể thêm toast thông báo local
      toast.success(`Đã ${!currentActive ? 'kích hoạt' : 'vô hiệu hóa'} lịch (chỉ trên giao diện)!`);

      // Nếu bạn đã có API backend để cập nhật trạng thái, hãy bỏ comment và sử dụng nó:
      /*
      try {
          await authorizedAxiosInstance.patch(`/api/schedules/${scheduleId}`, {
              active: !currentActive
          });
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
      */
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
                        {/* Checkbox bật/tắt lịch - hiện chỉ ảnh hưởng frontend state */}
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
