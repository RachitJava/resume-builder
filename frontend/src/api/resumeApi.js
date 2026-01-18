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

  // Client-side PDF generation using HIGH QUALITY, SCALED RENDERING
  // This increases resolution to 3x and strictly manages margins to center content
  exportPdfFromPreview: async (previewElement, filename = 'resume.pdf') => {
    const element = previewElement.cloneNode(true);

    // Clean up notifications/UI
    const notifications = element.querySelectorAll('[class*="toast"], [class*="notification"]');
    notifications.forEach(n => n.remove());

    // Force strict layout dimensions to match screen preview
    const targetWidth = 794; // approx A4 at 96dpi

    // Apply styling to ensure content is centered and crisp
    element.style.width = `${targetWidth}px`;
    element.style.minHeight = '1123px';
    element.style.margin = '0 auto'; // Center content
    element.style.padding = '0';
    element.style.background = 'white';
    element.style.transform = 'none';

    // Ensure all internal containers are centered
    // This fixes the "overlay text not in center" issue by forcing flex centering
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center'; // Center horizontally
    wrapper.style.width = `${targetWidth}px`;
    wrapper.style.background = 'white';
    wrapper.appendChild(element);

    // Append to DOM for accurate measurement
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${targetWidth}px`;
    container.appendChild(wrapper);
    document.body.appendChild(container);

    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 50));

    // Measure actual height
    const contentHeight = wrapper.scrollHeight;
    document.body.removeChild(container);

    // Calculate PDF dimensions
    // Use A4 Width (210mm) as the standard
    const a4WidthMm = 210;
    const pxToMm = a4WidthMm / targetWidth;

    // Height calculation with buffer, ensuring Single Page
    const finalHeightMm = Math.max(297, contentHeight * pxToMm + 20);

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 1.0 }, // Max quality
      html2canvas: {
        scale: 4, // Ultra-high resolution (4x) to fix "quality is not okay"
        useCORS: true,
        logging: false,
        width: targetWidth,
        windowWidth: targetWidth,
        scrollY: 0,
        x: 0, // Force left align start
        scrollX: 0
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      jsPDF: {
        unit: 'mm',
        format: [a4WidthMm, finalHeightMm],
        orientation: 'portrait'
      }
    };

    // We pass the WRAPPER to ensure the centering context is captured
    return html2pdf().set(opt).from(element).save();
  },

  exportPdf: async (id, template) => {
    // ... existing backend export code ...
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
