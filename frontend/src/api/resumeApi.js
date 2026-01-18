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

  // Client-side PDF generation using Visual Snapshot with OVERSIZED PAGE
  // We strictly enforce 1 page by calculating height + large buffer
  exportPdfFromPreview: async (previewElement, filename = 'resume.pdf') => {
    const element = previewElement.cloneNode(true);

    // Clean up notifications/UI
    const notifications = element.querySelectorAll('[class*="toast"], [class*="notification"]');
    notifications.forEach(n => n.remove());

    // Force strict layout dimensions to match screen preview (794px ~ A4 width)
    const targetWidth = 794;
    element.style.width = `${targetWidth}px`;
    element.style.minHeight = '1123px'; // Ensure at least A4 size
    element.style.margin = '0';
    element.style.padding = '0'; // Remove padding to prevent calculation errors
    element.style.background = 'white';
    element.style.transform = 'none';

    // Measure content height accurately by appending to DOM
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${targetWidth}px`;
    container.appendChild(element);
    document.body.appendChild(container);

    // Wait a tick to ensure rendering
    await new Promise(resolve => setTimeout(resolve, 10));

    const contentHeight = element.scrollHeight;
    document.body.removeChild(container);

    // Calculate PDF dimensions
    const a4WidthMm = 210;
    const pxToMm = a4WidthMm / targetWidth;

    // Calculate required height + SIGNIFICANT BUFFER to prevent splitting
    // We add 20mm extra space to ensure html2pdf never feels the need to break
    const contentHeightMm = contentHeight * pxToMm;
    const finalHeightMm = Math.max(297, contentHeightMm + 20);

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        width: targetWidth,
        windowWidth: targetWidth,
        scrollY: 0
      },
      // Force avoid all page breaks
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      jsPDF: {
        unit: 'mm',
        format: [a4WidthMm, finalHeightMm], // Custom single page size
        orientation: 'portrait'
      }
    };

    return html2pdf().set(opt).from(element).save();
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
