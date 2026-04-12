import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://healthai-hub.onrender.com/api",
  withCredentials: true,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
