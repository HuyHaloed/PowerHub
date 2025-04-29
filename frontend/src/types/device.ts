export interface DeviceTypeDistributionItem {
    type: string;
    count: number;
    percentage: number;
  }
  
export interface DeviceStatistics {
    totalDevices: number;
    activeDevices: number;
    totalEnergyConsumption: number;
    averageDeviceUptime: number;
    deviceTypeDistribution: DeviceTypeDistributionItem[];
  }