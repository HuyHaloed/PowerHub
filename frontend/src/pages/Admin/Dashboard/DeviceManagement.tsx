import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useIOTDevices } from '@/hooks/useAdminDashboard';
import DeviceTable from '@/components/AdminDashboard/DeviceTable';
import { 
  Plus, 
  Filter, 
  Search 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function DeviceManagement() {
  const { devices, loading, updateDeviceStatus } = useIOTDevices();
  
  // State for filtering and searching
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateDeviceDialogOpen, setIsCreateDeviceDialogOpen] = useState(false);

  // Filter and search logic
  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || device.status === filterStatus;
    
    const matchesType = 
      filterType === 'all' || device.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get unique device types for filtering
  const deviceTypes = Array.from(new Set(devices.map(device => device.type)));

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Device Management</CardTitle>
            <Button 
              onClick={() => setIsCreateDeviceDialogOpen(true)}
              className="flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Device
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex space-x-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search devices by name or location"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select 
              value={filterStatus}
              onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filterType}
              onValueChange={setFilterType}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {deviceTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Device Table */}
          <DeviceTable 
            devices={filteredDevices} 
            onUpdateDeviceStatus={updateDeviceStatus} 
          />
        </CardContent>
      </Card>

      {/* Create Device Dialog */}
      <Dialog 
        open={isCreateDeviceDialogOpen} 
        onOpenChange={setIsCreateDeviceDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>
              Register a new IoT device to the Power Hub system
            </DialogDescription>
          </DialogHeader>
          
          {/* Create Device Form */}
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Device Name</label>
              <Input placeholder="Enter device name" />
            </div>
            
            <div>
              <label className="block mb-2">Device Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electricity-meter">Electricity Meter</SelectItem>
                  <SelectItem value="solar-panel">Solar Panel</SelectItem>
                  <SelectItem value="smart-thermostat">Smart Thermostat</SelectItem>
                  <SelectItem value="energy-storage">Energy Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-2">Location</label>
              <Input placeholder="Enter device location" />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline"
                onClick={() => setIsCreateDeviceDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button>Add Device</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}