import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useDashboardData } from '@/hooks/useDashboardIOTData';
import { Loader2, Key, CreditCard, Clock, Shield, AlertTriangle } from 'lucide-react';

export default function SettingsView() {
  const { data: dashboardData, isLoading } = useDashboardData();
  const [saving, setSaving] = useState(false);
  type ThemeType = "light" | "dark" | "system";
  const [theme, setTheme] = useState<ThemeType>(() => {
    const storedTheme = dashboardData?.user.preferences?.theme;
    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      return storedTheme;
    }
    return "light"; 
  });
  const [notifications, setNotifications] = useState(
    dashboardData?.user.preferences?.notifications || true
  );
  const [energyGoal, setEnergyGoal] = useState(
    dashboardData?.user.preferences?.energyGoal?.toString() || "300"
  );
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [highUsageAlerts, setHighUsageAlerts] = useState(true);
  const [deviceStatusAlerts, setDeviceStatusAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [monthlyReports, setMonthlyReports] = useState(true);
  
  const handleSavePreferences = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };
  
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cài đặt</h1>
      
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="account">Tài khoản</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
          <TabsTrigger value="preferences">Tùy chọn</TabsTrigger>
          <TabsTrigger value="billing">Thanh toán</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>
                  Cập nhật thông tin cá nhân của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="w-20 h-20 relative">
                    <img 
                      src={dashboardData?.user.avatar || "/api/placeholder/80/80"}
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Họ và tên</Label>
                        <Input id="fullName" defaultValue={dashboardData?.user.name} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue={dashboardData?.user.email} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input id="phone" placeholder="Nhập số điện thoại" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language">Ngôn ngữ</Label>
                        <Select defaultValue="vi">
                          <SelectTrigger id="language">
                            <SelectValue placeholder="Chọn ngôn ngữ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vi">Tiếng Việt</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button>Lưu thay đổi</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Thay đổi mật khẩu</CardTitle>
                <CardDescription>
                  Cập nhật mật khẩu của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center">
                  <Key className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-500">Cập nhật lần cuối: 30 ngày trước</span>
                </div>
                <Button variant="outline">Đổi mật khẩu</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Xóa tài khoản</CardTitle>
                <CardDescription>
                  Xóa vĩnh viễn tài khoản và tất cả dữ liệu liên quan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Cảnh báo</AlertTitle>
                  <AlertDescription>
                    Tất cả dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục. Vui lòng cân nhắc kỹ trước khi thực hiện.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button variant="destructive">Xóa tài khoản</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <h3>Cài đặt thông báo</h3>
              <CardDescription>
                Quản lý các loại thông báo bạn muốn nhận
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h6 className="font-medium">Email</h6>
                    <p className="text-sm text-gray-500">Nhận thông báo qua email</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h6 className="font-medium">Thông báo đẩy</h6>
                    <p className="text-sm text-gray-500">Nhận thông báo trên trình duyệt và thiết bị di động</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h6 className="font-medium">Cảnh báo tiêu thụ cao</h6>
                      <p className="text-sm text-gray-500">Khi mức tiêu thụ vượt quá ngưỡng đã đặt</p>
                    </div>
                    <Switch checked={highUsageAlerts} onCheckedChange={setHighUsageAlerts} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h6 className="font-medium">Trạng thái thiết bị</h6>
                      <p className="text-sm text-gray-500">Khi thiết bị thay đổi trạng thái</p>
                    </div>
                    <Switch checked={deviceStatusAlerts} onCheckedChange={setDeviceStatusAlerts} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h6 className="font-medium">Báo cáo hàng tuần</h6>
                      <p className="text-sm text-gray-500">Tóm tắt tiêu thụ điện hàng tuần</p>
                    </div>
                    <Switch checked={weeklyReports} onCheckedChange={setWeeklyReports} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h6 className="font-medium">Báo cáo hàng tháng</h6>
                      <p className="text-sm text-gray-500">Báo cáo chi tiết hàng tháng về tiêu thụ điện</p>
                    </div>
                    <Switch checked={monthlyReports} onCheckedChange={setMonthlyReports} />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSavePreferences} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Tùy chọn người dùng</CardTitle>
              <CardDescription>
                Điều chỉnh giao diện và tùy chọn cá nhân
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Giao diện</Label>
                  <Select value={theme} onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}>
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="Chọn giao diện" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Sáng</SelectItem>
                      <SelectItem value="dark">Tối</SelectItem>
                      <SelectItem value="system">Theo hệ thống</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Hiệu ứng động</h4>
                    <p className="text-sm text-gray-500">Bật/tắt các hiệu ứng chuyển động</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Cài đặt năng lượng</h4>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="energyGoal">Mục tiêu tiêu thụ hàng tháng (kWh)</Label>
                    <Input
                      id="energyGoal"
                      type="number"
                      value={energyGoal}
                      onChange={(e) => setEnergyGoal(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Đặt mục tiêu tiêu thụ điện hàng tháng để nhận thông báo khi vượt quá ngưỡng
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="alertThreshold">Ngưỡng cảnh báo (%)</Label>
                    <Select defaultValue="80">
                      <SelectTrigger id="alertThreshold">
                        <SelectValue placeholder="Chọn ngưỡng cảnh báo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="70">70%</SelectItem>
                        <SelectItem value="80">80%</SelectItem>
                        <SelectItem value="90">90%</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Bạn sẽ nhận được cảnh báo khi đạt đến tỷ lệ phần trăm này của mục tiêu
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSavePreferences} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin gói dịch vụ</CardTitle>
              <CardDescription>
                Quản lý gói dịch vụ và thông tin thanh toán
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row items-start justify-between gap-4 p-4 bg-blue-50 rounded-md">
                <div>
                  <h3 className="font-bold text-blue-700">
                    {dashboardData?.user.subscription?.plan || "Free"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Hiệu lực đến: {dashboardData?.user.subscription?.validUntil}
                  </p>
                  <ul className="mt-3 space-y-1 text-sm">
                    <li className="flex items-center">
                      <span className="mr-2 text-green-500">✓</span>
                      Giám sát không giới hạn thiết bị
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2 text-green-500">✓</span>
                      Phân tích chi tiết tiêu thụ
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2 text-green-500">✓</span>
                      Báo cáo xuất dữ liệu
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2 text-green-500">✓</span>
                      Tích hợp thiết bị thông minh
                    </li>
                  </ul>
                </div>
                
                <Button>Nâng cấp gói dịch vụ</Button>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Phương thức thanh toán</h4>
                
                <div className="flex items-center justify-between p-4 border rounded-md mb-4">
                  <div className="flex items-center">
                    <CreditCard className="h-6 w-6 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium">Visa **** 4242</p>
                      <p className="text-sm text-gray-500">Hết hạn: 12/25</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Chỉnh sửa</Button>
                </div>
                
                <Button variant="outline" className="w-full">Thêm phương thức thanh toán</Button>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Lịch sử thanh toán</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border-b text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>01/03/2025</span>
                    </div>
                    <span className="font-medium">Premium Plan - 350,000 VNĐ</span>
                    <span className="text-green-600">Đã thanh toán</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border-b text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>01/02/2025</span>
                    </div>
                    <span className="font-medium">Premium Plan - 350,000 VNĐ</span>
                    <span className="text-green-600">Đã thanh toán</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border-b text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>01/01/2025</span>
                    </div>
                    <span className="font-medium">Premium Plan - 350,000 VNĐ</span>
                    <span className="text-green-600">Đã thanh toán</span>
                  </div>
                </div>
                
                <Button variant="link" className="mt-2 p-0">Xem tất cả</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Bảo mật tài khoản</CardTitle>
              <CardDescription>
                Quản lý các tùy chọn bảo mật cho tài khoản của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Xác thực hai yếu tố</h4>
                    <p className="text-sm text-gray-500">Bảo vệ tài khoản với xác thực hai yếu tố</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Thông báo đăng nhập</h4>
                    <p className="text-sm text-gray-500">Nhận thông báo khi có đăng nhập mới</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Phiên đăng nhập</h4>
                    <p className="text-sm text-gray-500">Quản lý các phiên đăng nhập</p>
                  </div>
                  <Button variant="outline" size="sm">Quản lý</Button>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Quyền riêng tư dữ liệu</h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Chia sẻ dữ liệu ẩn danh</h4>
                      <p className="text-sm text-gray-500">Cho phép chia sẻ dữ liệu ẩn danh để cải thiện dịch vụ</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Xuất dữ liệu</h4>
                      <p className="text-sm text-gray-500">Tải xuống bản sao dữ liệu cá nhân của bạn</p>
                    </div>
                    <Button variant="outline" size="sm">Xuất</Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-md flex items-start">
                <Shield className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-700">Lưu ý bảo mật</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    Không bao giờ chia sẻ mật khẩu hoặc thông tin đăng nhập với người khác. Power Hub không bao giờ yêu cầu bạn cung cấp mật khẩu qua email hoặc điện thoại.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSavePreferences} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}