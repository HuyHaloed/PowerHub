import React from 'react';
import { 
  useAdminUsers, 
  useIOTDevices, 
  useCustomerFeedbacks, 
  useBlogPosts, 
  useIOTStatistics 
} from '@/hooks/useAdminDashboard';
import IOTStatCard from '@/components/AdminDashboard/IOTStatCard';
import UserTable from '@/components/AdminDashboard/UserTable';
import DeviceTable from '@/components/AdminDashboard/DeviceTable';
import CustomerFeedbackList from '@/components/AdminDashboard/CustomerFeedbackList';
import BlogManagementTable from '@/components/AdminDashboard/BlogManagementTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Users, 
  Zap, 
  MessageCircle, 
  FileText 
} from 'lucide-react';

export default function AdminDashboard() {
  // Fetch data using custom hooks
  const { users, loading: usersLoading, updateUserStatus } = useAdminUsers();
  const { devices, loading: devicesLoading, updateDeviceStatus } = useIOTDevices();
  const { 
    feedbacks, 
    loading: feedbacksLoading, 
    updateFeedbackStatus 
  } = useCustomerFeedbacks();
  const { 
    blogPosts, 
    loading: blogPostsLoading, 
    updateBlogPostStatus 
  } = useBlogPosts();
  const { 
    statistics, 
    loading: statisticsLoading 
  } = useIOTStatistics();

  // Render loading state
  if (statisticsLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* IOT Statistics Card */}
      <IOTStatCard statistics={statistics} />

      {/* Tabs for different management sections */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="users" className="flex items-center">
            <Users className="mr-2 h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center">
            <Zap className="mr-2 h-4 w-4" /> Devices
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center">
            <MessageCircle className="mr-2 h-4 w-4" /> Feedback
          </TabsTrigger>
          <TabsTrigger value="blogs" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" /> Blogs
          </TabsTrigger>
        </TabsList>


        {/* Users Tab */}
        <TabsContent value="users">
          <UserTable 
            users={users} 
            onUpdateUserStatus={updateUserStatus} 
          />
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices">
          <DeviceTable 
            devices={devices} 
            onUpdateDeviceStatus={updateDeviceStatus} 
          />
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <CustomerFeedbackList 
            feedbacks={feedbacks} 
            onUpdateFeedbackStatus={updateFeedbackStatus} 
          />
        </TabsContent>

        {/* Blogs Tab */}
        <TabsContent value="blogs">
          <BlogManagementTable 
            blogPosts={blogPosts} 
            onUpdateBlogPostStatus={updateBlogPostStatus} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}