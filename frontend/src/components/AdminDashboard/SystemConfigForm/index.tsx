import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { SystemConfig } from '@/types/adminDashboard.types';
import { Settings, Save } from 'lucide-react';

interface SystemConfigFormProps {
  config: SystemConfig;
  onUpdateConfig: (config: Partial<SystemConfig>) => void;
}

export default function SystemConfigForm({ 
  config, 
  onUpdateConfig 
}: SystemConfigFormProps) {
  const [localConfig, setLocalConfig] = useState<SystemConfig>(config);

  const handleConfigChange = <K extends keyof SystemConfig>(
    key: K, 
    value: SystemConfig[K]
  ) => {
    const updatedConfig = { ...localConfig, [key]: value };
    setLocalConfig(updatedConfig);
  };

  const handleSaveConfig = () => {
    onUpdateConfig(localConfig);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5" /> 
          System Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Maintenance Mode */}
          <div className="space-y-2">
            <Label className="flex items-center">
              Maintenance Mode
              <Switch
                checked={localConfig.maintenanceMode}
                onCheckedChange={(checked) => 
                  handleConfigChange('maintenanceMode', checked)
                }
                className="ml-4"
              />
            </Label>
            <p className="text-xs text-muted-foreground">
              When enabled, the system will be inaccessible to users
            </p>
          </div>

          {/* User Registration */}
          <div className="space-y-2">
            <Label className="flex items-center">
              User Registration
              <Switch
                checked={localConfig.userRegistration}
                onCheckedChange={(checked) => 
                  handleConfigChange('userRegistration', checked)
                }
                className="ml-4"
              />
            </Label>
            <p className="text-xs text-muted-foreground">
              Allow new users to register to the platform
            </p>
          </div>

          {/* Max Devices Per User */}
          <div className="space-y-2">
            <Label>Max Devices Per User</Label>
            <Input
              type="number"
              value={localConfig.maxDevicesPerUser}
              onChange={(e) => 
                handleConfigChange('maxDevicesPerUser', Number(e.target.value))
              }
              min={1}
              max={50}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Limit the number of devices a user can add
            </p>
          </div>

          {/* Default User Role */}
          <div className="space-y-2">
            <Label>Default User Role</Label>
            <Select
              value={localConfig.defaultUserRole}
              onValueChange={(value) => 
                handleConfigChange('defaultUserRole', value as 'viewer' | 'editor')
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Default access level for new users
            </p>
          </div>
        </div>

        {/* System Notification */}
        <div className="space-y-2">
          <Label>System Notification</Label>
          <Input
            value={localConfig.systemNotification || ''}
            onChange={(e) => 
              handleConfigChange('systemNotification', e.target.value)
            }
            placeholder="Enter system-wide notification message"
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Message will be displayed to all users on login
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-4">
          <Button 
            onClick={handleSaveConfig}
            className="flex items-center"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}