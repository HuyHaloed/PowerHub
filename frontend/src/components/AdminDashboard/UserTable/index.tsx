import React, { useState } from 'react';
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
import { AdminUser } from '@/types/adminDashboard.types';
import { MoreHorizontal, Edit, Lock, Unlock } from 'lucide-react';

interface UserTableProps {
  users: AdminUser[];
  onUpdateUserStatus: (userId: number, status: AdminUser['status']) => void;
}

export default function UserTable({ users, onUpdateUserStatus }: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const getStatusColor = (status: AdminUser['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'suspended': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Login</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.id}</TableCell>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(user.status)}`}>
                {user.status}
              </span>
            </TableCell>
            <TableCell>
              {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Never'}
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
                      const newStatus = user.status === 'active' ? 'suspended' : 'active';
                      onUpdateUserStatus(user.id, newStatus);
                    }}
                  >
                    {user.status === 'active' ? (
                      <>
                        <Lock className="mr-2 h-4 w-4" /> Suspend User
                      </>
                    ) : (
                      <>
                        <Unlock className="mr-2 h-4 w-4" /> Activate User
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" /> Edit Details
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