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

  // Client-side PDF generation using native print for exact preview match
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
      iframe.style.zIndex = '-1';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      const content = previewElement.cloneNode(true);

      // Reset transforms and margins on content root to prevent print scaling issues
      content.style.transform = 'none';
      content.style.margin = '0 auto';
      content.style.boxShadow = 'none';

      doc.open();
      doc.write('<!DOCTYPE html><html><head><title>' + filename + '</title>');

      // Copy all styles from main document
      const styles = document.querySelectorAll('link[rel="stylesheet"], style');
      styles.forEach(style => {
        doc.write(style.outerHTML);
      });

      // Add print-specific styles
      doc.write(`
        <style>
          @page { size: auto; margin: 0mm; }
          body { 
            margin: 0; 
            padding: 0; 
            background: white; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          #print-wrapper {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            overflow: visible;
          }
          /* Hide non-print elements */
          .no-print, [role="tooltip"] { display: none !important; }
        </style>
      `);

      doc.write('</head><body>');
      doc.write('<div id="print-wrapper">');
      doc.write(content.outerHTML);
      doc.write('</div>');
      doc.write('</body></html>');
      doc.close();

      // Execute print
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();

          // Cleanup after delay
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            resolve(true);
          }, 2000); // Allow interaction with print dialog on mobile
        }, 800); // Allow styles to render
      };
    });
  },

  exportPdf: async (id, template) => {
    try {
      const params = template ? `?template=${template}` : '';
      const response = await api.get(`${API_URL}/${id}/pdf${params}`, {
        responseType: 'blob',
      });

      // Check if response is valid
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty PDF file from server');
      }

      // Check if it's actually a PDF
      const contentType = response.headers['content-type'];
      if (contentType && !contentType.includes('pdf')) {
        throw new Error(`Expected PDF but received: ${contentType}`);
      }

      const fileName = `resume-${id}.pdf`;

      // Check if running on mobile (Capacitor)
      if (Capacitor.isNativePlatform()) {
        // Mobile: Use Capacitor Filesystem with permission request
        try {
          // Check and request permissions
          const permissionStatus = await Filesystem.checkPermissions();

          if (permissionStatus.publicStorage !== 'granted') {
            const requestResult = await Filesystem.requestPermissions();
            if (requestResult.publicStorage !== 'granted') {
              throw new Error('Storage permission denied. Please enable storage access in settings to download PDFs.');
            }
          }

          // Convert blob to base64
          const reader = new FileReader();
          const base64Data = await new Promise((resolve, reject) => {
            reader.onloadend = () => {
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(response.data);
          });

          // Save to Downloads directory
          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Documents, // Use Documents for better compatibility
            recursive: true
          });

          alert(`PDF saved successfully to Documents/${fileName}`);
          return result;
        } catch (fsError) {
          console.error('Filesystem error:', fsError);
          throw new Error(`Failed to save PDF: ${fsError.message}`);
        }
      } else {
        // Web: Use traditional download
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);

        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
          link.remove();
          window.URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (error) {
      console.error('PDF Export Error:', error);
      // Re-throw with more context
      if (error.response) {
        throw new Error(`Server error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error('No response from server. Check your internet connection.');
      } else {
        throw error;
      }
    }
  },
};

export default resumeApi;
