import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import authorizedAxiosInstance from '@/lib/axios';
import DeviceEnergyChart from '@/components/DashboardIOT/DeviceEnergyChart';
import { Power, Thermometer, Clock, Settings, Share2, AlertTriangle, Calendar } from 'lucide-react';

const getAuthToken = () => {
  return sessionStorage.getItem('auth_token');
};

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [isControlling, setIsControlling] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    const fetchDeviceDetails = async () => {
      setIsLoading(true);
      try {
        const token = getAuthToken();
        const response = await authorizedAxiosInstance.get(`/devices/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setDevice(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching device details:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDeviceDetails();
    }
  }, [id]);

  const controlDevice = async (status: string) => {
    setIsControlling(true);
    try {
      const token = getAuthToken();
      const response = await authorizedAxiosInstance.put(
        `/devices/${id}/control`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setDevice({
        ...device,
        status: response.data.status
      });
    } catch (err) {
      console.error('Error controlling device:', err);
      setError(err);
    } finally {
      setIsControlling(false);
    }
  };

  const handleShareDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setShareSuccess(false);
    setShareError('');
    
    try {
      const token = getAuthToken();
      await authorizedAxiosInstance.post(
        `/devices/share`,
        {
          deviceId: id,
          emailToShare: shareEmail
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setShareSuccess(true);
      setShareEmail('');
    } catch (err: any) {
      console.error('Error sharing device:', err);
      setShareError(err.response?.data?.message || 'Lỗi khi chia sẻ thiết bị.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <p className="text-gray-500">Đang tải thông tin thiết bị...</p>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <h3 className="font-semibold">Đã xảy ra lỗi</h3>
          <p className="text-sm">Không thể tải thông tin thiết bị. Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{device.name}</h1>
        
        <div className="flex space-x-2 mt-2 sm:mt-0">
          <button
            className={`flex items-center px-4 py-2 rounded-lg ${
              device.status === 'on'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            onClick={() => controlDevice(device.status === 'on' ? 'off' : 'on')}
            disabled={isControlling}
          >
            <Power className="mr-2 h-5 w-5" />
            {isControlling ? 'Đang xử lý...' : device.status === 'on' ? 'Tắt thiết bị' : 'Bật thiết bị'}
          </button>
          
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Settings className="mr-2 h-5 w-5" />
            Cài đặt thiết bị
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Trạng thái thiết bị</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                device.status === 'on' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <Power className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Trạng thái</p>
                <p className="font-medium">
                  {device.status === 'on' ? 'Đang hoạt động' : 'Đã tắt'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Thermometer className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Tiêu thụ hiện tại</p>
                <p className="font-medium">{device.consumption} kWh</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-600">Cập nhật cuối</p>
                <p className="font-medium">{formatDateTime(device.lastUpdated)}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Thông tin thiết bị</h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Loại thiết bị</p>
              <p className="font-medium">{device.type}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Vị trí</p>
              <p className="font-medium">{device.location}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Thương hiệu</p>
              <p className="font-medium">{device.properties?.brand || 'Không có thông tin'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Model</p>
              <p className="font-medium">{device.properties?.model || 'Không có thông tin'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Số serial</p>
              <p className="font-medium">{device.properties?.serialNumber || 'Không có thông tin'}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Công suất</p>
              <p className="font-medium">{device.properties?.powerRating || 0} W</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Chia sẻ thiết bị</h2>
          
          <form onSubmit={handleShareDevice}>
            <div className="mb-4">
              <label htmlFor="shareEmail" className="block text-sm text-gray-600 mb-1">Email người dùng</label>
              <input
                type="email"
                id="shareEmail"
                className="w-full border rounded px-3 py-2"
                placeholder="Nhập email người dùng"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white flex items-center justify-center py-2 rounded hover:bg-blue-700"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Chia sẻ thiết bị
            </button>
          </form>
          
          {shareSuccess && (
            <div className="mt-3 p-2 bg-green-50 text-green-800 rounded text-sm">
              Thiết bị đã được chia sẻ thành công!
            </div>
          )}
          
          {shareError && (
            <div className="mt-3 p-2 bg-red-50 text-red-800 rounded text-sm">
              {shareError}
            </div>
          )}
          
          <div className="mt-4">
            <h3 className="font-medium text-sm mb-2">Những người dùng có quyền truy cập</h3>
            <p className="text-sm text-gray-500">
              Thiết bị này đang được chia sẻ với {device.userIds.length} người dùng.
            </p>
          </div>
        </div>
      </div>

      <DeviceEnergyChart deviceId={id || ''} />
      
      <div className="mt-6">
        <h2 className="text-lg font-medium mb-4">Lịch sử hoạt động</h2>
        
        {device.history && device.history.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiêu thụ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {device.history.slice(0, 10).map((entry: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDateTime(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entry.status === 'on' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.status === 'on' ? 'Bật' : 'Tắt'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {entry.consumption} kWh
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-gray-600">Không có dữ liệu lịch sử cho thiết bị này</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center mb-4">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-medium">Thông tin cài đặt</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-2">
          Thiết bị này được cài đặt vào ngày:
        </p>
        <p className="font-medium">
          {device.properties?.installDate || 'Không có thông tin'}
        </p>
      </div>
    </div>
  );
};

export default DeviceDetail;