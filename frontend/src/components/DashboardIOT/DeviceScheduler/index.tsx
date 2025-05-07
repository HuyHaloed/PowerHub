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

interface BackendDeviceSchedule {
  id?: string;
  deviceId?: string | null;
  onTime: string;
  offTime: string;
  daysOfWeek?: number[];
}

interface DeviceSchedulerProps {
  devices: Device[];
  onScheduleUpdate?: () => void;
}

if (!authorizedAxiosInstance.defaults.baseURL) {
  authorizedAxiosInstance.defaults.baseURL = 'http://localhost:5000';
}

const dayValueToNumberMap: Record<string, number> = {
  "monday": 1,
  "tuesday": 2,
  "wednesday": 3,
  "thursday": 4,
  "friday": 5,
  "saturday": 6,
  "sunday": 0
};

const numberToDayValueMap: Record<number, string> = {
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
  0: "sunday"
};

// Chuyển đổi từ 24 giờ sang 12 giờ với AM/PM
const formatTimeTo12Hour = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const adjustedHours = hours % 12 || 12;
  return `${adjustedHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

export default function DeviceScheduler({ devices, onScheduleUpdate }: DeviceSchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [schedules, setSchedules] = useState<DeviceScheduleEvent[]>([]);
  // Modified to track both on and off times
  const [newSchedule, setNewSchedule] = useState({
    deviceId: "",
    title: "",
    onTime: "08:00",  // Default ON time
    offTime: "20:00", // Default OFF time
    days: [] as string[],
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

  const fetchSchedules = async () => {
    if (devices.length === 0) {
      setSchedules([]);
      return;
    }

    try {
      const allSchedulesResponse = await authorizedAxiosInstance.get('/Scheduler');
      
      if (allSchedulesResponse.data && Array.isArray(allSchedulesResponse.data)) {
        const backendSchedules: BackendDeviceSchedule[] = allSchedulesResponse.data;
        
        const allSchedules: DeviceScheduleEvent[] = [];
        
        for (const backendSchedule of backendSchedules) {
          const deviceId = backendSchedule.deviceId;
          if (!deviceId) continue;
          
          const device = devices.find(d => d.id === deviceId);
          if (!device) continue;
          
          const scheduleDays = backendSchedule.daysOfWeek && backendSchedule.daysOfWeek.length > 0
            ? backendSchedule.daysOfWeek.map(day => numberToDayValueMap[day] || "").filter(Boolean)
            : daysOfWeek.map(d => d.value);
          
          // Each schedule ID now includes a unique identifier (timestamp) to prevent collisions
          const scheduleUniqueId = backendSchedule.id || Date.now().toString();
          
          if (backendSchedule.onTime && backendSchedule.onTime !== "00:00:00") {
            try {
              const [hours, minutes] = backendSchedule.onTime.split(':').map(Number);
              const time24 = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
              allSchedules.push({
                id: `${deviceId}-on-${scheduleUniqueId}`,
                deviceId: deviceId,
                title: `Bật ${device.name}`,
                time: formatTimeTo12Hour(time24),
                days: scheduleDays,
                action: 'on',
                active: true,
              });
            } catch (e) {
              console.error(`Error parsing OnTime for device ${deviceId}: ${backendSchedule.onTime}`, e);
            }
          }
          
          if (backendSchedule.offTime && backendSchedule.offTime !== "00:00:00") {
            try {
              const [hours, minutes] = backendSchedule.offTime.split(':').map(Number);
              const time24 = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
              allSchedules.push({
                id: `${deviceId}-off-${scheduleUniqueId}`,
                deviceId: deviceId,
                title: `Tắt ${device.name}`,
                time: formatTimeTo12Hour(time24),
                days: scheduleDays,
                action: 'off',
                active: true,
              });
            } catch (e) {
              console.error(`Error parsing OffTime for device ${deviceId}: ${backendSchedule.offTime}`, e);
            }
          }
        }
        
        setSchedules(allSchedules);
      }
    } catch (err: any) {
      console.warn("Failed to fetch all schedules, falling back to individual device schedule fetching:", err);
      
      const allSchedules: DeviceScheduleEvent[] = [];
      for (const device of devices) {
        try {
          const response = await authorizedAxiosInstance.get<BackendDeviceSchedule>(`/Scheduler/${device.id}`);
          const backendSchedule = response.data;
          
          const scheduleUniqueId = backendSchedule.id || Date.now().toString();
          
          const scheduleDays = backendSchedule.daysOfWeek && backendSchedule.daysOfWeek.length > 0
            ? backendSchedule.daysOfWeek.map(day => numberToDayValueMap[day] || "").filter(Boolean)
            : daysOfWeek.map(d => d.value);

          if (backendSchedule.onTime && backendSchedule.onTime !== "00:00:00") {
            try {
              const [hours, minutes] = backendSchedule.onTime.split(':').map(Number);
              const time24 = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
              allSchedules.push({
                id: `${device.id}-on-${scheduleUniqueId}`,
                deviceId: device.id,
                title: `Bật ${device.name}`,
                time: formatTimeTo12Hour(time24),
                days: scheduleDays,
                action: 'on',
                active: true,
              });
            } catch (e) {
              console.error(`Error parsing OnTime for device ${device.id}: ${backendSchedule.onTime}`, e);
            }
          }
          
          if (backendSchedule.offTime && backendSchedule.offTime !== "00:00:00") {
            try {
              const [hours, minutes] = backendSchedule.offTime.split(':').map(Number);
              const time24 = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
              allSchedules.push({
                id: `${device.id}-off-${scheduleUniqueId}`,
                deviceId: device.id,
                title: `Tắt ${device.name}`,
                time: formatTimeTo12Hour(time24),
                days: scheduleDays,
                action: 'off',
                active: true,
              });
            } catch (e) {
              console.error(`Error parsing OffTime for device ${device.id}: ${backendSchedule.offTime}`, e);
            }
          }
        } catch (error: any) {
          if (error.response && error.response.status === 404) {
            console.log(`No schedule found for device ${device.id}`);
          } else {
            console.error(`Error fetching schedule for device ${device.id}:`, error);
          }
        }
      }
      
      setSchedules(allSchedules);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [devices]);

  const getSchedulesForDate = () => {
    return schedules.filter(schedule => {
      if (!date) return false;
      const dayIndex = date.getDay();
      const dayValue = numberToDayValueMap[dayIndex];
      return schedule.days.includes(dayValue);
    });
  };

  const handleAddSchedule = async () => {
    if (!selectedDevice || !newSchedule.onTime || !newSchedule.offTime || newSchedule.days.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin lịch");
      return;
    }

    try {
      // Parse ON time
      const [onHours, onMinutes] = newSchedule.onTime.split(':').map(Number);
      const onTimeString = `${String(onHours).padStart(2, '0')}:${String(onMinutes).padStart(2, '0')}:00`;
      
      // Parse OFF time
      const [offHours, offMinutes] = newSchedule.offTime.split(':').map(Number);
      const offTimeString = `${String(offHours).padStart(2, '0')}:${String(offMinutes).padStart(2, '0')}:00`;

      const dayNumbers = newSchedule.days.map(day => dayValueToNumberMap[day]).filter(day => day !== undefined);

      // Now including both onTime and offTime in the same payload
      const payload: BackendDeviceSchedule = {
        onTime: onTimeString,
        offTime: offTimeString,
        daysOfWeek: dayNumbers
      };

      console.log("Sending request to:", `/Scheduler/${selectedDevice}`);
      console.log("Payload:", JSON.stringify(payload));
      
      const response = await authorizedAxiosInstance.post<BackendDeviceSchedule>(
        `/Scheduler/${selectedDevice}`,
        payload
      );

      await fetchSchedules();

      toast.success("Đã thêm/cập nhật lịch thành công!");
      resetNewScheduleForm();
      setIsScheduleModalOpen(false);

      if (onScheduleUpdate) {
        onScheduleUpdate();
      }
    } catch (err) {
      console.error("Error adding schedule:", err);
      toast.error("Không thể thêm/cập nhật lịch: " + (err as Error).message);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      // Extract the device ID from the schedule ID
      const parts = scheduleId.split('-');
      const deviceId = parts[0]; // First part is always deviceId
      
      const scheduleToDelete = schedules.find(s => s.id === scheduleId);
      if (!scheduleToDelete) {
        toast.error("Không tìm thấy lịch để xóa.");
        return;
      }

      await authorizedAxiosInstance.delete(`/Scheduler/${deviceId}`);

      await fetchSchedules();

      toast.success("Đã xóa lịch thành công!");

      if (onScheduleUpdate) {
        onScheduleUpdate();
      }
    } catch (err) {
      console.error("Error deleting schedule:", err);
      toast.error("Không thể xóa lịch: " + (err as Error).message);
    }
  };

  const handleToggleScheduleActive = async (scheduleId: string, currentActive: boolean) => {
    setSchedules(schedules.map(s =>
      s.id === scheduleId ? { ...s, active: !currentActive } : s
    ));

    toast.success(`Đã ${!currentActive ? 'kích hoạt' : 'vô hiệu hóa'} lịch (chỉ trên giao diện)!`);
  };

  const resetNewScheduleForm = () => {
    setSelectedDevice("");
    setNewSchedule({
      deviceId: "",
      title: "",
      onTime: "08:00",
      offTime: "20:00",
      days: [],
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
            {/* <Button size="sm" className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Thêm lịch mới
            </Button> */}
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
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Thời gian bật</label>
                <Input
                  type="time"
                  value={newSchedule.onTime}
                  onChange={(e) => setNewSchedule({ ...newSchedule, onTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Thời gian tắt</label>
                <Input
                  type="time"
                  value={newSchedule.offTime}
                  onChange={(e) => setNewSchedule({ ...newSchedule, offTime: e.target.value })}
                />
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