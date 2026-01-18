import axios from 'axios';

const getBaseUrl = () => {
    if (import.meta.env.PROD) {
        return import.meta.env.VITE_API_BASE_URL || 'https://resume-builder-app-misty-waterfall-5852.fly.dev';
    }
    return '';
};

export const API_BASE_URL = getBaseUrl();

console.log('🌐 API Configuration:', {
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    baseURL: API_BASE_URL,
    envVar: import.meta.env.VITE_API_BASE_URL
});

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000 // 30 second timeout
});

// Add auth interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📡 API Request:', config.method?.toUpperCase(), config.url);
    return config;
});

// Add response interceptor for error logging
api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', response.config.url, response.status);
        return response;
    },
    (error) => {
        console.error('❌ API Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            message: error.message,
            data: error.response?.data
        });
        return Promise.reject(error);
    }
);

export default api;
