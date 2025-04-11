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
import { useAdminUsers } from '@/hooks/useAdminDashboard';
import UserTable from '@/components/AdminDashboard/UserTable';
import { 
  Plus, 
  Filter, 
  Search 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function UserManagement() {
  const { users, loading, updateUserStatus } = useAdminUsers();
  
  // State for filtering and searching
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);

  // Filter and search logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>User Management</CardTitle>
            <Button 
              onClick={() => setIsCreateUserDialogOpen(true)}
              className="flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" /> Create User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="flex space-x-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users by name or email"
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User Table */}
          <UserTable 
            users={filteredUsers} 
            onUpdateUserStatus={updateUserStatus} 
          />
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog 
        open={isCreateUserDialogOpen} 
        onOpenChange={setIsCreateUserDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the Power Hub admin system
            </DialogDescription>
          </DialogHeader>
          
          {/* Create User Form */}
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Name</label>
              <Input placeholder="Enter user's full name" />
            </div>
            
            <div>
              <label className="block mb-2">Email</label>
              <Input 
                type="email" 
                placeholder="Enter user's email address" 
              />
            </div>
            
            <div>
              <label className="block mb-2">Role</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline"
                onClick={() => setIsCreateUserDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button>Create User</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}