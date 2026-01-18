import api from './config';

const API_URL = '/api/auth';

export const authApi = {
  sendOtp: async (email) => {
    try {
      console.log('Sending OTP to:', email);
      console.log('API Base URL:', api.defaults.baseURL);
      const response = await api.post(`${API_URL}/send-otp`, { email });
      console.log('OTP sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('OTP API Error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  },

  verifyOtp: async (email, otp) => {
    const response = await api.post(`${API_URL}/verify-otp`, { email, otp });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get(`${API_URL}/me`);
    return response.data;
  },

  logout: async () => {
    await api.post(`${API_URL}/logout`, {});
  }
};

export default authApi;
