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

  // Client-side PDF generation using NATIVE VECTOR PRINT
  // This solves "Quality" (Vector text) and "Alignment" (Flex centering)
  exportPdfFromPreview: async (previewElement, filename = 'resume.pdf') => {
    return new Promise((resolve) => {
      // Create a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.zIndex = '-1'; // Hide it
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;

      // Clone content
      const content = previewElement.cloneNode(true);

      // Clean up notifications
      const notifications = content.querySelectorAll('[class*="toast"], [class*="notification"]');
      notifications.forEach(n => n.remove());

      // Reset element styles to ensure it behaves well in print flow
      content.style.transform = 'none';
      content.style.margin = '0'; // We handle centering via body flex
      content.style.width = '100%';
      content.style.maxWidth = '210mm'; // Standard A4 width constraint

      doc.open();
      doc.write('<!DOCTYPE html><html><head><title>' + filename + '</title>');

      // Copy all styles from main document
      const styles = document.querySelectorAll('link[rel="stylesheet"], style');
      styles.forEach(style => {
        doc.write(style.outerHTML);
      });

      // Add print-specific styles to force perfect centering and quality
      doc.write(`
        <style>
          @page { 
            size: auto;   /* Let browser handle page size based on content */
            margin: 0mm;  /* No default page margins */
          }
          html, body { 
            width: 100%;
            margin: 0; 
            padding: 0; 
            background: white; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
          
          /* CRITICAL: Force Centering of the Resume Content */
          body {
            display: flex;
            justify-content: center; /* Horizontally Center */
            align-items: flex-start; /* Start from top */
          }

          /* Ensure Resume container is restricted to A4 width and standard look */
          .resume-page {
            box-sizing: border-box;
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 297mm;
            margin: 0 auto !important; /* Self-centering backup */
            padding: 0;
            box-shadow: none !important;
            background: white;
          }

          /* Hide UI elements */
          .no-print, [role="tooltip"] { display: none !important; }
        </style>
      `);

      doc.write('</head><body>');
      doc.write(content.outerHTML);
      doc.write('</body></html>');
      doc.close();

      // Execute print
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();

          // Cleanup after print dialog usage
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            resolve(true);
          }, 2000);
        }, 800); // Allow fonts/images to render
      };
    });
  },

  exportPdf: async (id, template) => {
    // ... Backend fallback preserved ...
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
