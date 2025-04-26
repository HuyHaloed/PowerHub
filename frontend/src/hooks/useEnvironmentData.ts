// hooks/useAdafruitData.ts
import { useState, useEffect } from 'react';
import authorizedAxiosInstance from '../lib/axios';

export interface AdafruitData {
  temperature?: number;
  humidity?: number;
  lastUpdated: string;
}

export const useAdafruitData = () => {
  const [data, setData] = useState<AdafruitData>({
    temperature: undefined,
    humidity: undefined,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Tải dữ liệu ban đầu từ API
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        // Lấy giá trị nhiệt độ từ Adafruit
        const tempResponse = await authorizedAxiosInstance.get('/adafruit/data/temperature');
        
        // Lấy giá trị độ ẩm từ Adafruit
        const humidityResponse = await authorizedAxiosInstance.get('/adafruit/data/humidity');
        
        setData({
          temperature: parseFloat(tempResponse.data.value),
          humidity: parseFloat(humidityResponse.data.value),
          lastUpdated: new Date().toISOString()
        });
        
        setError(null);
      } catch (err) {
        setError('Không thể tải dữ liệu từ Adafruit');
        console.error('Lỗi khi tải dữ liệu từ Adafruit:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
    
    // Kết nối WebSocket để nhận cập nhật thời gian thực
    const connectWebSocket = () => {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//localhost:5000/ws`;
      console.log('Connecting to WebSocket at:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.feed.includes('temperature')) {
            setData(prev => ({
              ...prev,
              temperature: parseFloat(message.value),
              lastUpdated: new Date().toISOString()
            }));
          } else if (message.feed.includes('humidity')) {
            setData(prev => ({
              ...prev,
              humidity: parseFloat(message.value),
              lastUpdated: new Date().toISOString()
            }));
          }
        } catch (err) {
          console.error('Lỗi khi xử lý tin nhắn WebSocket:', err);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed. Reconnecting...');
        // Kết nối lại sau 3 giây nếu bị đóng
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      // Hàm dọn dẹp khi component unmount
      return () => {
        console.log('Closing WebSocket connection');
        ws.close();
      };
    };
    
    const cleanup = connectWebSocket();
    
    return cleanup;
  }, []);
  
  return { data, isLoading, error };
};