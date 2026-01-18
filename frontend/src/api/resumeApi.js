import axios from 'axios';
import html2pdf from 'html2pdf.js';

const API_URL = '/api/resumes';

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth header to every request
api.interceptors.request.use((config) => {
  const authHeaders = getAuthHeaders();
  config.headers = { ...config.headers, ...authHeaders };
  return config;
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

  chatWithAi: async (currentResume, message) => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post('/api/ai/chat', { currentResume, message }, { headers });
    return response.data;
  },

  // Client-side PDF generation from HTML preview (WYSIWYG)
  exportPdfFromPreview: async (previewElement, filename = 'resume.pdf') => {
    // Clone the element to avoid modifying the visible preview
    const element = previewElement.cloneNode(true);

    // Remove ALL notification/warning elements
    const notifications = element.querySelectorAll('[class*="bg-amber"], [class*="bg-red"], [class*="bg-green"], [class*="bg-blue"], [class*="bg-gray-500"]');
    notifications.forEach(notif => {
      // Check if it's a notification (has alert/warning content)
      const text = notif.textContent || '';
      if (text.includes('exceeds') || text.includes('Auto-adjusted') || text.includes('compression') ||
        text.includes('pages') || text.includes('pre-optimized') || text.includes('Template is')) {
        notif.remove();
      }
    });

    // Find the ACTUAL resume content - the innermost template div
    // Look for the template container with specific classes
    let resumeContent = element.querySelector('[class*="font-sans"]') ||
      element.querySelector('[class*="resume-page"]') ||
      element.querySelector('.bg-white') ||
      element;

    // Clean up the content for PDF
    resumeContent.style.width = '210mm';
    resumeContent.style.maxWidth = '210mm';
    resumeContent.style.minHeight = '297mm'; // Minimum A4 height
    // resumeContent.style.maxHeight = '297mm'; // REMOVED: Allow content to grow for multi-page
    resumeContent.style.height = 'auto';
    resumeContent.style.overflow = 'visible'; // Changed from hidden to visible for better rendering
    resumeContent.style.pageBreakAfter = 'auto'; // Changed to auto to allow page breaks
    resumeContent.style.pageBreakInside = 'auto'; // Changed to auto
    resumeContent.style.display = 'block';
    resumeContent.style.backgroundColor = '#ffffff';
    resumeContent.style.margin = '0 auto';
    resumeContent.style.boxShadow = 'none'; // Remove shadows for PDF

    const opt = {
      margin: [5, 0, 5, 0], // Minimal vertical margin, horizontal handled by padding
      filename: filename,
      image: {
        type: 'png',
        quality: 1.0
      },
      html2canvas: {
        scale: 4,
        useCORS: true,
        letterRendering: true,
        allowTaint: true,
        scrollY: 0,
        scrollX: 0,
        windowWidth: 794,
        logging: false,
        removeContainer: true,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Robustly hide notifications with CSS injection
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            [class*="bg-amber"], [class*="bg-red"], [class*="bg-green"], [class*="bg-blue"], .notification, .toast { 
              display: none !important; 
              opacity: 0 !important;
              visibility: hidden !important;
            }
            body, html {
              background-color: #ffffff !important;
              margin: 0 !important;
              height: auto !important;
              overflow: visible !important;
            }
            /* Force internal padding so text doesn't touch edges */
            .resume-page, .printable-content, div[class*="resume-preview"] {
              padding: 40px !important; 
              box-sizing: border-box !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            /* Strict breaking rules */
            h1, h2, h3, h4 { break-after: avoid-page !important; }
            p, li, span { break-inside: avoid !important; }
            .break-inside-avoid { break-inside: avoid !important; }
          `;
          clonedDoc.head.appendChild(style);

          const clonedContent = clonedDoc.body;
          clonedContent.style.color = '#000000';
          clonedContent.style.webkitFontSmoothing = 'antialiased';
        }
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
        hotfixes: ['px_scaling'],
        putOnlyUsedFonts: true
      },
      pagebreak: {
        mode: ['css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after',
        avoid: [
          'tr', 'img', 'svg',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'li', 'span',
          '.break-inside-avoid',
          '.section'
        ]
      }
    };

    return html2pdf().set(opt).from(resumeContent).save();
  },

  // Legacy backend PDF export (kept for compatibility)
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
