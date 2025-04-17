// src/lib/axios.ts
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const authorizedAxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Interceptor cho request
authorizedAxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho response
authorizedAxiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // Xóa token và đưa người dùng về trang đăng nhập nếu cần
      localStorage.removeItem("token");
    }
    
    return Promise.reject(error);
  }
);

export default authorizedAxiosInstance;