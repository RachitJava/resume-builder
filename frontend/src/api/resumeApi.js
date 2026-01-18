import api from './config';
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

  // Client-side PDF generation using SMART VECTOR PRINT strategy.
  // 1. Vector Quality (Small size, High sharpness).
  // 2. Custom Page Size (Matches content length EXACTLY to prevent splits).
  // 3. Strict Centering (Fixes alignment).
  exportPdfFromPreview: async (previewElement, filename = 'resume.pdf') => {
    return new Promise((resolve) => {
      // 1. Calculate required dimensions
      const cloned = previewElement.cloneNode(true);
      cloned.style.visibility = 'hidden';
      cloned.style.position = 'absolute';
      cloned.style.width = '210mm'; // Standard detailed width
      document.body.appendChild(cloned);

      const contentHeightPx = cloned.scrollHeight;
      document.body.removeChild(cloned);

      // Convert height to mm (approx 96dpi)
      const heightMm = Math.ceil(contentHeightPx * 0.264583) + 10; // +10mm buffer
      const pageWidthMm = 210;

      // Ensure specific minimum height (A4)
      const finalHeightMm = Math.max(297, heightMm);

      // 2. Create Print Iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      const content = previewElement.cloneNode(true);

      // Clean UI
      const notifications = content.querySelectorAll('[class*="toast"], [class*="notification"]');
      notifications.forEach(n => n.remove());

      doc.open();
      doc.write('<!DOCTYPE html><html><head><title>' + filename + '</title>');

      // Copy app styles
      const styles = document.querySelectorAll('link[rel="stylesheet"], style');
      styles.forEach(style => {
        doc.write(style.outerHTML);
      });

      // 3. Inject Smart Print CSS
      doc.write(`
        <style>
          /* DYNAMIC PAGE SIZE: Forces browser to create a single custom-length page */
          @page {
            size: ${pageWidthMm}mm ${finalHeightMm}mm;
            margin: 0; 
          }

          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* FORCE CENTERING: Use Flexbox on body to strictly center the resume container */
          body {
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }

          /* RESUME CONTAINER: Fixed Width, No Margins (Body handles centering) */
          .resume-page {
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: ${finalHeightMm}mm; /* Match page height */
            margin: 0 !important;
            box-shadow: none !important;
            background: white;
            transform: none !important;
          }

          /* Hide UI */
          .no-print { display: none !important; }
        </style>
      `);

      doc.write('</head><body>');
      doc.write(content.outerHTML);
      doc.write('</body></html>');
      doc.close();

      // 4. Print
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();

          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            resolve(true);
          }, 2000);
        }, 1000);
      };
    });
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
