import axios from 'axios';

const API_URL = '/api/admin';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const adminApi = {
  checkAdmin: async () => {
    const response = await axios.get(`${API_URL}/check`, { headers: getAuthHeaders() });
    return response.data;
  },

  // ===== API KEYS =====
  getApiKeys: async () => {
    const response = await axios.get(`${API_URL}/api-keys`, { headers: getAuthHeaders() });
    return response.data;
  },

  createApiKey: async (data) => {
    const response = await axios.post(`${API_URL}/api-keys`, data, { headers: getAuthHeaders() });
    return response.data;
  },

  updateApiKey: async (id, data) => {
    const response = await axios.put(`${API_URL}/api-keys/${id}`, data, { headers: getAuthHeaders() });
    return response.data;
  },

  deleteApiKey: async (id) => {
    await axios.delete(`${API_URL}/api-keys/${id}`, { headers: getAuthHeaders() });
  },

  resetErrors: async (id) => {
    const response = await axios.post(`${API_URL}/api-keys/${id}/reset-errors`, {}, { headers: getAuthHeaders() });
    return response.data;
  },

  // ===== USER MANAGEMENT =====
  getAllUsers: async () => {
    const response = await axios.get(`${API_URL}/users`, { headers: getAuthHeaders() });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await axios.post(`${API_URL}/users`, userData, { headers: getAuthHeaders() });
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await axios.put(`${API_URL}/users/${userId}`, userData, { headers: getAuthHeaders() });
    return response.data;
  },

  deleteUser: async (userId) => {
    await axios.delete(`${API_URL}/users/${userId}`, { headers: getAuthHeaders() });
  },

  // ===== TEMPLATE MANAGEMENT =====
  getAllTemplates: async () => {
    const response = await axios.get(`${API_URL}/templates`, { headers: getAuthHeaders() });
    return response.data;
  },

  generateTemplateFromAI: async (data) => {
    const response = await axios.post(`${API_URL}/templates/generate-ai`, data, { headers: getAuthHeaders() });
    return response.data;
  },

  generateTemplateFromImage: async (formData) => {
    const response = await axios.post(`${API_URL}/templates/generate-image`, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteTemplate: async (templateId) => {
    await axios.delete(`${API_URL}/templates/${templateId}`, { headers: getAuthHeaders() });
  },

  // ===== AI PROVIDER CONFIG =====
  getAiConfigs: async () => {
    const response = await axios.get(`${API_URL}/ai-config`, { headers: getAuthHeaders() });
    return response.data;
  },
  saveAiConfig: async (data) => {
    const response = await axios.post(`${API_URL}/ai-config`, data, { headers: getAuthHeaders() });
    return response.data;
  },
  addAiKey: async (id, key) => {
    const response = await axios.post(`${API_URL}/ai-config/${id}/keys`, key, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'text/plain' }
    });
    return response.data;
  },
  activateAiConfig: async (id) => {
    await axios.post(`${API_URL}/ai-config/${id}/activate`, {}, { headers: getAuthHeaders() });
  },
  deleteAiConfig: async (id) => {
    await axios.delete(`${API_URL}/ai-config/${id}`, { headers: getAuthHeaders() });
  },
  selectAiKey: async (id, index) => {
    const response = await axios.post(`${API_URL}/ai-config/${id}/select-key/${index}`, {}, { headers: getAuthHeaders() });
    return response.data;
  }
};

export default adminApi;
