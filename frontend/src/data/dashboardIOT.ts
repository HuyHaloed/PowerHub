// import { 
//   DashboardData, Device, EnergyData, 
//   EnergyDistribution, QuickStat, Alert 
// } from "@/types/dashboard.types";
// import { 
//   Zap, ThermometerSun, Droplet, Lightbulb, 
//   Power, MonitorSmartphone, Coffee, WashingMachine
// } from "lucide-react";
// import React from "react";

// // Dữ liệu thiết bị mẫu
// export const devices: Device[] = [
//   { 
//     id: "1", 
//     userId: "user123",
//     name: "Điều hòa phòng khách", 
//     status: "on", 
//     consumption: 1.2, 
//     location: "Phòng khách", 
//     type: "Điều hòa",
//     properties: {
//       brand: "Samsung",
//       model: "AR12TSHQ",
//       powerRating: 1200,
//       serialNumber: "AC-001"
//     }
//   },
//   { 
//     id: "2", 
//     userId: "user123",
//     name: "Tủ lạnh", 
//     status: "on", 
//     consumption: 0.8, 
//     location: "Nhà bếp", 
//     type: "Tủ lạnh",
//     properties: {
//       brand: "LG",
//       model: "GR-D257WB",
//       powerRating: 200,
//       serialNumber: "RF-001"
//     }
//   },
//   // ... (giữ nguyên các thiết bị khác)
// ];

// // Dữ liệu icon cho thiết bị
// export const deviceIcons: Record<string, React.ComponentType> = {
//   "Điều hòa": ThermometerSun,
//   "Tủ lạnh": Droplet,
//   "TV": MonitorSmartphone,
//   "Đèn": Lightbulb,
//   "Máy giặt": WashingMachine,
//   "Máy nước nóng": Droplet,
//   "Bếp": Power,
//   "Máy tính": Power,
//   "Thiết bị nhà bếp": Coffee,
//   "default": Zap
// };

// // Dữ liệu tiêu thụ điện hàng ngày
// export const dailyEnergyData: EnergyData[] = [
//   { name: "00:00", value: 18 },
//   { name: "02:00", value: 12 },
//   { name: "04:00", value: 10 },
//   { name: "06:00", value: 25 },
//   { name: "08:00", value: 40 },
//   { name: "10:00", value: 35 },
//   { name: "12:00", value: 50 },
//   { name: "14:00", value: 48 },
//   { name: "16:00", value: 52 },
//   { name: "18:00", value: 60 },
//   { name: "20:00", value: 50 },
//   { name: "22:00", value: 30 }
// ];

// // Dữ liệu tiêu thụ điện hàng tuần
// export const weeklyEnergyData: EnergyData[] = [
//   { name: "CN", value: 280 },
//   { name: "T2", value: 250 },
//   { name: "T3", value: 230 },
//   { name: "T4", value: 270 },
//   { name: "T5", value: 280 },
//   { name: "T6", value: 300 },
//   { name: "T7", value: 320 }
// ];

// // Dữ liệu tiêu thụ điện hàng tháng
// export const monthlyEnergyData: EnergyData[] = [
//   { name: "Tháng 1", value: 400 },
//   { name: "Tháng 2", value: 380 },
//   { name: "Tháng 3", value: 420 },
//   { name: "Tháng 4", value: 450 },
//   { name: "Tháng 5", value: 460 },
//   { name: "Tháng 6", value: 480 },
//   { name: "Tháng 7", value: 500 },
//   { name: "Tháng 8", value: 490 },
//   { name: "Tháng 9", value: 470 },
//   { name: "Tháng 10", value: 450 },
//   { name: "Tháng 11", value: 430 },
//   { name: "Tháng 12", value: 410 }
// ];

// // Dữ liệu tiêu thụ điện hàng năm
// export const yearlyEnergyData: EnergyData[] = [
//   { name: "2020", value: 4800 },
//   { name: "2021", value: 5100 },
//   { name: "2022", value: 5300 },
//   { name: "2023", value: 5200 },
//   { name: "2024", value: 5000 },
//   { name: "2025", value: 5400 }
// ];

// // Dữ liệu phân phối năng lượng
// export const energyDistributionData: EnergyDistribution[] = [
//   { name: "Máy lạnh", value: 35, color: "#0088FE" },
//   { name: "Tủ lạnh", value: 20, color: "#00C49F" },
//   { name: "Đèn", value: 15, color: "#FFBB28" },
//   { name: "TV", value: 10, color: "#FF8042" },
//   { name: "Máy giặt", value: 10, color: "#8884d8" },
//   { name: "Khác", value: 10, color: "#82ca9d" }
// ];

// // Dữ liệu thống kê nhanh
// export const quickStatsData: QuickStat[] = [
//   {
//     id: "today-consumption",
//     title: "Tiêu thụ hôm nay",
//     value: 10.2,
//     unit: "kWh",
//     change: 5,
//     changeType: "decrease",
//     icon: "energy"
//   },
//   {
//     id: "monthly-consumption",
//     title: "Tiêu thụ tháng này",
//     value: 246,
//     unit: "kWh",
//     change: 12,
//     changeType: "increase",
//     icon: "calendar"
//   },
//   {
//     id: "active-devices",
//     title: "Thiết bị đang hoạt động",
//     value: 4,
//     change: 2,
//     changeType: "increase",
//     icon: "device"
//   },
//   {
//     id: "estimated-bill",
//     title: "Dự tính tiền điện",
//     value: 850000,
//     unit: "VNĐ",
//     change: 8,
//     changeType: "increase",
//     icon: "money"
//   }
// ];

// // Dữ liệu cảnh báo
// export const alertsData: Alert[] = [
//   {
//     id: "1",
//     userId: "user123",
//     title: "Tiêu thụ điện cao bất thường",
//     message: "Điều hòa phòng khách đã hoạt động liên tục 8 giờ với mức tiêu thụ cao.",
//     severity: "warning",
//     timestamp: new Date(Date.now() - 30 * 60 * 1000),
//     read: false
//   },
//   {
//     id: "2",
//     userId: "user123",
//     title: "Thiết bị mới được phát hiện",
//     message: "Smart TV đã được kết nối với hệ thống Power Hub.",
//     severity: "info",
//     timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
//     read: true
//   },
//   {
//     id: "3",
//     userId: "user123",
//     title: "Đạt đến ngưỡng tiêu thụ",
//     message: "Bạn đã đạt 80% ngưỡng tiêu thụ điện đã đặt cho tháng này.",
//     severity: "warning",
//     timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
//     read: false
//   },
//   {
//     id: "4",
//     userId: "user123",
//     title: "Cập nhật phần mềm",
//     message: "Power Hub vừa được cập nhật lên phiên bản mới nhất.",
//     severity: "info",
//     timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//     read: true
//   }
// ];

// // Kết hợp tất cả dữ liệu cho Dashboard
// export const dashboardData: DashboardData = {
//   user: {
//     id: "user123",
//     name: "Nguyễn Văn A",
//     email: "nguyenvana@example.com",
//     avatar: "/api/placeholder/200/200",
//     subscription: {
//       plan: "Premium",
//       validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
//     },
//     preferences: {
//       theme: "light",
//       notifications: true,
//       energyGoal: 300
//     }
//   },
//   quickStats: quickStatsData,
//   devices: devices.map(device => ({
//     ...device,
//     icon: device.type && deviceIcons[device.type] 
//       ? React.createElement(deviceIcons[device.type]) 
//       : React.createElement(deviceIcons["default"])
//   })),
//   dailyEnergyData,
//   weeklyEnergyData,
//   monthlyEnergyData,
//   yearlyEnergyData,
//   energyDistribution: energyDistributionData,
//   alerts: alertsData
// };