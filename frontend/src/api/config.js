import axios from 'axios';

const getBaseUrl = () => {
    if (import.meta.env.PROD) {
        return import.meta.env.VITE_API_BASE_URL || '';
    }
    return '';
};

export const API_BASE_URL = getBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL
});

// Add auth interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
