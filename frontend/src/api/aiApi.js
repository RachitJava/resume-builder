import axios from 'axios';

const API_URL = '/api/ai';

export const aiApi = {
  analyzeJob: async (jobDescription, currentResume) => {
    const response = await axios.post(`${API_URL}/analyze`, {
      jobDescription,
      currentResume
    });
    return response.data;
  }
};

export default aiApi;

