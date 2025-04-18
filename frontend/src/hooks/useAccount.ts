// src/hooks/useAccount.ts
import { useState, useEffect } from 'react';
import authorizedAxiosInstance from '@/lib/axios';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  subscription?: {
    plan: string;
    validUntil: Date;
  };
}

export function useAccount() {
  const [data, setData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Get token from session storage
        const token = sessionStorage.getItem("auth_token");
        
        if (!token) {
          setData(null);
          return;
        }
        
        // Two approaches:
        // 1. Decode the JWT token (if it's structured that way)
        try {
          // Split token into parts and decode the payload (middle part)
          const payload = token.split('.')[1];
          const decodedPayload = JSON.parse(atob(payload));
          
          // Create user from JWT payload
          setData({
            id: decodedPayload.sub || decodedPayload.id,
            name: decodedPayload.name,
            email: decodedPayload.email,
            avatar: decodedPayload.avatar,
            subscription: {
              plan: decodedPayload.plan || "Premium",
              validUntil: new Date('2025-12-31')
            }
          });
        } catch (decodeError) {
          // 2. If JWT decoding fails, fetch user data from API
          try {
            const response = await authorizedAxiosInstance.get('/user/profile');
            setData(response.data);
          } catch (apiError) {
            console.error("Error fetching user data:", apiError);
            sessionStorage.removeItem("auth_token");
            setData(null);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  return { data, isLoading };
}