import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Save,
  Bell,
  Lock,
  Globe,
  Mail,
  Clock,
  Building2,
  Phone,
  MapPin,
} from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Profile Section */}
      {/* <div className="flex items-center gap-6 p-6 bg-white rounded-lg shadow-sm border">
        <Avatar className="w-24 h-24">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Phòng khám Lavender</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Đang hoạt động
            </Badge>
            <span className="text-sm text-gray-500">ID: #12345</span>
          </div>
        </div>
      </div> */}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cài đặt hệ thống</h1>
          <p className="text-gray-500">
            Quản lý và tùy chỉnh cài đặt phòng khám
          </p>
        </div>
        <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90">
          <Save className="h-4 w-4" />
          Lưu thay đổi
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Thông tin cơ bản */}
        <Card className="border-2">
          <CardHeader className="rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-6 w-6 text-primary" />
              Thông tin cơ bản
            </CardTitle>
            <CardDescription>
              Cập nhật thông tin cơ bản của phòng khám
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clinic-name" className="text-base">
                  Tên phòng khám
                </Label>
                <Input
                  id="clinic-name"
                  placeholder="Nhập tên phòng khám"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic-address" className="text-base">
                  Địa chỉ
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="clinic-address"
                    placeholder="Nhập địa chỉ"
                    className="h-12 pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clinic-phone" className="text-base">
                  Số điện thoại
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="clinic-phone"
                    placeholder="Nhập số điện thoại"
                    className="h-12 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic-email" className="text-base">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="clinic-email"
                    placeholder="Nhập email"
                    className="h-12 pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cài đặt thông báo */}
        <Card className="border-2">
          <CardHeader className="rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Bell className="h-6 w-6 text-primary" />
              Cài đặt thông báo
            </CardTitle>
            <CardDescription>Quản lý các thông báo hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Thông báo lịch hẹn mới</Label>
                  <p className="text-sm text-gray-500">
                    Gửi thông báo khi có lịch hẹn mới
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Thông báo hủy lịch</Label>
                  <p className="text-sm text-gray-500">
                    Gửi thông báo khi bệnh nhân hủy lịch
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Thông báo nhắc nhở</Label>
                  <p className="text-sm text-gray-500">
                    Gửi thông báo nhắc nhở trước lịch hẹn
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cài đặt bảo mật */}
        <Card className="border-2">
          <CardHeader className="rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Lock className="h-6 w-6 text-primary" />
              Cài đặt bảo mật
            </CardTitle>
            <CardDescription>
              Quản lý các cài đặt bảo mật hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Xác thực hai yếu tố</Label>
                  <p className="text-sm text-gray-500">
                    Bảo vệ tài khoản bằng xác thực hai yếu tố
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base">Đăng nhập bằng Google</Label>
                  <p className="text-sm text-gray-500">
                    Cho phép đăng nhập bằng tài khoản Google
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cài đặt lịch làm việc */}
        <Card className="border-2">
          <CardHeader className="rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="h-6 w-6 text-primary" />
              Cài đặt lịch làm việc
            </CardTitle>
            <CardDescription>
              Quản lý thời gian làm việc của phòng khám
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-base">Giờ mở cửa</Label>
                <Input type="time" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-base">Giờ đóng cửa</Label>
                <Input type="time" className="h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-base">
                Thời gian khám mỗi bệnh nhân (phút)
              </Label>
              <Input type="number" min="1" max="60" className="h-12" />
            </div>
            <Separator className="my-6" />
            <div className="space-y-4">
              <Label className="text-base">Ngày làm việc</Label>
              <div className="grid grid-cols-7 gap-2">
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                  <div
                    key={day}
                    className="flex items-center justify-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cài đặt ngôn ngữ */}
        <Card className="border-2">
          <CardHeader className="rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Globe className="h-6 w-6 text-primary" />
              Cài đặt ngôn ngữ
            </CardTitle>
            <CardDescription>
              Quản lý ngôn ngữ hiển thị của hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-base">Ngôn ngữ mặc định</Label>
              <select className="w-full p-3 border rounded-lg h-12 bg-white">
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
