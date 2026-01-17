import axios from 'axios';

const API_URL = '/api/auth';

export const authApi = {
  sendOtp: async (email) => {
    const response = await axios.post(`${API_URL}/send-otp`, { email });
    return response.data;
  },

  verifyOtp: async (email, otp) => {
    const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
    return response.data;
  },

  getCurrentUser: async (token) => {
    const response = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  logout: async (token) => {
    await axios.post(`${API_URL}/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};

export default authApi;

