import axios from 'axios';

const API_URL = '/api/samples';

export const samplesApi = {
  getAll: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  getByProfession: async (professionId) => {
    const response = await axios.get(`${API_URL}/${professionId}`);
    return response.data;
  },
};

export default samplesApi;

