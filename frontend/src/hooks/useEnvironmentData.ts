import { useState, useEffect } from 'react';
import authorizedAxiosInstance from '../lib/axios';

export interface AdafruitData {
  temperature?: number;
  humidity?: number;
  brightness?: number; // Thêm brightness vào interface
  lastUpdated: string;
}

export const useAdafruitData = () => {
  const [data, setData] = useState<AdafruitData>({
    temperature: undefined,
    humidity: undefined,
    brightness: undefined, // Khởi tạo brightness
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Tải dữ liệu ban đầu từ API
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const tempResponse = await authorizedAxiosInstance.get('/adafruit/data/temperature');
        const humidityResponse = await authorizedAxiosInstance.get('/adafruit/data/humidity');
        const brightnessResponse = await authorizedAxiosInstance.get('/adafruit/data/brightness'); // Thêm API call cho brightness

        setData({
          temperature: parseFloat(tempResponse.data.value),
          humidity: parseFloat(humidityResponse.data.value),
          brightness: parseFloat(brightnessResponse.data.value), // Lưu giá trị brightness
          lastUpdated: new Date().toISOString(),
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
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connection established');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.feed.includes('temperature')) {
            setData((prev) => ({
              ...prev,
              temperature: parseFloat(message.value),
              lastUpdated: new Date().toISOString(),
            }));
          } else if (message.feed.includes('humidity')) {
            setData((prev) => ({
              ...prev,
              humidity: parseFloat(message.value),
              lastUpdated: new Date().toISOString(),
            }));
          } else if (message.feed.includes('brightness')) { // Xử lý cập nhật brightness
            setData((prev) => ({
              ...prev,
              brightness: parseFloat(message.value),
              lastUpdated: new Date().toISOString(),
            }));
          }
        } catch (err) {
          console.error('Lỗi khi xử lý tin nhắn WebSocket:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed. Reconnecting...');
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

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