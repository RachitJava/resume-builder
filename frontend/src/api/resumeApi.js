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

  // Client-side PDF generation using HIGH-RES VISUAL CAPTURE
  // Quality: Scale 4 (Retina+). Layout: Dynamic Single Width + Centered.
  exportPdfFromPreview: async (previewElement, filename = 'resume.pdf') => {
    // 1. Clone element
    const element = previewElement.cloneNode(true);

    // Clean up
    const notifications = element.querySelectorAll('[class*="toast"], [class*="notification"]');
    notifications.forEach(n => n.remove());

    // 2. Setup Strict Dimensions
    const targetWidth = 794; // Pixel match for A4 width
    element.style.width = `${targetWidth}px`;
    element.style.margin = '0 auto';
    element.style.padding = '0';
    element.style.transform = 'none';
    element.style.background = 'white';
    // Ensure height is auto to capture full content
    element.style.minHeight = '1123px';
    element.style.height = 'auto';

    // 3. Wrap in a centering container
    // This fixes "text not in center" by providing a wide context where the element is strictly centered
    const wrapper = document.createElement('div');
    wrapper.style.width = `${targetWidth}px`;
    wrapper.style.background = '#ffffff';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    wrapper.style.margin = '0';
    wrapper.style.padding = '0';
    wrapper.appendChild(element);

    // 4. Append to DOM (hidden)
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = `${targetWidth}px`;
    container.appendChild(wrapper);
    document.body.appendChild(container);

    // Wait for layout
    await new Promise(resolve => setTimeout(resolve, 50));

    // 5. Calculate Dynamic Height
    const contentHeight = wrapper.scrollHeight;
    document.body.removeChild(container);

    const a4WidthMm = 210;
    const pxToMm = a4WidthMm / targetWidth;

    // Exact height fitting (+ buffer to avoid any sliver of split)
    const finalHeightMm = Math.max(297, contentHeight * pxToMm + 5);

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 1.0 }, // Max Quality
      html2canvas: {
        scale: 4,  // 4x Resolution (High Quality) to fix "quality not okay"
        useCORS: true,
        logging: false,
        width: targetWidth,
        windowWidth: targetWidth,
        scrollY: 0,
        scrollX: 0
      },
      pagebreak: { mode: 'avoid-all' }, // STRICTLY Single Page
      jsPDF: {
        unit: 'mm',
        format: [a4WidthMm, finalHeightMm], // Variable Height Page
        orientation: 'portrait',
        compress: true
      }
    };

    return html2pdf().set(opt).from(element).save();
  },

  exportPdf: async (id, template) => {
    // ... preserved ...
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
