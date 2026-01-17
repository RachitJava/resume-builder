import axios from 'axios';

const API_URL = '/api/job-match';

export const jobMatchApi = {
  analyzeJob: async (jobData) => {
    const response = await axios.post(`${API_URL}/analyze`, jobData);
    return response.data;
  },
};

export default jobMatchApi;

