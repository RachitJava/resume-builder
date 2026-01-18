import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const getBaseUrl = () => {
    // Always use full URL for Capacitor (mobile) or production builds
    if (Capacitor.isNativePlatform() || import.meta.env.PROD) {
        const url = import.meta.env.VITE_API_BASE_URL || 'https://resume-builder-app-misty-waterfall-5852.fly.dev';
        console.log('🌐 Using backend URL:', url);
        return url;
    }
    // Development mode - use relative URLs (proxy)
    console.log('🌐 Using relative URLs (dev mode)');
    return '';
};

export const API_BASE_URL = getBaseUrl();

console.log('🌐 API Configuration:', {
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    baseURL: API_BASE_URL,
    envVar: import.meta.env.VITE_API_BASE_URL
});

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 120000 // 120 second timeout
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
