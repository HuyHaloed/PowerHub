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

  // Function to determine the feed name based on device type
  const getFeedNameForDevice = (deviceId: string, deviceType: string = ''): string => {
    const id = deviceId.toLowerCase();
    const type = deviceType.toLowerCase();
    
    if (id.includes('light') || type.includes('light')) {
      return 'powerlight';
    } else if (id.includes('fan') || type.includes('fan')) {
      return 'powerfan';
    } else if (id.includes('ac') || type.includes('ac') || type.includes('air')) {
      return 'powerac';
    } else if (id.includes('tv') || type.includes('tv')) {
      return 'powertv';
    } else {
      // Default to powerlight if we can't determine the type
      return 'powerlight';
    }
  };

  const fetchDeviceData = async () => {
    if (deviceIds.length === 0) return;
    
    setIsLoading(true);
    try {
      // First, fetch device information to get their types
      const devicesResponse = await authorizedAxiosInstance.get('/devices', {
        timeout: 5000
      });
      
      const devices = devicesResponse.data;
      const deviceMap = devices.reduce((acc: any, device: any) => {
        acc[device.id] = device;
        return acc;
      }, {});
      
      // Fetch data for each feed corresponding to each device
      const energyPromises = deviceIds.map(async (deviceId) => {
        const device = deviceMap[deviceId];
        // Get the appropriate feed name based on device type
        const feedName = device ? getFeedNameForDevice(deviceId, device.type) : getFeedNameForDevice(deviceId);
        
        try {
          const response = await authorizedAxiosInstance.get(`/adafruit/data/${feedName}`, {
            timeout: 5000
          });
          
          return {
            deviceId,
            deviceName: device?.name || deviceId,
            consumption: response.data.value ? parseFloat(response.data.value) : 0,
            lastUpdated: response.data.created_at || new Date().toISOString(),
            status: device?.status || "unknown"
          };
        } catch (error: any) {
          console.error(`Error fetching energy data for ${deviceId} (${feedName}):`, error);
          
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
            deviceName: device?.name || deviceId,
            consumption: 0,
            lastUpdated: new Date().toISOString(),
            status: device?.status || "offline"
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
      
      // Determine appropriate WebSocket URL
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
            
            // Check if the message is for a power feed we're monitoring
            if (message.feed) {
              const feedName = message.feed.split('/').pop(); // Get the last part of the feed path
              
              // Find the device that corresponds to this feed
              const matchedDevice = deviceIdsRef.current.find(id => {
                const deviceInState = energyData[id];
                if (!deviceInState) return false;
                
                // Check if this feed corresponds to the device type
                if (feedName === 'powerlight' && (id.toLowerCase().includes('light') || deviceInState.deviceName.toLowerCase().includes('light'))) {
                  return true;
                } else if (feedName === 'powerfan' && (id.toLowerCase().includes('fan') || deviceInState.deviceName.toLowerCase().includes('fan'))) {
                  return true;
                } else if (feedName === 'powerac' && (id.toLowerCase().includes('ac') || deviceInState.deviceName.toLowerCase().includes('air'))) {
                  return true;
                } else if (feedName === 'powertv' && (id.toLowerCase().includes('tv'))) {
                  return true;
                }
                return false;
              });
              
              if (matchedDevice && message.value) {
                setEnergyData((prev) => ({
                  ...prev,
                  [matchedDevice]: {
                    ...prev[matchedDevice],
                    consumption: isNaN(parseFloat(message.value)) ? 0 : parseFloat(message.value),
                    lastUpdated: new Date().toISOString()
                  }
                }));
              }
            }
            
            // Handle direct device status changes (from ON/OFF commands)
            if (message.feed?.includes('chat') && message.value) {
              // Parse the chat message format: "deviceName: status"
              const matchPattern = /(.+?):\s*(.+)/;
              const match = message.value.match(matchPattern);
              
              if (match && match.length === 3) {
                const [_, deviceName, statusValue] = match;
                
                // Find device by name
                const deviceId = deviceIdsRef.current.find(id => {
                  const device = energyData[id];
                  return device && device.deviceName.toLowerCase() === deviceName.toLowerCase().trim();
                });
                
                if (deviceId) {
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