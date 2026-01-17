import axios from 'axios';

const API_URL = '/api/upload';

export const uploadApi = {
  parseResume: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/parse`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default uploadApi;

