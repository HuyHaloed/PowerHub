// Author: TrungQuanDev: https://youtube.com/@trungquandev
import axios from "axios";
// import toast from "react-hot-toast";
// import { toast } from "react-hot-toast";
// Khởi tạo đối tượng Axios (authorizedAxiosInstance) mục đích để custom và cấu hình chung cho dự án.
// import { toast } from "react-hot-toast";
const authorizedAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACK_END_URL,
});

// Thời gian chờ tối đa của 1 request là 10 phút
authorizedAxiosInstance.defaults.timeout = 1000 * 60 * 10;

// withCredentials: sẽ cho phép axios tự động đính kèm và gửi cookie trong mỗi request lên BE
// phục vụ trường hợp nếu chúng ta sử dụng JWT tokens (refresh và access) theo cơ chế httpOnly Cookie
authorizedAxiosInstance.defaults.withCredentials = true;

/**
 * Cấu hình Interceptors (Bộ đánh chặn vào giữa mọi Request và Response)
 * https://axios-http.com/docs/interceptors
 */

// Add a request interceptor: can thiệp vào giữa những request API
authorizedAxiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  },
);

// Add a response interceptor: Can thiệp vào những response nhận về từ API
authorizedAxiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  async (error) => {
    return Promise.reject(error);
  },
);

export default authorizedAxiosInstance;
