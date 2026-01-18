import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import resumeApi from '../api/resumeApi';
import ResumeForm from '../components/ResumeForm';
import ResumePreview from '../components/ResumePreview';

import AiAssistant from '../components/AiAssistant';

const emptyResume = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedIn: '',
  github: '',
  website: '',
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  template: 'modern',
};

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [resume, setResume] = useState(emptyResume);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('form');
  const previewRef = useRef(null);

  const sanitizeResume = (data) => {
    const safeArray = (arr) => Array.isArray(arr) ? arr : [];
    return {
      ...emptyResume,
      ...data,
      experience: safeArray(data.experience),
      education: safeArray(data.education),
      skills: safeArray(data.skills),
      projects: safeArray(data.projects),
      certifications: safeArray(data.certifications),
    };
  };

  useEffect(() => {
    if (id) {
      loadResume(id);
    } else if (location.state?.parsedResume && location.state?.fromUpload) {
      // Use parsed resume data from upload
      const sanitized = sanitizeResume(location.state.parsedResume);
      setResume({
        ...sanitized,
        template: sanitized.template || 'modern', // Preserve template or default to modern
        id: undefined
      });
    } else if (location.state?.sample && location.state?.useSample) {
      // Use sample data from template or professional sample
      const sanitized = sanitizeResume(location.state.sample);
      setResume({
        ...sanitized,
        template: location.state.sample.template || location.state.baseStyle || 'modern',
        id: undefined
      });
    } else if (location.state?.baseStyle) {
      // Just use the template style
      setResume({
        ...emptyResume,
        template: location.state.baseStyle
      });
    }
  }, [id, location.state]);

  const loadResume = async (resumeId) => {
    try {
      const data = await resumeApi.getById(resumeId);
      setResume(data);
    } catch (error) {
      console.error('Failed to load resume:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!resume.fullName.trim()) {
      alert('Please enter your full name');
      return null;
    }

    setSaving(true);
    try {
      let saved;
      if (id) {
        saved = await resumeApi.update(id, resume);
      } else {
        saved = await resumeApi.create(resume);
        navigate(`/editor/${saved.id}`, { replace: true });
      }
      setResume(saved);
      return saved;
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save resume');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    // First save
    const savedResume = await handleSave();
    if (!savedResume) return;

    const content = document.getElementById('resume-preview-content');
    if (!content) {
      alert('Preview not loaded');
      return;
    }

    // Create a hidden iframe for native printing (Vector quality)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    // 1. Write structure
    doc.open();
    doc.write('<!DOCTYPE html><html><head><title>' + (savedResume.fullName || 'Resume') + '</title>');

    // 2. Copy all styles
    const styles = document.querySelectorAll('link[rel="stylesheet"], style');
    styles.forEach(style => {
      doc.write(style.outerHTML);
    });

    doc.write('</head><body style="margin:0; padding:0; background:white; overflow:hidden;">');
    // Wrap content to ensuring captured height is correct
    doc.write('<div id="print-wrapper" style="width:210mm; margin:0 auto;">' + content.outerHTML + '</div>');
    doc.write('</body></html>');
    doc.close();

    // 3. Wait for load and print
    iframe.onload = () => {
      setTimeout(() => {
        const doc = iframe.contentWindow.document;

        // Clean up preview-specific styles for print
        const contentDiv = doc.getElementById('resume-preview-content');
        if (contentDiv) {
          contentDiv.style.transform = 'none'; // Remove screen zoom
          contentDiv.style.minHeight = 'auto';
          contentDiv.style.height = 'auto';
          contentDiv.style.margin = '0';
          contentDiv.style.width = '100%';
          contentDiv.style.boxShadow = 'none';
          contentDiv.style.borderRadius = '0'; // Ensure square corners for print
          contentDiv.classList.remove('resume-auto-fit'); // Remove auto-fit logic
        }

        // Calculate height
        const wrapper = doc.getElementById('print-wrapper');
        const heightPx = wrapper ? wrapper.scrollHeight : 1123;
        // Add 30mm buffer to prevent overflow
        const heightMm = Math.ceil(heightPx * 0.264583) + 30;

        // Inject dynamic page size CSS and force desktop styles
        const style = doc.createElement('style');
        style.innerHTML = `
          @page {
            size: 210mm ${Math.max(297, heightMm)}mm;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
            padding: 0;
          }
          #print-wrapper {
             width: 210mm;
             margin: 0;
             overflow: hidden;
          }
          
          /* Force Tailwind MD styles to ensure full-width headers (negative margins match padding) */
          .md\\:-m-8 { margin: -2rem !important; }
          .md\\:-mx-8 { margin-left: -2rem !important; margin-right: -2rem !important; }
          .md\\:p-8 { padding: 2rem !important; }
          .md\\:mb-6 { margin-bottom: 1.5rem !important; }
          .md\\:-m-6 { margin: -1.5rem !important; } /* Fallback just in case */
        `;
        doc.head.appendChild(style);

        // Print
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      }, 500);
    };
  };

  const handleAiSuggestions = (updates) => {
    setResume({ ...resume, ...updates });
    setShowAiModal(false); // Close modal on apply
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex flex-col font-body">
      {/* Header */}
      <header className="bg-white dark:bg-[#18181B] border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 transition-colors font-medium">
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 font-display">Resume Editor</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <TemplateSelector
            value={resume.template}
            onChange={(t) => setResume(prev => ({ ...prev, template: t }))}
          />

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden md:block"></div>




          <button
            onClick={() => handleSave()}
            className="btn btn-secondary text-sm font-medium"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={handleExport}
            className="btn btn-primary flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PDF
          </button>
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="lg:hidden flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#18181B] sticky top-[73px] z-40">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all duration-150 ${activeTab === 'form'
            ? 'border-gray-900 dark:border-gray-50 text-gray-900 dark:text-gray-50'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
        >
          Editor
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all duration-150 ${activeTab === 'preview'
            ? 'border-gray-900 dark:border-gray-50 text-gray-900 dark:text-gray-50'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
        >
          Preview
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 container mx-auto p-4 md:p-6 lg:max-w-7xl">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-start">
          {/* Form Section */}
          <div className={`${activeTab === 'form' ? 'block' : 'hidden'} lg:block space-y-6`}>
            <ResumeForm resume={resume} onChange={setResume} />
          </div>

          {/* Preview Section */}
          <div className={`${activeTab === 'preview' ? 'block' : 'hidden'} lg:block lg:sticky lg:top-24 space-y-6 invisible-scrollbar`}>
            <div ref={previewRef} className="shadow-lg rounded-lg overflow-hidden bg-white">
              <ResumePreview resume={resume} />
            </div>
            {/* AI Optimizer removed from here, moving to Modal */}
          </div>
        </div>
      </div>

      {/* AI Assistant Chat Bot */}
      <AiAssistant currentResume={resume} onUpdateResume={setResume} />
    </div>
  );
}

function TemplateSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const templates = [
    { id: 'modern', name: 'Modern', color: 'bg-gray-900', desc: 'Clean & professional' },
    { id: 'classic', name: 'Classic', color: 'bg-stone-700', desc: 'Traditional serif' },
    { id: 'minimal', name: 'Minimal', color: 'bg-neutral-500', desc: 'Ultra clean' },
    { id: 'executive', name: 'Executive', color: 'bg-slate-700', desc: 'Corporate style' },
    { id: 'creative', name: 'Creative', color: 'bg-purple-600', desc: 'Bold & colorful' },
    { id: 'ats', name: 'ATS Standard', color: 'bg-zinc-600', desc: 'Simple ATS format' },
    { id: 'atsclean', name: 'ATS Clean', color: 'bg-zinc-400', desc: 'Centered header, serif' },
    { id: 'atsbold', name: 'ATS Bold', color: 'bg-gray-800', desc: 'Bold sections, skills grid' },
    { id: 'atscompact', name: 'ATS Compact', color: 'bg-black', desc: 'Dense, single-page' },
    { id: 'twocolumn', name: 'Two Column', color: 'bg-blue-600', desc: 'Sidebar layout' },
    { id: 'developer', name: 'Developer', color: 'bg-emerald-600', desc: 'Tech focused' },
  ];

  const current = templates.find(t => t.id === value) || templates[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-smooth shadow-sm"
      >
        <span className={`w-2 h-2 rounded-full ${current.color} ring-1 ring-gray-900/10 dark:ring-white/20`}></span>
        <span className="text-gray-700 dark:text-gray-300 font-medium">{current.name}</span>
        <svg className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-hard z-20 overflow-hidden max-h-96 overflow-y-auto">
            <div className="p-2 border-b border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-500 dark:text-gray-400 px-2 font-medium uppercase tracking-wider">Choose style</p>
            </div>
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => { onChange(template.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-smooth border-b border-gray-50 dark:border-gray-900 last:border-0 ${value === template.id ? 'bg-gray-100 dark:bg-gray-900' : ''
                  }`}
              >
                <span className={`w-3 h-3 rounded-full ${template.color} flex-shrink-0 shadow-sm ring-1 ring-gray-900/10 dark:ring-white/20`}></span>
                <div className="flex-1 text-left">
                  <span className={`block font-medium ${value === template.id ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{template.name}</span>
                  <span className="text-gray-500 dark:text-gray-500 text-xs">{template.desc}</span>
                </div>
                {value === template.id && (
                  <svg className="w-4 h-4 text-black dark:text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
