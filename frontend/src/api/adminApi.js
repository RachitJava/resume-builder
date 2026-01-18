import api from './config';

const API_URL = '/api/admin';

export const adminApi = {
  checkAdmin: async () => {
    const response = await api.get(`${API_URL}/check`);
    return response.data;
  },

  // ===== API KEYS =====
  getApiKeys: async () => {
    const response = await api.get(`${API_URL}/api-keys`);
    return response.data;
  },

  createApiKey: async (data) => {
    const response = await api.post(`${API_URL}/api-keys`, data);
    return response.data;
  },

  updateApiKey: async (id, data) => {
    const response = await api.put(`${API_URL}/api-keys/${id}`, data);
    return response.data;
  },

  deleteApiKey: async (id) => {
    await api.delete(`${API_URL}/api-keys/${id}`);
  },

  resetErrors: async (id) => {
    const response = await api.post(`${API_URL}/api-keys/${id}/reset-errors`, {});
    return response.data;
  },

  // ===== USER MANAGEMENT =====
  getAllUsers: async () => {
    const response = await api.get(`${API_URL}/users`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post(`${API_URL}/users`, userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`${API_URL}/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    await api.delete(`${API_URL}/users/${userId}`);
  },

  // ===== TEMPLATE MANAGEMENT =====
  getAllTemplates: async () => {
    const response = await api.get(`${API_URL}/templates`);
    return response.data;
  },

  generateTemplateFromAI: async (data) => {
    const response = await api.post(`${API_URL}/templates/generate-ai`, data);
    return response.data;
  },

  generateTemplateFromImage: async (formData) => {
    const response = await api.post(`${API_URL}/templates/generate-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteTemplate: async (templateId) => {
    await api.delete(`${API_URL}/templates/${templateId}`);
  },

  // ===== AI PROVIDER CONFIG =====
  getAiConfigs: async () => {
    const response = await api.get(`${API_URL}/ai-config`);
    return response.data;
  },
  saveAiConfig: async (data) => {
    const response = await api.post(`${API_URL}/ai-config`, data);
    return response.data;
  },
  addAiKey: async (id, key) => {
    const response = await api.post(`${API_URL}/ai-config/${id}/keys`, key, {
      headers: { 'Content-Type': 'text/plain' }
    });
    return response.data;
  },
  activateAiConfig: async (id) => {
    await api.post(`${API_URL}/ai-config/${id}/activate`, {});
  },
  deleteAiConfig: async (id) => {
    await api.delete(`${API_URL}/ai-config/${id}`);
  },
  selectAiKey: async (id, index) => {
    const response = await api.post(`${API_URL}/ai-config/${id}/select-key/${index}`, {});
    return response.data;
  }
};

export default adminApi;
