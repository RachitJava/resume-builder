import axios from 'axios';

const API_URL = '/api/resumes';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const resumeApi = {
  getAll: async () => {
    const response = await api.get('');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/${id}`);
    return response.data;
  },

  create: async (resume) => {
    const response = await api.post('', resume);
    return response.data;
  },

  update: async (id, resume) => {
    const response = await api.put(`/${id}`, resume);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`/${id}`);
  },

  exportPdf: async (id, template) => {
    const params = template ? `?template=${template}` : '';
    const response = await api.get(`/${id}/pdf${params}`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'resume.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default resumeApi;

