import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useSystemConfig } from '@/hooks/useAdminDashboard';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertTriangle 
} from 'lucide-react';

export default function SystemConfig() {
  const { config, loading, updateSystemConfig } = useSystemConfig();

  const handleConfigUpdate = () => {
    // Implement actual config update logic
    console.log('Updating system configuration', config);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              System Configuration
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4" /> Reset to Default
              </Button>
              <Button 
                onClick={handleConfigUpdate}
                className="flex items-center"
              >
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <label>Maintenance Mode</label>
                  <Switch
                    checked={config.maintenanceMode}
                    onCheckedChange={(checked) => 
                      updateSystemConfig({ maintenanceMode: checked })
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  When enabled, the system will be inaccessible to users
                </p>

                <div className="flex justify-between items-center">
                  <label>User Registration</label>
                  <Switch
                    checked={config.userRegistration}
                    onCheckedChange={(checked) => 
                      updateSystemConfig({ userRegistration: checked })
                    }
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Allow new users to register to the platform
                </p>
              </CardContent>
            </Card>

            {/* User Settings */}
            <Card>
              <CardHeader>
                <CardTitle>User Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block mb-2">Max Devices Per User</label>
                  <Input
                    type="number"
                    value={config.maxDevicesPerUser}
                    onChange={(e) => 
                      updateSystemConfig({ 
                        maxDevicesPerUser: Number(e.target.value) 
                      })
                    }
                    min={1}
                    max={50}
                  />
                </div>

                <div>
                  <label className="block mb-2">Default User Role</label>
                  <Select
                    value={config.defaultUserRole}
                    onValueChange={(value) => 
                      updateSystemConfig({ 
                        defaultUserRole: value as 'viewer' | 'editor' 
                      })
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Notification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
                System Notification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter system-wide notification message"
                value={config.systemNotification || ''}
                onChange={(e) => 
                  updateSystemConfig({ 
                    systemNotification: e.target.value 
                  })
                }
                className="w-full"
              />
              <p className="text-sm text-muted-foreground mt-2">
                This message will be displayed to all users on login
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}