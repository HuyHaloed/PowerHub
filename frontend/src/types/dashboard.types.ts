// Types derived from backend MongoDB models

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  twoFactorEnabled: boolean;
  subscription: {
    plan: string;
    validUntil: string;
    paymentHistory: {
      id: string;
      date: string;
      amount: number;
      description: string;
      status: string;
    }[];
    paymentMethod: {
      type: string;
      lastFour: string;
      expiryDate: string;
      cardholderName: string;
    };
  };
  preferences: {
    theme: string;
    notifications: boolean;
    energyGoal: number;
    language: string;
    currency: string;
  };
}

// Device Types
export interface Device {
  id: string;
  userId: string;
  name: string;
  type: string;
  location: string;
  status: 'on' | 'off';
  consumption: number;
  lastUpdated: string;
  properties: {
    brand: string;
    model: string;
    serialNumber: string;
    installDate: string;
    powerRating: number;
  };
  history: {
    timestamp: string;
    status: string;
    consumption: number;
  }[];
}

// Energy Consumption Types
export interface EnergyConsumption {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  value: number;
  date: string;
  timeRange: 'day' | 'week' | 'month' | 'year';
}

export interface QuickStat {
  id: string;
  title: string;
  value: number;
  unit?: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon?: string;
}
// Alert Types
export interface Alert {
  id: string;
  userId: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  read: boolean;
  date: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'update';
  read: boolean;
  date: string;
  action: {
    type: 'url' | 'action';
    url?: string;
  };
}

// Quick Stats Types
export interface Stat {
  id: string;
  title: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon?: string;
}

// Energy Distribution Types
export interface EnergyDistribution {
  id: string;
  userId: string;
  deviceId: string;
  name: string;
  value: number;
  color: string;
  date: string;
}

// Request Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AddDeviceRequest {
  name: string;
  type: string;
  location: string;
  properties: {
    brand: string;
    model: string;
    serialNumber: string;
    powerRating: number;
  };
}

export interface UpdateDeviceRequest {
  name: string;
  type: string;
  location: string;
  properties: {
    brand: string;
    model: string;
    serialNumber: string;
    powerRating: number;
  };
}

export interface ControlDeviceRequest {
  status: 'on' | 'off';
}

export interface Verify2FARequest {
  code: string;
}

export interface Disable2FARequest {
  password: string;
}

export interface UpgradeSubscriptionRequest {
  plan: string;
}

export interface AddPaymentMethodRequest {
  type: string;
  cardNumber: string;
  expiryDate: string;
  cardholderName: string;
  cvv: string;
}

// Response Types
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    subscription: {
      plan: string;
      validUntil: string;
    };
    preferences: {
      theme: string;
      notifications: boolean;
      energyGoal: number;
    };
  };
}

// Dashboard Data Aggregate Type
export interface DashboardData {
  user: User;
  devices: Device[];
  alerts: Alert[];
  energyConsumption: EnergyConsumption[];
  energyDistribution: EnergyDistribution[];
  quickStats: Stat[];
  notifications: Notification[];
}