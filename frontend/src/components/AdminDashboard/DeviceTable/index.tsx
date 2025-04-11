import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { IOTDevice } from '@/types/adminDashboard.types';
import { MoreHorizontal, Power, BarChart2, Edit } from 'lucide-react';

interface DeviceTableProps {
  devices: IOTDevice[];
  onUpdateDeviceStatus: (deviceId: number, status: IOTDevice['status']) => void;
}

export default function DeviceTable({ devices, onUpdateDeviceStatus }: DeviceTableProps) {
  const getStatusColor = (status: IOTDevice['status']) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50';
      case 'offline': return 'text-red-600 bg-red-50';
      case 'error': return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Energy Consumption</TableHead>
          <TableHead>Last Connection</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devices.map((device) => (
          <TableRow key={device.id}>
            <TableCell>{device.id}</TableCell>
            <TableCell>{device.name}</TableCell>
            <TableCell>{device.type}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(device.status)}`}>
                {device.status}
              </span>
            </TableCell>
            <TableCell>{device.location || 'Not Set'}</TableCell>
            <TableCell>
              {device.energyConsumption > 0 
                ? `${device.energyConsumption.toFixed(2)} kWh` 
                : `${Math.abs(device.energyConsumption).toFixed(2)} kWh Generated`
              }
            </TableCell>
            <TableCell>
              {device.lastConnection 
                ? device.lastConnection.toLocaleString() 
                : 'Never'}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    onSelect={() => {
                      const newStatus = 
                        device.status === 'online' ? 'offline' : 
                        device.status === 'offline' ? 'online' : 'online';
                      onUpdateDeviceStatus(device.id, newStatus);
                    }}
                  >
                    <Power className="mr-2 h-4 w-4" /> 
                    {device.status === 'online' ? 'Turn Off' : 'Turn On'}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BarChart2 className="mr-2 h-4 w-4" /> View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" /> Edit Device
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}