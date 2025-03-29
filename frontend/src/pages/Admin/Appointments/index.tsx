import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Search,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "react-toastify";

// Mock data - replace with actual data from your API
const initialAppointments = [
  {
    id: 1,
    patientName: "Nguyễn Văn A",
    doctorName: "BS. Trần Thị B",
    date: "2024-03-20",
    time: "09:00",
    type: "Khám tổng quát",
    status: "Chờ xác nhận",
    phone: "0123456789",
    symptoms: "Đau đầu, sốt nhẹ",
    note: "Cần xét nghiệm máu"
  },
  {
    id: 2,
    patientName: "Lê Thị C",
    doctorName: "BS. Nguyễn Văn A",
    date: "2024-03-20",
    time: "10:30",
    type: "Tái khám",
    status: "Chờ xác nhận",
    phone: "0987654321",
    symptoms: "Đau lưng mãn tính",
    note: "Tái khám sau 2 tuần điều trị"
  },
  {
    id: 3,
    patientName: "Trần Văn D",
    doctorName: "BS. Lê Văn C",
    date: "2024-03-20",
    time: "14:00",
    type: "Khám chuyên khoa",
    status: "Đã hủy",
    phone: "0369852147",
    symptoms: "Dị ứng da",
    note: "Bệnh nhân có tiền sử dị ứng"
  },
  {
    id: 4,
    patientName: "Phạm Thị E",
    doctorName: "BS. Hoàng Văn D",
    date: "2024-03-21",
    time: "08:30",
    type: "Khám tim mạch",
    status: "Chờ xác nhận",
    phone: "0912345678",
    symptoms: "Đau ngực, khó thở",
    note: "Cần đo điện tâm đồ"
  },
  {
    id: 5,
    patientName: "Hoàng Văn F",
    doctorName: "BS. Mai Thị E",
    date: "2024-03-21",
    time: "11:00",
    type: "Khám nhi",
    status: "Chờ xác nhận",
    phone: "0898765432",
    symptoms: "Ho, sốt cao",
    note: "Trẻ 5 tuổi, cần khám gấp"
  },
  {
    id: 6,
    patientName: "Vũ Thị G",
    doctorName: "BS. Phan Văn F",
    date: "2024-03-22",
    time: "13:30",
    type: "Khám sản",
    status: "Chờ xác nhận",
    phone: "0977123456",
    symptoms: "Thai 32 tuần",
    note: "Khám thai định kỳ"
  },
  {
    id: 7,
    patientName: "Đặng Văn H",
    doctorName: "BS. Trần Thị B",
    date: "2024-03-22",
    time: "15:00",
    type: "Khám mắt",
    status: "Chờ xác nhận",
    phone: "0933789123",
    symptoms: "Mờ mắt, nhức mắt",
    note: "Cần đo thị lực"
  },
  {
    id: 8,
    patientName: "Bùi Thị I",
    doctorName: "BS. Nguyễn Văn A",
    date: "2024-03-23",
    time: "09:30",
    type: "Khám răng",
    status: "Chờ xác nhận",
    phone: "0944567890",
    symptoms: "Đau răng khôn",
    note: "Cần chụp X-quang"
  }
];

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Hàm xử lý xác nhận lịch hẹn
  const handleConfirm = (id: number) => {
    setAppointments(appointments.map(app => 
      app.id === id ? {...app, status: "Đã xác nhận"} : app
    ));
    toast.success("Đã xác nhận lịch hẹn thành công!");
  };

  // Hàm xử lý hủy lịch hẹn
  const handleCancel = (id: number) => {
    setAppointments(appointments.map(app => 
      app.id === id ? {...app, status: "Đã hủy"} : app
    ));
    toast.info("Đã hủy lịch hẹn!");
  };

  // Hàm xử lý xem chi tiết
  const handleViewDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowDetails(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Lịch hẹn</h1>
      </div>

      {/* Search and Filter Section */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input placeholder="Tìm kiếm lịch hẹn..." className="pl-10" />
        </div>
        <Button variant="outline">Lọc theo ngày</Button>
        <Button variant="outline">Lọc theo trạng thái</Button>
      </div>

      {/* Appointments Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bệnh nhân</TableHead>
              <TableHead>Bác sĩ</TableHead>
              <TableHead>Ngày hẹn</TableHead>
              <TableHead>Giờ hẹn</TableHead>
              <TableHead>Loại khám</TableHead>
              <TableHead>Số điện thoại</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">
                  {appointment.patientName}
                </TableCell>
                <TableCell>{appointment.doctorName}</TableCell>
                <TableCell>{appointment.date}</TableCell>
                <TableCell>{appointment.time}</TableCell>
                <TableCell>{appointment.type}</TableCell>
                <TableCell>{appointment.phone}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {appointment.status === "Đã xác nhận" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : appointment.status === "Đã hủy" ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    <span
                      className={`text-sm ${
                        appointment.status === "Đã xác nhận"
                          ? "text-green-600"
                          : appointment.status === "Đã hủy"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(appointment)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {appointment.status === "Chờ xác nhận" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600"
                          onClick={() => handleConfirm(appointment.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleCancel(appointment.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Chi tiết lịch hẹn */}
      {showDetails && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl w-[600px] shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Chi tiết lịch hẹn</h2>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-gray-100 rounded-full"
                onClick={() => setShowDetails(false)}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Bệnh nhân</label>
                  <p className="font-medium">{selectedAppointment.patientName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Bác sĩ</label>
                  <p className="font-medium">{selectedAppointment.doctorName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Thời gian khám</label>
                  <p className="font-medium">
                    {selectedAppointment.date} {selectedAppointment.time}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Loại khám</label>
                  <p className="font-medium">{selectedAppointment.type}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Số điện thoại</label>
                  <p className="font-medium">{selectedAppointment.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Trạng thái</label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedAppointment.status === "Đã xác nhận" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : selectedAppointment.status === "Đã hủy" ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    <span
                      className={`font-medium ${
                        selectedAppointment.status === "Đã xác nhận"
                          ? "text-green-600"
                          : selectedAppointment.status === "Đã hủy"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {selectedAppointment.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-gray-500">Triệu chứng</label>
                <p className="font-medium mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedAppointment.symptoms}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Ghi chú</label>
                <p className="font-medium mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedAppointment.note}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              {selectedAppointment.status === "Chờ xác nhận" && (
                <>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      handleCancel(selectedAppointment.id);
                      setShowDetails(false);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Hủy lịch hẹn
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleConfirm(selectedAppointment.id);
                      setShowDetails(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Xác nhận lịch hẹn
                  </Button>
                </>
              )}
              {selectedAppointment.status !== "Chờ xác nhận" && (
                <Button onClick={() => setShowDetails(false)}>Đóng</Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Hiển thị 1-8 trên 8 kết quả
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Trước
          </Button>
          <Button variant="outline" size="sm">
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
