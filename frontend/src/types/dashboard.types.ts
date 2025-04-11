import { ReactNode } from "react";

// Kiểu dữ liệu cho thiết bị
export interface Device {
  id: number;
  name: string;
  status: "on" | "off";
  consumption: number;
  icon?: ReactNode;
  location?: string;
  type?: string;
  lastUpdated?: Date;
}

// Kiểu dữ liệu cho biểu đồ tiêu thụ điện
export interface EnergyData {
  name: string;
  value: number;
}

// Kiểu dữ liệu cho phân phối năng lượng
export interface EnergyDistribution {
  name: string;
  value: number;
  color: string;
}

// Kiểu dữ liệu cho thống kê nhanh
export interface QuickStat {
  id: string;
  title: string;
  value: number | string;
  unit?: string;
  icon?: ReactNode;
  change?: number;
  changeType?: "increase" | "decrease";
}

// Kiểu dữ liệu cho người dùng
export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subscription?: {
    plan: string;
    validUntil: Date;
  };
  preferences?: {
    theme: "light" | "dark" | "system";
    notifications: boolean;
    energyGoal?: number;
  };
}

// Kiểu dữ liệu cho cảnh báo
export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "error";
  timestamp: Date;
  read: boolean;
}

// Kiểu dữ liệu cho toàn bộ dữ liệu dashboard
export interface DashboardData {
  user: DashboardUser;
  quickStats: QuickStat[];
  devices: Device[];
  dailyEnergyData: EnergyData[];
  weeklyEnergyData: EnergyData[];
  monthlyEnergyData: EnergyData[];
  yearlyEnergyData: EnergyData[];
  energyDistribution: EnergyDistribution[];
  alerts: Alert[];
}