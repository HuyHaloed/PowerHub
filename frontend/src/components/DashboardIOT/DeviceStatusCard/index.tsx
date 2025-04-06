import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Device } from "@/types/dashboard.types";
import { deviceIcons } from "@/data/dashboardIOT";

interface DeviceStatusCardProps {
  device: Device;
  onToggle?: (id: number, newStatus: "on" | "off") => void;
}

export default function DeviceStatusCard({ device, onToggle }: DeviceStatusCardProps) {
  const handleToggle = () => {
    if (onToggle) {
      onToggle(device.id, device.status === "on" ? "off" : "on");
    }
  };

  // Ensure the icon is rendered correctly
  const DeviceIcon = device.icon || deviceIcons["default"];

  return (
    <div className="device-status-card">
      <div className="device-header">
        <div className="device-icon">
          {React.isValidElement(DeviceIcon) ? DeviceIcon : null}
        </div>
        <div className="device-info">
          <h3>{device.name}</h3>
          <p>{device.location}</p>
        </div>
        <div className="device-toggle">
          <Switch
            checked={device.status === "on"}
            onCheckedChange={handleToggle}
          />
        </div>
      </div>
      <div className="device-details">
        <div className="device-consumption">
          <span>Tiêu thụ</span>
          <span>{device.status === "on" ? `${device.consumption} kWh` : "0 kWh"}</span>
        </div>
        <div className="device-status">
          <span>Trạng thái</span>
          <span>{device.status === "on" ? "Đang hoạt động" : "Đã tắt"}</span>
        </div>
      </div>
    </div>
  );
}