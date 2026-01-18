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

  // Client-side wrapper that delegates PDF generation to Backend Puppeteer Service
  // This ensures 100% Visual Fidelity (identical to preview) + Vector Quality + Single Page
  exportPdfFromPreview: async (previewElement, filename = 'resume.pdf') => {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. Gather all styles (inline them to ensure backend sees exactly what we see)
        let stylesHtml = '';
        const styleSheets = document.querySelectorAll('link[rel="stylesheet"], style');

        for (const style of styleSheets) {
          if (style.tagName.toLowerCase() === 'link') {
            try {
              // Try to fetch stylesheet content to inline it
              if (style.href) {
                const res = await fetch(style.href);
                const css = await res.text();
                stylesHtml += `<style>${css}</style>`;
              }
            } catch (e) {
              console.warn('Could not fetch style:', style.href, e);
              // Fallback to link tag (might work if public URL)
              stylesHtml += style.outerHTML;
            }
          } else {
            stylesHtml += style.outerHTML;
          }
        }

        // 2. Clone Content and Clean UI
        const cloned = previewElement.cloneNode(true);
        const notifications = cloned.querySelectorAll('[class*="toast"], [class*="notification"]');
        notifications.forEach(n => n.remove());

        // 3. Build Full HTML Payload
        // We force background white and reset margins for the rendering engine
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                ${stylesHtml}
                <style>
                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    /* Ensure Single Page behavior visually */
                    .resume-page {
                        margin: 0 auto !important;
                        box-shadow: none !important;
                    }
                </style>
            </head>
            <body>
                ${cloned.outerHTML}
            </body>
            </html>
        `;

        // 4. Send to Backend
        const response = await api.post('/api/resumes/pdf/export',
          { html: htmlContent },
          { responseType: 'blob' }
        );

        // 5. Save/Download File
        const blob = response.data;
        const fileName = filename || 'resume.pdf';

        if (Capacitor.isNativePlatform()) {
          const reader = new FileReader();
          const base64Data = await new Promise((res, rej) => {
            reader.onloadend = () => res(reader.result.split(',')[1]);
            reader.onerror = rej;
            reader.readAsDataURL(blob);
          });

          await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Documents,
            recursive: true
          });
          alert(`PDF saved successfully to Documents/${fileName}`);
          resolve(true);

        } else {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            link.remove();
            window.URL.revokeObjectURL(url);
          }, 1000);
          resolve(true);
        }

      } catch (error) {
        console.error('PDF Export Error:', error);
        alert('Failed to generate PDF. Please try again.');
        reject(error);
      }
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
