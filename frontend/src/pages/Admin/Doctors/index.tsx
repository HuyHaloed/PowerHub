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
  UserCircle2,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data - replace with actual data from your API
const doctors = [
  {
    id: 1,
    name: "BS. Nguyễn Văn A",
    specialization: "Nhi khoa",
    experience: "10 năm",
    patients: 1200,
    rating: 4.8,
    status: "Đang làm việc",
    phone: "0123456789",
    email: "bs.nguyenvana@example.com",
  },
  {
    id: 2,
    name: "BS. Trần Thị B",
    specialization: "Tim mạch",
    experience: "15 năm",
    patients: 2500,
    rating: 4.9,
    status: "Đang làm việc",
    phone: "0987654321",
    email: "bs.tranthib@example.com",
  },
  {
    id: 3,
    name: "BS. Lê Văn C",
    specialization: "Nội khoa",
    experience: "8 năm",
    patients: 800,
    rating: 4.7,
    status: "Nghỉ phép",
    phone: "0369852147",
    email: "bs.levanc@example.com",
  },
];

export function DoctorsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Bác sĩ</h1>
        <Button className="flex items-center gap-2">
          <UserCircle2 className="h-4 w-4" />
          Thêm bác sĩ
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input placeholder="Tìm kiếm bác sĩ..." className="pl-10" />
        </div>
        <Button variant="outline">Lọc theo chuyên khoa</Button>
        <Button variant="outline">Lọc theo trạng thái</Button>
      </div>

      {/* Doctors Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bác sĩ</TableHead>
              <TableHead>Chuyên khoa</TableHead>
              <TableHead>Kinh nghiệm</TableHead>
              <TableHead>Số bệnh nhân</TableHead>
              <TableHead>Đánh giá</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-[100px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell className="font-medium">{doctor.name}</TableCell>
                <TableCell>{doctor.specialization}</TableCell>
                <TableCell>{doctor.experience}</TableCell>
                <TableCell>{doctor.patients}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    {doctor.rating}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">{doctor.phone}</div>
                    <div className="text-sm text-gray-500">{doctor.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      doctor.status === "Đang làm việc"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {doctor.status}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem>Xem lịch làm việc</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
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
