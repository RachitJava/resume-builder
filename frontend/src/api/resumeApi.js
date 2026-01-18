import api from './config';
import html2pdf from 'html2pdf.js';

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

  // Client-side PDF generation
  exportPdfFromPreview: async (previewElement, filename = 'resume.pdf') => {
    const element = previewElement.cloneNode(true);
    // ... (rest of the logic remains the same)
    // I'll keep the logic I saw in the previous view_file
    const notifications = element.querySelectorAll('[class*="bg-amber"], [class*="bg-red"], [class*="bg-green"], [class*="bg-blue"], [class*="bg-gray-500"]');
    notifications.forEach(notif => {
      const text = notif.textContent || '';
      if (text.includes('exceeds') || text.includes('Auto-adjusted') || text.includes('compression') ||
        text.includes('pages') || text.includes('pre-optimized') || text.includes('Template is')) {
        notif.remove();
      }
    });

    let resumeContent = element.querySelector('[class*="font-sans"]') ||
      element.querySelector('[class*="resume-page"]') ||
      element.querySelector('.bg-white') ||
      element;

    resumeContent.style.width = '210mm';
    resumeContent.style.maxWidth = '210mm';
    resumeContent.style.minHeight = '297mm';
    resumeContent.style.height = 'auto';
    resumeContent.style.overflow = 'visible';
    resumeContent.style.pageBreakAfter = 'auto';
    resumeContent.style.pageBreakInside = 'auto';
    resumeContent.style.display = 'block';
    resumeContent.style.backgroundColor = '#ffffff';
    resumeContent.style.margin = '0 auto';
    resumeContent.style.boxShadow = 'none';

    const opt = {
      margin: [5, 0, 5, 0],
      filename: filename,
      image: { type: 'png', quality: 1.0 },
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
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            [class*="bg-amber"], [class*="bg-red"], [class*="bg-green"], [class*="bg-blue"], .notification, .toast { 
              display: none !important; 
            }
            body, html { background-color: #ffffff !important; overflow: visible !important; }
            .resume-page, .printable-content, div[class*="resume-preview"] {
              padding: 40px !important; 
              width: 100% !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    return html2pdf().set(opt).from(resumeContent).save();
  },

  exportPdf: async (id, template) => {
    const params = template ? `?template=${template}` : '';
    const response = await api.get(`${API_URL}/${id}/pdf${params}`, {
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
