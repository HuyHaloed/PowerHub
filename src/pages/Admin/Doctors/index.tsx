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
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

// Dữ liệu tutors
// Dữ liệu tutors
export const initialTutors = [
  {
    id: "1",
    name: "BS. Ngô Thị Dương",
    rating: "4.6",
    reviews: 413,
    specialty: "Da liễu",
    specializedTreatment: "Vết thâm, đồi mồi, sẹo, mụn, nám,...",
    symptoms: [
      "Nổi mụn",
      "Da khô",
      "Ngứa da",
      "Nám da",
      "Tàn nhang",
      "Mề đay",
      "Phát ban",
      "Vết thâm",
      "Rụng tóc",
      "Da nhờn",
    ],
    schedule: "Tất cả ngày Online",
    overviews:
      "Bác sĩ Ngô Thị Dương là một bác sĩ chuyên khoa Da liễu hàng đầu tại Việt Nam. Với hơn 15 năm kinh nghiệm trong lĩnh vực da liễu, bác sĩ đã điều trị thành công cho hàng nghìn bệnh nhân với các vấn đề về da như mụn, nám, sẹo, đồi mồi và các bệnh da liễu khác. Bác sĩ Dương luôn tận tâm, chu đáo và đặt sức khỏe, vẻ đẹp của bệnh nhân lên hàng đầu.",
    hospital: "Bệnh viện Y học Cổ truyền",
    room: "16-117",
    address: "182 đường 3 tháng 2, Quận 10, TP. Hồ Chí Minh",
    isFeatured: false,
    avatar: "https://ui.shadcn.com/avatars/01.png",
  },
  {
    id: "2",
    name: "TS. Trần Văn Hùng",
    rating: "4.8",
    reviews: 520,
    specialty: "Tim mạch",
    specializedTreatment: "Tăng huyết áp, suy tim, rối loạn nhịp tim,...",
    symptoms: [
      "Đau ngực",
      "Khó thở",
      "Hồi hộp",
      "Chóng mặt",
      "Mệt mỏi",
      "Đau đầu",
      "Tức ngực",
      "Tim đập nhanh",
      "Phù chân",
      "Cao huyết áp",
    ],
    schedule: "Thứ 2 - Thứ 6, 8:00 - 17:00",
    overviews:
      "Tiến sĩ Trần Văn Hùng là chuyên gia hàng đầu về Tim mạch với 20 năm kinh nghiệm. Ông đã thực hiện nhiều ca phẫu thuật tim phức tạp và luôn tận tâm với bệnh nhân, giúp họ cải thiện sức khỏe tim mạch và nâng cao chất lượng cuộc sống.",
    hospital: "Bệnh viện Chợ Rẫy",
    room: "A-305",
    address: "201B Nguyễn Chí Thanh, Quận 5, TP. Hồ Chí Minh",
    isFeatured: true,
    avatar: "https://ui.shadcn.com/avatars/02.png",
  },
  {
    id: "3",
    name: "BS. Phạm Thị Hồng Nhung",
    rating: "4.7",
    reviews: 380,
    specialty: "Tiêu hóa",
    specializedTreatment: "Viêm loét dạ dày, trào ngược, rối loạn tiêu hóa,...",
    symptoms: [
      "Đau bụng",
      "Ợ chua",
      "Buồn nôn",
      "Tiêu chảy",
      "Táo bón",
      "Đầy hơi",
      "Chán ăn",
      "Nóng rát dạ dày",
      "Đau thượng vị",
      "Khó tiêu",
    ],
    schedule: "Thứ 3 - Thứ 7, 7:30 - 16:30",
    overviews:
      "Bác sĩ Phạm Thị Hồng Nhung có 14 năm kinh nghiệm trong lĩnh vực Tiêu hóa. Chị chuyên điều trị các bệnh lý về dạ dày, ruột và gan mật, luôn tận tình tư vấn chế độ ăn uống phù hợp cho bệnh nhân.",
    hospital: "Bệnh viện Bạch Mai cơ sở 2",
    room: "B-308",
    address: "78 Giải Phóng, Quận 7, TP. Hồ Chí Minh",
    isFeatured: true,
    avatar: "https://ui.shadcn.com/avatars/03.png",
  },
  {
    id: "4",
    name: "TS. Võ Minh Tuấn",
    rating: "4.9",
    reviews: 620,
    specialty: "Hô hấp",
    specializedTreatment: "Hen suyễn, viêm phổi, COPD,...",
    symptoms: [
      "Khó thở",
      "Ho khan",
      "Ho có đờm",
      "Thở khò khè",
      "Tức ngực",
      "Sốt",
      "Mệt mỏi",
      "Đau ngực khi ho",
      "Thở nhanh",
      "Viêm họng",
    ],
    schedule: "Thứ 2 - Thứ 5, 8:00 - 17:00",
    overviews:
      "Tiến sĩ Võ Minh Tuấn là chuyên gia Hô hấp với hơn 18 năm kinh nghiệm. Ông nổi tiếng với việc điều trị thành công các ca bệnh phổi tắc nghẽn mãn tính và hen suyễn nặng.",
    hospital: "Bệnh viện Phạm Ngọc Thạch",
    room: "C-105",
    address: "120 Hồng Bàng, Quận 5, TP. Hồ Chí Minh",
    isFeatured: true,
    avatar: "https://ui.shadcn.com/avatars/04.png",
  },
  {
    id: "5",
    name: "BS. Đỗ Thị Lan Anh",
    rating: "4.5",
    reviews: 290,
    specialty: "Răng Hàm Mặt",
    specializedTreatment: "Nhổ răng, niềng răng, trồng răng implant,...",
    symptoms: [
      "Đau răng",
      "Sâu răng",
      "Sưng nướu",
      "Chảy máu nướu",
      "Răng lệch",
      "Đau hàm",
      "Ê buốt răng",
      "Viêm nướu",
      "Hôi miệng",
      "Răng lung lay",
    ],
    schedule: "Thứ 2, Thứ 4, Thứ 6, 9:00 - 18:00",
    overviews:
      "Bác sĩ Đỗ Thị Lan Anh có 10 năm kinh nghiệm trong lĩnh vực Răng Hàm Mặt. Chị chuyên về thẩm mỹ nha khoa và điều trị các vấn đề răng miệng phức tạp, mang lại nụ cười tự tin cho bệnh nhân.",
    hospital: "Bệnh viện Răng Hàm Mặt TP.HCM",
    room: "D-202",
    address: "263 Trần Hưng Đạo, Quận 1, TP. Hồ Chí Minh",
    isFeatured: false,
    avatar: "https://ui.shadcn.com/avatars/05.png",
  },
  {
    id: "6",
    name: "PGS.TS Nguyễn Văn Phúc",
    rating: "4.8",
    reviews: 510,
    specialty: "Ung bướu",
    specializedTreatment: "Ung thư vú, ung thư phổi, hóa trị,...",
    symptoms: [
      "Khối u",
      "Mệt mỏi",
      "Sút cân",
      "Đau xương",
      "Ho kéo dài",
      "Khó thở",
      "Chảy máu bất thường",
      "Sưng hạch",
      "Đau tức vùng ngực",
      "Sốt không rõ nguyên nhân",
    ],
    schedule: "Thứ 3 - Thứ 6, 7:00 - 16:00",
    overviews:
      "Phó Giáo sư, Tiến sĩ Nguyễn Văn Phúc là chuyên gia Ung bướu với 25 năm kinh nghiệm. Ông đã tham gia điều trị và nghiên cứu nhiều ca ung thư phức tạp, mang lại hy vọng cho bệnh nhân.",
    hospital: "Bệnh viện Ung Bướu TP.HCM",
    room: "A-601",
    address: "47 Nguyễn Huy Lượng, Quận Bình Thạnh, TP. Hồ Chí Minh",
    isFeatured: true,
    avatar: "https://ui.shadcn.com/avatars/01.png",
  },
  {
    id: "7",
    name: "BS. Trần Quốc Bảo",
    rating: "4.6",
    reviews: 340,
    specialty: "Tâm thần kinh",
    specializedTreatment: "Trầm cảm, lo âu, mất ngủ, rối loạn tâm thần,...",
    symptoms: [
      "Mất ngủ",
      "Lo âu",
      "Buồn bã",
      "Mệt mỏi",
      "Khó tập trung",
      "Căng thẳng",
      "Hồi hộp",
      "Sợ hãi vô cớ",
      "Tức giận",
      "Rối loạn cảm xúc",
    ],
    schedule: "Thứ 2 - Thứ 7, 8:00 - 15:00",
    overviews:
      "Bác sĩ Trần Quốc Bảo có 12 năm kinh nghiệm trong lĩnh vực Tâm thần kinh. Anh chuyên điều trị các rối loạn tâm lý và hỗ trợ bệnh nhân vượt qua các vấn đề sức khỏe tâm thần.",
    hospital: "Bệnh viện Tâm thần TP.HCM",
    room: "B-403",
    address: "766 Võ Văn Kiệt, Quận 5, TP. Hồ Chí Minh",
    isFeatured: false,
    avatar: "https://ui.shadcn.com/avatars/02.png",
  },
  {
    id: "8",
    name: "TS. Lê Thị Kim Oanh",
    rating: "4.7",
    reviews: 430,
    specialty: "Huyết học",
    specializedTreatment: "Thiếu máu, rối loạn đông máu, bạch cầu,...",
    symptoms: [
      "Mệt mỏi",
      "Chóng mặt",
      "Da xanh xao",
      "Chảy máu kéo dài",
      "Sốt",
      "Đau xương",
      "Sưng hạch",
      "Dễ bầm tím",
      "Nhiễm trùng thường xuyên",
      "Khó thở",
    ],
    schedule: "Thứ 4 - Chủ nhật, 8:00 - 16:30",
    overviews:
      "Tiến sĩ Lê Thị Kim Oanh là chuyên gia Huyết học với 16 năm kinh nghiệm. Chị chuyên điều trị các bệnh lý về máu và đã thực hiện nhiều ca truyền máu, ghép tủy thành công.",
    hospital: "Bệnh viện Truyền máu Huyết học",
    room: "C-507",
    address: "118 Hồng Bàng, Quận 5, TP. Hồ Chí Minh",
    isFeatured: true,
    avatar: "https://ui.shadcn.com/avatars/03.png",
  },
];

export function DoctorsPage() {
  const [tutors, setTutors] = useState(initialTutors);
  const [filteredTutors, setFilteredTutors] = useState(initialTutors);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    specialty: "",
    hospital: "",
    schedule: "",
    overviews: "",
  });

  // Filter tutors based on search term, specialty, and status
  useEffect(() => {
    let filtered = [...tutors];

    if (searchTerm) {
      filtered = filtered.filter(tutor =>
        tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.hospital.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (specialtyFilter) {
      filtered = filtered.filter(tutor => tutor.specialty === specialtyFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(tutor => 
        (statusFilter === "Đang làm việc" && tutor.isFeatured) ||
        (statusFilter === "Không hoạt động" && !tutor.isFeatured)
      );
    }

    setFilteredTutors(filtered);
  }, [tutors, searchTerm, specialtyFilter, statusFilter]);

  // Handle search input
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle adding new doctor
  const handleAddDoctor = (e) => {
    e.preventDefault();
    const newId = (Math.max(...tutors.map(t => parseInt(t.id))) + 1).toString();
    const doctorToAdd = {
      ...newDoctor,
      id: newId,
      rating: "0.0",
      reviews: 0,
      isFeatured: true,
      avatar: "https://ui.shadcn.com/avatars/01.png",
      symptoms: [],
      specializedTreatment: "",
      room: "N/A",
      address: newDoctor.hospital
    };
    
    setTutors([...tutors, doctorToAdd]);
    setShowAddModal(false);
    setNewDoctor({ name: "", specialty: "", hospital: "", schedule: "", overviews: "" });
    toast.success("Đã thêm bác sĩ thành công!");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Bác sĩ</h1>
        <Button className="flex items-center gap-2" onClick={() => setShowAddModal(true)}>
          <UserCircle2 className="h-4 w-4" />
          Thêm bác sĩ
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Tìm kiếm bác sĩ..." 
            className="pl-10" 
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Lọc theo chuyên khoa</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSpecialtyFilter("")}>Tất cả</DropdownMenuItem>
            {[...new Set(initialTutors.map(tutor => tutor.specialty))].map(specialty => (
              <DropdownMenuItem key={specialty} onClick={() => setSpecialtyFilter(specialty)}>
                {specialty}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Lọc theo trạng thái</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("")}>Tất cả</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("Đang làm việc")}>
              Đang làm việc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("Không hoạt động")}>
              Không hoạt động
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Doctors Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bác sĩ</TableHead>
              <TableHead>Chuyên khoa</TableHead>
              <TableHead>Kinh nghiệm</TableHead>
              <TableHead>Số lượt đánh giá</TableHead>
              <TableHead>Đánh giá</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Trạng thái</TableHead>
              {/* <TableHead className="w-[100px]">Thao tác</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTutors.map((doctor) => {
              const experienceMatch = doctor.overviews.match(/(\d+)/);
              const experience = experienceMatch
                ? `${experienceMatch[0]} năm`
                : "Không xác định";
              const status = doctor.isFeatured ? "Đang làm việc" : "Không hoạt động";

              return (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.name}</TableCell>
                  <TableCell>{doctor.specialty}</TableCell>
                  <TableCell>{experience}</TableCell>
                  <TableCell>{doctor.reviews}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      {doctor.rating}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{doctor.hospital}</div>
                      <div className="text-sm text-gray-500">{doctor.address}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        status === "Đang làm việc"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {status}
                    </span>
                  </TableCell>
                  {/* <TableCell>
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
                  </TableCell> */}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px]">
            <h2 className="text-xl font-bold mb-4">Thêm bác sĩ mới</h2>
            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tên bác sĩ</label>
                <Input
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
                  placeholder="Nhập tên bác sĩ"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Chuyên khoa</label>
                <Input
                  value={newDoctor.specialty}
                  onChange={(e) => setNewDoctor({...newDoctor, specialty: e.target.value})}
                  placeholder="Nhập chuyên khoa"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bệnh viện</label>
                <Input
                  value={newDoctor.hospital}
                  onChange={(e) => setNewDoctor({...newDoctor, hospital: e.target.value})}
                  placeholder="Nhập tên bệnh viện"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Lịch làm việc</label>
                <Input
                  value={newDoctor.schedule}
                  onChange={(e) => setNewDoctor({...newDoctor, schedule: e.target.value})}
                  placeholder="Nhập lịch làm việc"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tổng quan</label>
                <textarea
                  value={newDoctor.overviews}
                  onChange={(e) => setNewDoctor({...newDoctor, overviews: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  rows="4"
                  placeholder="Nhập thông tin tổng quan"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Hủy
                </Button>
                <Button type="submit">Thêm bác sĩ</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Hiển thị 1-{filteredTutors.length} trên {filteredTutors.length} kết quả
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Trước
          </Button>
          <Button variant="outline" size="sm" disabled>
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}