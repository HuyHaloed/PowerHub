// File: frontend/src/hooks/usePredictData.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

// Import các kiểu dữ liệu đã định nghĩa (hoặc tạo chúng nếu chưa có)
import {
    WeatherData, // Kiểu dữ liệu cho điều kiện hiện tại
    ComfortData, // Kiểu dữ liệu cho dữ liệu dự báo thoải mái
} from 'src/types/predictdata';

interface ForecastWeatherData {
    date: string;
    humidity: number;
    pressure: number;
    windSpeed: number;
    temperature: number;
}

const API_URL = 'http://localhost:5000/api';

interface UsePredictData {
    weatherData: ForecastWeatherData[]; // Dữ liệu dự báo thời tiết
    comfortData: ComfortData[]; // Dữ liệu dự báo độ thoải mái
    currentConditions: WeatherData | null; // Dữ liệu điều kiện hiện tại
    loading: boolean; // Trạng thái đang tải
    error: string | null; // Thông báo lỗi
    fetchForecastData: (days: number) => Promise<void>; // Hàm để fetch lại dữ liệu dự báo
    fetchCurrentConditions: () => Promise<void>; // Hàm để fetch lại dữ liệu hiện tại
}

const usePredictData = (initialForecastDays = 7): UsePredictData => {
    const [weatherData, setWeatherData] = useState<ForecastWeatherData[]>([]);
    const [comfortData, setComfortData] = useState<ComfortData[]>([]);
    const [currentConditions, setCurrentConditions] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Hàm để fetch dữ liệu dự báo thời tiết
    const fetchWeatherData = async (days: number) => {
        try {
            // setLoading(true); // Có thể set loading ở đây nếu muốn hiển thị loading khi thay đổi số ngày
            const response = await axios.get<ForecastWeatherData[]>(`${API_URL}/weather/forecast`, {
                params: { days }
            });
            setWeatherData(response.data);
            // setError(null); // Xóa lỗi nếu thành công
        } catch (err) {
            console.error('Error fetching weather forecast:', err);
            setError('Không thể tải dữ liệu dự báo thời tiết.');
            setWeatherData([]); // Reset dữ liệu nếu lỗi
        } finally {
            // setLoading(false); // Có thể set loading ở đây
        }
    };

    // Hàm để fetch dữ liệu dự báo độ thoải mái
    const fetchComfortData = async (days: number) => {
        try {
             // setLoading(true); // Có thể set loading ở đây
            const response = await axios.get<ComfortData[]>(`${API_URL}/comfort/forecast`, {
                 params: { days }
            });
            setComfortData(response.data);
            // setError(null); // Xóa lỗi nếu thành công
        } catch (err) {
            console.error('Error fetching comfort forecast:', err);
            setError('Không thể tải dữ liệu dự báo độ thoải mái.');
            setComfortData([]); // Reset dữ liệu nếu lỗi
        } finally {
            // setLoading(false); // Có thể set loading ở đây
        }
    };

     // Hàm để fetch dữ liệu điều kiện hiện tại
    const fetchCurrentConditions = async () => {
        try {
            // Có thể thêm loading state riêng cho current conditions nếu cần
            const response = await axios.get<WeatherData>(`${API_URL}/weather/current`);
            setCurrentConditions(response.data);
             // setError(null); // Xóa lỗi nếu thành công
        } catch (err) {
            console.error('Error fetching current conditions:', err);
            setError('Không thể tải dữ liệu điều kiện hiện tại.');
            setCurrentConditions(null); // Reset dữ liệu nếu lỗi
        }
    };


    // Effect để fetch dữ liệu dự báo khi hook được gọi lần đầu hoặc số ngày thay đổi
    useEffect(() => {
        setLoading(true); // Bắt đầu tải
        setError(null); // Reset lỗi

        // Fetch cả hai loại dữ liệu dự báo song song
        Promise.all([
            fetchWeatherData(initialForecastDays),
            fetchComfortData(initialForecastDays)
        ]).then(() => {
            setLoading(false); // Kết thúc tải khi cả hai Promise hoàn thành
        }).catch(() => {
            // Lỗi đã được xử lý trong từng hàm fetch riêng
            setLoading(false); // Dù lỗi cũng kết thúc tải
        });

         // Fetch điều kiện hiện tại lần đầu
         fetchCurrentConditions();

    }, [initialForecastDays]); // Re-run effect nếu initialForecastDays thay đổi

    // Effect để fetch dữ liệu điều kiện hiện tại định kỳ
    useEffect(() => {
        // Fetch lần đầu tiên đã được xử lý trong effect trên,
        // effect này chỉ thiết lập interval cho các lần fetch tiếp theo.
        const interval = setInterval(() => {
            fetchCurrentConditions();
        }, 10000); // Ví dụ: fetch mỗi 10 giây

        // Cleanup function để dừng interval khi component unmount
        return () => clearInterval(interval);
    }, []); // Chỉ chạy một lần khi mount và cleanup khi unmount

    // Hàm public để component sử dụng hook có thể chủ động fetch lại data
     const refetchForecastData = async (days: number) => {
        setLoading(true);
        setError(null);
         await Promise.all([
            fetchWeatherData(days),
            fetchComfortData(days)
        ]);
        setLoading(false);
     }

     const refetchCurrentConditions = async () => {
         // Có thể thêm loading state riêng cho current conditions nếu cần
         setError(null);
         await fetchCurrentConditions();
     }


    return {
        weatherData,
        comfortData,
        currentConditions,
        loading,
        error,
        fetchForecastData: refetchForecastData, // Xuất hàm fetch lại dữ liệu dự báo
        fetchCurrentConditions: refetchCurrentConditions // Xuất hàm fetch lại dữ liệu hiện tại
    };
};

export default usePredictData;