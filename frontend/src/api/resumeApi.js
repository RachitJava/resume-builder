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

  // Client-side PDF generation with STRICT Single Page enforcement
  exportPdfFromPreview: async (previewElement, filename = 'resume.pdf') => {
    const element = previewElement.cloneNode(true);

    // Clean up notifications
    const notifications = element.querySelectorAll('[class*="toast"], [class*="notification"]');
    notifications.forEach(n => n.remove());

    // Force exact pixel width to match screen preview (A4 @ 96dpi approx 794px)
    // This ensures text flow matches exactly what user sees on screen
    const targetWidth = 794;
    element.style.width = `${targetWidth}px`;
    element.style.height = 'auto'; // allow natural height
    element.style.margin = '0';
    element.style.padding = '0';
    element.style.transform = 'none';
    element.style.background = 'white';

    // Calculate content height with this specific width
    // We append temporarily to a hidden container to get true scrollHeight
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = `${targetWidth}px`;
    container.appendChild(element);
    document.body.appendChild(container);

    const contentHeight = element.scrollHeight;

    // Clean up temp container
    document.body.removeChild(container);

    // Calculate PDF dimensions in mm
    // A4 width is 210mm
    const a4WidthMm = 210;
    const pxToMm = a4WidthMm / targetWidth;
    const contentHeightMm = contentHeight * pxToMm;

    // Minimum height is A4 (297mm), otherwise grow to fit content
    const finalHeightMm = Math.max(297, contentHeightMm + 5); // 5mm buffer for safety

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      enableLinks: false,
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        width: targetWidth,
        windowWidth: targetWidth
      },
      pagebreak: { mode: 'avoid-all', before: [], after: [], avoid: [] }, // STRICTLY prevent page breaks
      jsPDF: {
        unit: 'mm',
        format: [a4WidthMm, finalHeightMm], // Dynamic single page size
        orientation: 'portrait',
        floatPrecision: 16
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
