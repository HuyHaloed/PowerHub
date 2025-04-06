export interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'moderator' | 'viewer';
    lastLogin?: Date;
    status: 'active' | 'suspended' | 'pending';
  }
  
  export interface IOTDevice {
    id: number;
    name: string;
    type: string;
    status: 'online' | 'offline' | 'error';
    lastConnection?: Date;
    energyConsumption: number;
    location?: string;
  }
  
  export interface CustomerFeedback {
    id: number;
    customerId: number;
    customerName: string;
    message: string;
    rating: number;
    createdAt: Date;
    status: 'unread' | 'in-progress' | 'resolved';
  }
  
  export interface BlogPost {
    id: number;
    title: string;
    author: string;
    createdAt: Date;
    status: 'draft' | 'pending' | 'published' | 'rejected';
    content: string;
    tags?: string[];
  }
  
  export interface SystemConfig {
    maintenanceMode: boolean;
    userRegistration: boolean;
    maxDevicesPerUser: number;
    defaultUserRole: 'viewer' | 'editor';
    systemNotification?: string;
  }
  
  export interface IOTStatistics {
    totalDevices: number;
    activeDevices: number;
    totalEnergyConsumption: number;
    averageDeviceUptime: number;
    deviceTypeDistribution: Record<string, number>;
  }