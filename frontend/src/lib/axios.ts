// lib/axios.ts
import axios from 'axios';

const authorizedAxiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token to requests
authorizedAxiosInstance.interceptors.request.use(
  (config) => {
    // Get JWT token from session storage
    const token = sessionStorage.getItem('auth_token');
    
    // If token exists, add it to the request's Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized errors
authorizedAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // If response status is 401, redirect to login page
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('auth_token');
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

export default authorizedAxiosInstance;