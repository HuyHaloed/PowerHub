import { useState, useEffect } from 'react';
import { 
  AdminUser, 
  IOTDevice, 
  CustomerFeedback, 
  BlogPost, 
  SystemConfig, 
  IOTStatistics 
} from '@/types/adminDashboard.types';
import { 
  mockAdminUsers, 
  mockIOTDevices, 
  mockCustomerFeedbacks, 
  mockBlogPosts, 
  defaultSystemConfig, 
  mockIOTStatistics 
} from '@/data/adminDashboard';

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setUsers(mockAdminUsers);
      setLoading(false);
    }, 500);
  }, []);

  const updateUserStatus = (userId: number, status: AdminUser['status']) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId ? { ...user, status } : user
      )
    );
  };

  return { users, loading, updateUserStatus };
}

export function useIOTDevices() {
  const [devices, setDevices] = useState<IOTDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setDevices(mockIOTDevices);
      setLoading(false);
    }, 500);
  }, []);

  const updateDeviceStatus = (deviceId: number, status: IOTDevice['status']) => {
    setDevices(prev => 
      prev.map(device => 
        device.id === deviceId ? { ...device, status } : device
      )
    );
  };

  return { devices, loading, updateDeviceStatus };
}

export function useCustomerFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setFeedbacks(mockCustomerFeedbacks);
      setLoading(false);
    }, 500);
  }, []);

  const updateFeedbackStatus = (feedbackId: number, status: CustomerFeedback['status']) => {
    setFeedbacks(prev => 
      prev.map(feedback => 
        feedback.id === feedbackId ? { ...feedback, status } : feedback
      )
    );
  };

  return { feedbacks, loading, updateFeedbackStatus };
}

export function useBlogPosts() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setBlogPosts(mockBlogPosts);
      setLoading(false);
    }, 500);
  }, []);

  const updateBlogPostStatus = (postId: number, status: BlogPost['status']) => {
    setBlogPosts(prev => 
      prev.map(post => 
        post.id === postId ? { ...post, status } : post
      )
    );
  };

  return { blogPosts, loading, updateBlogPostStatus };
}

export function useSystemConfig() {
  const [config, setConfig] = useState<SystemConfig>(defaultSystemConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setConfig(defaultSystemConfig);
      setLoading(false);
    }, 500);
  }, []);

  const updateSystemConfig = (newConfig: Partial<SystemConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return { config, loading, updateSystemConfig };
}

export function useIOTStatistics() {
  const [statistics, setStatistics] = useState<IOTStatistics>(mockIOTStatistics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setStatistics(mockIOTStatistics);
      setLoading(false);
    }, 500);
  }, []);

  return { statistics, loading };
}