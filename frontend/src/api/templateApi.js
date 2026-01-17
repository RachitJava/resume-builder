import axios from 'axios';

const API_URL = '/api/templates';

export const templateApi = {
  getAll: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  getCountries: async () => {
    const response = await axios.get(`${API_URL}/countries`);
    return response.data;
  },

  getSample: async (templateId) => {
    const response = await axios.get(`${API_URL}/${templateId}/sample`);
    return response.data;
  }
};

export default templateApi;

