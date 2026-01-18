import api from './config';
import html2pdf from 'html2pdf.js';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

const API_URL = '/api/resumes';

export const resumeApi = {
  getAll: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  },

  create: async (resume) => {
    const response = await api.post(API_URL, resume);
    return response.data;
  },

  update: async (id, resume) => {
    const response = await api.put(`${API_URL}/${id}`, resume);
    return response.data;
  },

  delete: async (id) => {
    await api.delete(`${API_URL}/${id}`);
  },

  chatWithAi: async (currentResume, message) => {
    const response = await api.post('/api/ai/chat', { currentResume, message });
    return response.data;
  },

  // Client-side PDF generation using PIXEL-PERFECT ONE PAGE STRATEGY
  // 1. Capture High-Res Canvas (Scale 4)
  // 2. Set PDF Page Size = EXACT Canvas Dimensions (in Pixels)
  // 3. This guarantees exactly 1 Page, High Quality, No Splits.
  exportPdfFromPreview: async (previewElement, filename = 'resume.pdf') => {
    // 1. Clone & Prep
    const element = previewElement.cloneNode(true);
    const notifications = element.querySelectorAll('[class*="toast"], [class*="notification"]');
    notifications.forEach(n => n.remove());

    const targetWidth = 794;
    element.style.width = `${targetWidth}px`;
    element.style.margin = '0'; // Margin handled by wrapper
    element.style.padding = '0';
    element.style.background = 'white';
    element.style.transform = 'none';
    element.style.minHeight = '1123px';

    // 2. Wrap for Centering
    const wrapper = document.createElement('div');
    wrapper.style.width = `${targetWidth}px`;
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    wrapper.style.background = 'white';
    wrapper.appendChild(element);

    // Append hidden
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${targetWidth}px`;
    container.appendChild(wrapper);
    document.body.appendChild(container); // Mount to ensure rendering

    try {
      // 3. Initialize Worker
      const worker = html2pdf().from(wrapper).set({
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 4, // 4x Quality
          useCORS: true,
          logging: false,
          width: targetWidth,
          windowWidth: targetWidth
        },
        pagebreak: { mode: 'avoid-all' } // Safety
      });

      // 4. Generate Canvas first to get dimensions
      // internal abstraction allows accessing 'canvas' token
      const canvas = await worker.toCanvas().get('canvas');

      // 5. Force PDF Page Size to Match Canvas EXACTLY
      // Use 'px' units to map 1:1
      worker.set({
        jsPDF: {
          unit: 'px',
          format: [canvas.width, canvas.height],
          orientation: (canvas.width > canvas.height) ? 'landscape' : 'portrait',
          compress: true
        }
      });

      // 6. Save PDF
      return worker.save();

    } finally {
      // Cleanup
      document.body.removeChild(container);
    }
  },

  exportPdf: async (id, template) => {
    try {
      const params = template ? `?template=${template}` : '';
      const response = await api.get(`${API_URL}/${id}/pdf${params}`, {
        responseType: 'blob',
      });

      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty PDF file from server');
      }

      const contentType = response.headers['content-type'];
      if (contentType && !contentType.includes('pdf')) {
        throw new Error(`Expected PDF but received: ${contentType}`);
      }

      const fileName = `resume-${id}.pdf`;

      if (Capacitor.isNativePlatform()) {
        try {
          const permissionStatus = await Filesystem.checkPermissions();
          if (permissionStatus.publicStorage !== 'granted') {
            const request = await Filesystem.requestPermissions();
            if (request.publicStorage !== 'granted') throw new Error('Storage permission denied');
          }

          const reader = new FileReader();
          const base64Data = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(response.data);
          });

          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true
          });

          alert(`PDF saved successfully to Documents/${fileName}`);
          return result;
        } catch (e) {
          console.error(e);
          throw new Error('Failed to save PDF: ' + e.message);
        }
      } else {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          link.remove();
          window.URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (error) {
      console.error('PDF Export Error:', error);
      if (error.response) {
        throw new Error(`Server error: ${error.response.status}`);
      } else if (error.request) {
        throw new Error('No response from server');
      } else {
        throw error;
      }
    }
  },
};

export default resumeApi;
