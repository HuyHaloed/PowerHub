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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data - replace with actual data from your API
const appointments = [
  {
    id: 1,
    patientName: "Nguyễn Văn A",
    doctorName: "BS. Trần Thị B",
    date: "2024-03-20",
    time: "09:00",
    type: "Khám tổng quát",
    status: "Đã xác nhận",
    phone: "0123456789",
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
  },
];

export function AppointmentsPage() {
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
              <TableHead className="w-[100px]">Thao tác</TableHead>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
                      <DropdownMenuItem>Xác nhận</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Hủy lịch
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Hiển thị 1-3 trên 10 kết quả
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
