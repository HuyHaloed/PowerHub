import { 
    AdminUser, 
    IOTDevice, 
    CustomerFeedback, 
    BlogPost, 
    SystemConfig, 
    IOTStatistics 
  } from '@/types/adminDashboard.types';
  
  export const mockAdminUsers: AdminUser[] = [
    {
      id: 1,
      name: 'Admin Root',
      email: 'admin@powerhub.com',
      role: 'admin',
      lastLogin: new Date(),
      status: 'active'
    },
    {
      id: 2,
      name: 'John Moderator',
      email: 'john@powerhub.com',
      role: 'moderator',
      lastLogin: new Date('2024-04-05'),
      status: 'active'
    }
  ];
  
  export const mockIOTDevices: IOTDevice[] = [
    {
      id: 1,
      name: 'Smart Meter - Living Room',
      type: 'Electricity Meter',
      status: 'online',
      lastConnection: new Date(),
      energyConsumption: 45.6,
      location: 'Living Room'
    },
    {
      id: 2,
      name: 'Solar Panel Array',
      type: 'Energy Generator',
      status: 'online',
      lastConnection: new Date('2024-04-05'),
      energyConsumption: -120.3,
      location: 'Roof'
    }
  ];
  
  export const mockCustomerFeedbacks: CustomerFeedback[] = [
    {
      id: 1,
      customerId: 101,
      customerName: 'Alice Johnson',
      message: 'Great service, but could use more detailed energy reports',
      rating: 4,
      createdAt: new Date(),
      status: 'unread'
    },
    {
      id: 2,
      customerId: 102,
      customerName: 'Bob Smith',
      message: 'App is a bit slow when loading device details',
      rating: 3,
      createdAt: new Date('2024-04-04'),
      status: 'in-progress'
    }
  ];
  
  export const mockBlogPosts: BlogPost[] = [
    {
      id: 1,
      title: 'Energy Saving Tips for Smart Homes',
      author: 'Power Hub Team',
      createdAt: new Date(),
      status: 'pending',
      content: 'Lorem ipsum dolor sit amet...',
      tags: ['energy', 'tips', 'smart home']
    },
    {
      id: 2,
      title: 'The Future of Renewable Energy',
      author: 'Jane Doe',
      createdAt: new Date('2024-04-03'),
      status: 'draft',
      content: 'Consectetur adipiscing elit...',
      tags: ['renewable', 'future', 'technology']
    }
  ];
  
  export const defaultSystemConfig: SystemConfig = {
    maintenanceMode: false,
    userRegistration: true,
    maxDevicesPerUser: 10,
    defaultUserRole: 'viewer',
    systemNotification: 'Welcome to Power Hub Admin Dashboard'
  };
  
  export const mockIOTStatistics: IOTStatistics = {
    totalDevices: 25,
    activeDevices: 22,
    totalEnergyConsumption: 1345.7,
    averageDeviceUptime: 98.5,
    deviceTypeDistribution: {
      'Electricity Meter': 10,
      'Energy Generator': 5,
      'Smart Thermostat': 7,
      'Other': 3
    }
  };