import styles from "@/styles/doctor/ProfileCard.module.css";
import { useFetchDoctor } from "@/hooks/useFetchDoctor";
import { data, useLocation } from "react-router-dom";
import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-toastify";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vi } from 'date-fns/locale';

// Hàm chuyển đổi dữ liệu từ API sang định dạng mong muốn
const transformDoctorData = (apiDoctor: any) => {
  if (!apiDoctor || !apiDoctor.user || !apiDoctor.hospital) {
    // Trả về dữ liệu mặc định nếu không có data hoặc data không đầy đủ
    return {
      id: "unknown",
      name: "Chưa cập nhật",
      rating: "4.7",
      reviews: 0,
      specialty: "Chưa cập nhật",
      specializedTreatment: "Chưa cập nhật",
      symptoms: [],
      schedule: "Chưa cập nhật",
      overviews: "Chưa cập nhật",
      hospital: "Chưa cập nhật",
      room: "Chưa cập nhật",
      address: "Chưa cập nhật",
      isFeatured: false,
      avatar: `https://ui.shadcn.com/avatars/01.png`,
      experienceYears: 0,
      consultationFee: 0,
      availableOnline: false,
      contact: {
        email: "Chưa cập nhật",
        phoneNumber: "Chưa cập nhật"
      }
    };
  }
  
  try {
    return {
      id: apiDoctor?.id || "unknown",
      name: apiDoctor?.user?.name || "Chưa cập nhật",
      rating: "4.7",
      reviews: Math.floor(Math.random() * (500 - 200 + 1)) + 200,
      specialty: apiDoctor?.specialization || "Chưa cập nhật",
      specializedTreatment: apiDoctor?.bio || "Chưa cập nhật",
      symptoms: [],
      schedule: "Thứ 2 - Thứ 6, 8:00 - 17:00",
      overviews: apiDoctor?.bio || "Chưa cập nhật",
      hospital: apiDoctor?.hospital?.name || "Chưa cập nhật",
      room: `${String.fromCharCode(65 + Math.floor(Math.random() * 6))}-${Math.floor(Math.random() * 900) + 100}`,
      address: apiDoctor?.hospital?.location || "Chưa cập nhật",
      isFeatured: apiDoctor?.availableOnline || false,
      avatar: `https://ui.shadcn.com/avatars/0${Math.floor(Math.random() * 5) + 1}.png`,
      experienceYears: apiDoctor?.experienceYears || 0,
      consultationFee: apiDoctor?.consultationFee || 0,
      availableOnline: apiDoctor?.availableOnline || false,
      contact: {
        email: apiDoctor?.user?.email || "Chưa cập nhật",
        phoneNumber: apiDoctor?.user?.phoneNumber || "Chưa cập nhật"
      }
    };
  } catch (error) {
    console.error("Error transforming doctor data:", error);
    return null;
  }
};

const ProfileCard = () => {
  const location = useLocation();
  const doctorId = location.pathname.split("/")[2];
  const { data: apiDoctor, isLoading } = useFetchDoctor(doctorId);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startTime, setStartTime] = useState<string>();
  const [endTime, setEndTime] = useState<string>();
  
  // Transform API data to match fake data structure
  const doctor = useMemo(() => {
    // Nếu có apiDoctor và là data từ API (có user và hospital)
    if (apiDoctor && apiDoctor.user && apiDoctor.hospital) {
      return transformDoctorData(apiDoctor);
    }
    // Nếu là fake data hoặc có lỗi, sử dụng trực tiếp
    return apiDoctor;
  }, [apiDoctor]);

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00",
    "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
  ];

  const handleBooking = () => {
    if (!selectedDate || !startTime || !endTime) {
      toast.error("Vui lòng chọn đầy đủ thông tin ngày và giờ khám");
      return;
    }
    if (startTime >= endTime) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }
    // Xử lý đặt lịch ở đây
    toast.success("Đặt lịch thành công!");
  };

  // Hàm lọc các giờ kết thúc hợp lệ (cách giờ bắt đầu tối đa 1 tiếng)
  const getValidEndTimes = (startTime: string) => {
    const startIndex = timeSlots.indexOf(startTime);
    // Lấy tối đa 2 slot tiếp theo (mỗi slot 30 phút)
    return timeSlots.slice(startIndex + 1, startIndex + 3);
  };

  // Reset giờ kết thúc khi đổi giờ bắt đầu
  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    setEndTime(undefined); // Reset giờ kết thúc
  };

  if (isLoading) return <div>Loading...</div>;
  if (!doctor) return <div>Không tìm thấy thông tin bác sĩ.</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Thông tin bác sĩ - chiếm 5 cột */}
        <div className="lg:col-span-5 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Thông tin bác sĩ:</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{doctor.name}</h3>
              <p className="text-gray-600">
                <strong>Chuyên khoa:</strong> {doctor.specialty}
              </p>
              <p className="text-gray-600">
                <strong>Kinh nghiệm:</strong> {doctor.experienceYears || "15"} năm
              </p>
              <p className="text-gray-600">
                <strong>Phí tư vấn:</strong> {(doctor.consultationFee || 500000).toLocaleString('vi-VN')} VNĐ
              </p>
              <p className="text-gray-600">
                <strong>Tư vấn online:</strong> {doctor.availableOnline ? "Có" : "Không"}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Giới thiệu</h2>
              <p className="text-gray-600">{doctor.overviews}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Phòng khám</h2>
              <p className="text-gray-600">
                <strong>Bệnh viện:</strong> {doctor.hospital}
              </p>
              <p className="text-gray-600">
                <strong>Địa chỉ:</strong> {doctor.address}
              </p>
              <p className="text-gray-600">
                <strong>Phòng:</strong> {doctor.room}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Thông tin liên hệ</h2>
              <p className="text-gray-600">
                <strong>Email:</strong> {doctor.contact?.email || "doctor@hospital.com"}
              </p>
              <p className="text-gray-600">
                <strong>Số điện thoại:</strong> {doctor.contact?.phoneNumber || "0123456789"}
              </p>
            </div>
          </div>
        </div>

        {/* Form đặt lịch - chiếm 7 cột */}
        <div className="lg:col-span-7 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6">Đặt lịch khám</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calendar */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-2">Ngày khám:</label>
              <div className="p-4 border rounded-lg w-fit">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={vi}
                  className="w-full"
                  classNames={{
                    months: "flex flex-col space-y-4",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex w-full",
                    head_cell: "text-slate-500 w-9 font-normal text-[0.8rem] text-center",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm relative p-0 hover:bg-slate-100 rounded-md",
                    day: "h-9 w-9 p-0 font-normal hover:bg-slate-100 rounded-md",
                    day_selected: "bg-blue-500 text-white hover:bg-blue-600",
                    day_today: "bg-slate-100 text-slate-900",
                    day_outside: "text-slate-400 opacity-50",
                    day_disabled: "text-slate-400 opacity-50 cursor-not-allowed",
                    day_hidden: "invisible",
                  }}
                  disabled={(date) =>
                    date < new Date() ||
                    date.getDay() === 0
                  }
                />
              </div>
            </div>

            {/* Thông tin giờ khám và triệu chứng */}
            <div className="md:col-span-1 space-y-6">
              <div className="space-y-4">
                {/* Giờ bắt đầu */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Giờ bắt đầu:
                  </label>
                  <Select
                    value={startTime}
                    onValueChange={handleStartTimeChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn giờ bắt đầu" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time, index) => (
                        <SelectItem
                          key={time}
                          value={time}
                          disabled={index >= timeSlots.length - 2}
                        >
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Giờ kết thúc */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Giờ kết thúc:
                  </label>
                  <Select
                    value={endTime}
                    onValueChange={setEndTime}
                    disabled={!startTime}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={startTime ? "Chọn giờ kết thúc" : "Vui lòng chọn giờ bắt đầu"} />
                    </SelectTrigger>
                    <SelectContent>
                      {startTime && getValidEndTimes(startTime).map((time) => (
                        <SelectItem
                          key={time}
                          value={time}
                        >
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mô tả triệu chứng */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mô tả triệu chứng:
                </label>
                <Textarea
                  placeholder="Vui lòng mô tả chi tiết các triệu chứng của bạn..."
                  className="w-full h-32 resize-none"
                />
              </div>

              {/* Nút đặt lịch */}
              <Button
                onClick={handleBooking}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                disabled={!selectedDate || !startTime || !endTime}
              >
                Đặt lịch khám
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
