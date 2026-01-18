import api from './config';

const API_URL = '/api/auth';

export const authApi = {
  sendOtp: async (email) => {
    const response = await api.post(`${API_URL}/send-otp`, { email });
    return response.data;
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
