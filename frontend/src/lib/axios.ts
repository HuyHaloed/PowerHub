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
    console.log('Request config:', config);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

authorizedAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Full error response:', error.response);
    console.error('Error details:', error.message);
    return Promise.reject(error);
  }
);

export default authorizedAxiosInstance;