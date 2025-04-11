import { useState, useEffect } from 'react';

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
    const token = localStorage.getItem("token");
    
    if (token) {
      try {
        // For mock account
        const userData = JSON.parse(atob(token));
        setData({
          ...userData,
          subscription: {
            plan: "Premium",
            validUntil: new Date('2025-12-31')
          }
        });
      } catch (error) {
        // If token is from real API
        // You might want to add actual token decoding logic here
        console.error("Invalid token");
        localStorage.removeItem("token");
      }
    }
    
    setIsLoading(false);
  }, []);

  return { data, isLoading };
}