import { useState, useEffect, useRef } from 'react';
import authorizedAxiosInstance from '@/lib/axios';

export interface DeviceEnergyData {
  deviceId: string;
  deviceName: string;
  consumption: number;
  lastUpdated: string;
  status: string;
}

export const useDeviceEnergyData = (deviceIds: string[] = []) => {
  const [energyData, setEnergyData] = useState<Record<string, DeviceEnergyData>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  
  // Use refs to track the latest state without causing effect re-runs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const deviceIdsRef = useRef<string[]>(deviceIds);

  // Update ref when deviceIds change
  useEffect(() => {
    deviceIdsRef.current = deviceIds;
  }, [deviceIds]);

  const fetchDeviceData = async () => {
    if (deviceIds.length === 0) return;
    
    setIsLoading(true);
    try {
      // Fetch data for each feed corresponding to each device
      const energyPromises = deviceIds.map(async (deviceId) => {
        // Map device IDs to their Adafruit feed names
        const feedName = deviceId.toLowerCase().includes('light') ? 'powerlight' : 'powerfan';
        
        try {
          const response = await authorizedAxiosInstance.get(`/adafruit/data/${feedName}`, {
            // Add timeout to prevent hanging requests
            timeout: 5000
          });
          
          return {
            deviceId,
            deviceName: deviceId,
            consumption: response.data.value ? parseFloat(response.data.value) : 0,
            lastUpdated: response.data.created_at || new Date().toISOString(),
            status: "unknown" // Will be updated by device status API
          };
        } catch (error: any) {
          console.error(`Error fetching energy data for ${deviceId}:`, error);
          // Don't fail silently - alert the user of API issues
          if (error.code === 'ECONNABORTED') {
            setError(`Request timeout when fetching data for ${deviceId}`);
          } else if (error.response) {
            setError(`Server error (${error.response.status}) when fetching data for ${deviceId}`);
          } else if (error.request) {
            setError(`No response received when fetching data for ${deviceId}`);
          }
          
          // Return a default structure even if we can't fetch the data
          return {
            deviceId,
            deviceName: deviceId,
            consumption: 0,
            lastUpdated: new Date().toISOString(),
            status: "offline" // Default to offline if we can't fetch data
          };
        }
      });

      // Process all promises
      const results = await Promise.all(energyPromises);
      
      // Convert array to record object
      const energyDataMap = results.reduce((acc, item) => {
        acc[item.deviceId] = item;
        return acc;
      }, {} as Record<string, DeviceEnergyData>);
      
      // Update device statuses - wrapped in try/catch
      try {
        const statusResponse = await authorizedAxiosInstance.get('/devices', {
          timeout: 5000 // Add timeout here too
        });
        const devices = statusResponse.data;
        
        // Update our energy data with the latest status info
        devices.forEach((device: any) => {
          if (energyDataMap[device.id]) {
            energyDataMap[device.id] = {
              ...energyDataMap[device.id],
              deviceName: device.name,
              status: device.status
            };
          }
        });
      } catch (error: any) {
        console.error('Error fetching device statuses:', error);
        // Don't fail silently
        if (error.code === 'ECONNABORTED') {
          setError('Request timeout when fetching device statuses');
        } else if (error.response) {
          setError(`Server error (${error.response.status}) when fetching device statuses`);
        } else if (error.request) {
          setError('No response received when fetching device statuses');
        }
      }
      
      setEnergyData(energyDataMap);
      
      // If we got this far, clear any previous errors
      if (error) setError(null);
    } catch (err: any) {
      setError('Failed to load energy data: ' + (err.message || 'Unknown error'));
      console.error('Error loading energy data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial data
    fetchDeviceData();
    
    // Polling interval for fallback
    const pollingInterval = setInterval(fetchDeviceData, 30000);
    
    return () => {
      clearInterval(pollingInterval);
      // Close WebSocket if it exists
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [JSON.stringify(deviceIds)]); // Re-run effect if deviceIds change

  // Separate useEffect for WebSocket to better control reconnection logic
  useEffect(() => {
    if (deviceIds.length === 0) return;
    
    const connectWebSocket = () => {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      // Determine appropriate WebSocket URL - try both localhost and current domain
      // In production, you should use the same domain as your app is running on
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const domain = window.location.hostname;
      const port = domain === 'localhost' ? ':5000' : ''; // Use port 5000 only on localhost
      const wsUrl = `${protocol}//${domain}${port}/ws`;
      
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connection established for energy data');
          setWsConnected(true);
          reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
          setError(prev => prev?.includes('WebSocket') ? null : prev); // Clear WebSocket errors
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            // Determine which device this is for
            let targetDeviceId = null;
            
            if (message.feed?.includes('powerlight')) {
              // This is for the light device
              targetDeviceId = deviceIdsRef.current.find(id => id.toLowerCase().includes('light'));
            } else if (message.feed === 'powerfan') {
              // This is for the fan device
              targetDeviceId = deviceIdsRef.current.find(id => id.toLowerCase().includes('fan'));
            }
            
            if (targetDeviceId && energyData[targetDeviceId]) {
              setEnergyData((prev) => ({
                ...prev,
                [targetDeviceId!]: {
                  ...prev[targetDeviceId!],
                  consumption: parseFloat(message.value) || 0,
                  lastUpdated: new Date().toISOString()
                }
              }));
            }
            
            // Handle status changes if the message contains status info
            if (message.feed?.includes('chat') && message.value) {
              const [deviceName, statusValue] = message.value.split(':');
              if (deviceName && statusValue) {
                const deviceId = deviceIdsRef.current.find(id => 
                  id.toLowerCase().includes(deviceName.toLowerCase())
                );
                
                if (deviceId && energyData[deviceId]) {
                  setEnergyData((prev) => ({
                    ...prev,
                    [deviceId]: {
                      ...prev[deviceId],
                      status: statusValue.trim().toUpperCase(),
                      lastUpdated: new Date().toISOString()
                    }
                  }));
                }
              }
            }
          } catch (err) {
            console.error('Error processing WebSocket message for energy data:', err);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket connection closed.');
          setWsConnected(false);
          
          // Implement exponential backoff for reconnection
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            console.log(`Reconnecting in ${delay/1000} seconds...`);
            
            setTimeout(() => {
              reconnectAttemptsRef.current++;
              connectWebSocket();
            }, delay);
          } else {
            setError('WebSocket connection failed after multiple attempts. Using fallback polling.');
            console.log('Max reconnection attempts reached. Using polling only.');
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error for energy data:', error);
          setError('WebSocket connection error. Using fallback polling.');
        };
      } catch (err) {
        console.error('Error establishing WebSocket connection:', err);
        setError('Failed to establish WebSocket connection. Using fallback polling.');
      }
    };

    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [JSON.stringify(deviceIds)]); // Re-establish WebSocket if deviceIds change

  // Method to get energy data for a specific device
  const getDeviceEnergyData = (deviceId: string): DeviceEnergyData | null => {
    return energyData[deviceId] || null;
  };

  // Method to update energy consumption for a device manually
  const updateDeviceConsumption = (deviceId: string, consumption: number) => {
    if (energyData[deviceId]) {
      setEnergyData(prev => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          consumption,
          lastUpdated: new Date().toISOString()
        }
      }));
    }
  };

  // Method to manually refresh the data
  const refreshData = () => {
    return fetchDeviceData();
  };

  return { 
    energyData, 
    isLoading, 
    error, 
    wsConnected,
    getDeviceEnergyData,
    updateDeviceConsumption,
    refreshData
  };
};