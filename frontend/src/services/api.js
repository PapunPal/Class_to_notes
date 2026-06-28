import axios from 'axios';

// Base API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for reading/sending HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken = '';
let refreshSubscribers = [];
let isRefreshing = false;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 unauthorized & refresh token rotation
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if the error is 401 and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if refresh token itself fails
      if (originalRequest.url === '/auth/refresh-token' || originalRequest.url === '/auth/login') {
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // Queue up requests while token is refreshing
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
        
        const newAccessToken = response.data.accessToken;
        setAccessToken(newAccessToken);
        
        // Notify subscribers
        refreshSubscribers.forEach((cb) => cb(newAccessToken));
        refreshSubscribers = [];
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token expired or invalid. User must re-authenticate.');
        setAccessToken('');
        isRefreshing = false;
        
        // Trigger a custom logout event or reject
        if (window.handleAuthFailure) {
          window.handleAuthFailure();
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
