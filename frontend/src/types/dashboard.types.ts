// src/types/dashboard.types.ts

// Định nghĩa kiểu dữ liệu cho thiết bị
export interface Device {
  id: number;
  name: string;
  type: string;
  location: string;
  status: 'on' | 'off';
  consumption: number;
  lastUpdated: string;
  icon?: string;
}

// Định nghĩa kiểu dữ liệu cho lịch sử thiết bị
export interface DeviceHistory {
  date: string;
  value: number;
  status: 'on' | 'off';
  duration: number;
}

// Định nghĩa kiểu dữ liệu cho thuộc tính thiết bị
export interface DeviceProperties {
  brand: string;
  model: string;
  serialNumber: string;
  installDate: string;
  powerRating: number;
}

// Định nghĩa kiểu dữ liệu đầy đủ cho chi tiết thiết bị
export interface DeviceDetails extends Device {
  history: DeviceHistory[];
  properties: DeviceProperties;
}

// Định nghĩa kiểu dữ liệu cho thống kê nhanh
export interface QuickStat {
  id: number;
  title: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon?: string;
}

// Định nghĩa kiểu dữ liệu cho cảnh báo
export interface Alert {
  id: number;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  read: boolean;
  date: string;
}

// Định nghĩa kiểu dữ liệu cho người dùng
export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  subscription?: {
    plan: string;
    validUntil: string;
  };
  preferences?: {
    theme: string;
    notifications: boolean;
    energyGoal: number;
  };
}

// Định nghĩa kiểu dữ liệu cho dữ liệu dashboard
export interface DashboardData {
  user: User;
  stats: QuickStat[];
  alerts: Alert[];
}

// Định nghĩa kiểu dữ liệu cho dữ liệu tiêu thụ năng lượng
export interface EnergyData {
  name: string;
  value: number;
  date: string;
}

// Định nghĩa kiểu dữ liệu cho phân phối năng lượng
export interface EnergyDistribution {
  name: string;
  value: number;
  color: string;
}

// Định nghĩa kiểu dữ liệu cho yêu cầu điều khiển thiết bị
export interface ControlDeviceRequest {
  status: 'on' | 'off';
}

// Định nghĩa kiểu dữ liệu cho phản hồi điều khiển thiết bị
export interface ControlDeviceResponse {
  id: number;
  name: string;
  status: 'on' | 'off';
  message: string;
}