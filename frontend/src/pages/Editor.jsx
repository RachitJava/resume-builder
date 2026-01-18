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
  const [downloadProgress, setDownloadProgress] = useState(0);

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

  // Auto-save effect
  useEffect(() => {
    if (!id || !resume.fullName) return; // Only auto-save if editing existing resume with name

    const autoSaveTimer = setTimeout(async () => {
      try {
        await resumeApi.update(id, resume);
        console.log('✅ Auto-saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 3000); // Auto-save 3 seconds after last change

    return () => clearTimeout(autoSaveTimer);
  }, [resume, id]);

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

    try {
      const previewElement = previewRef.current;
      if (!previewElement) {
        alert('Preview not loaded');
        return;
      }

      // Start Progress Loader
      setDownloadProgress(1);
      const timer = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) return 90; // Stall at 90%
          return prev + 3; // +3% every 500ms -> ~15s to 90%
        });
      }, 500);

      await resumeApi.exportPdfFromPreview(previewElement, `${savedResume.fullName || 'resume'}.pdf`);

      // Finish
      clearInterval(timer);
      setDownloadProgress(100);
      setTimeout(() => setDownloadProgress(0), 1000); // Close after 1s

    } catch (error) {
      console.error('Failed to export PDF:', error);
      setDownloadProgress(0);
      alert(`Failed to download PDF: ${error.message || 'Unknown error'}. Please try again.`);
    }
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
    <div className="h-screen bg-white dark:bg-[#0A0A0A] flex flex-col font-body overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-[#18181B] border-b border-gray-200 dark:border-gray-800 px-3 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50 gap-2 shrink-0" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <button onClick={() => navigate('/')} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 transition-colors flex items-center gap-1">
            <span className="text-xl md:text-sm">←</span>
            <span className="hidden md:inline font-medium">Back</span>
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block"></div>
          <h1 className="text-base md:text-xl font-bold text-gray-900 dark:text-gray-50 font-display truncate max-w-[100px] sm:max-w-none">Editor</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3 ml-auto">
          <div className="hidden sm:block">
            <TemplateSelector
              value={resume.template}
              onChange={(t) => setResume(prev => ({ ...prev, template: t }))}
            />
          </div>

          <button
            onClick={() => handleSave()}
            className="p-2 md:px-4 md:py-2 md:btn md:btn-secondary text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-800 sm:bg-transparent"
            disabled={saving}
            title="Save Draft"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span className="hidden sm:inline">Save</span>
              </span>
            )}
          </button>

          <button
            onClick={handleExport}
            className="btn btn-primary flex items-center gap-1 md:gap-2 text-xs md:text-sm font-medium px-3 py-2 md:px-4 md:py-2"
          >
            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden xs:inline">Download</span>
            <span className="xs:hidden">PDF</span>
          </button>
        </div>
      </header>

      {/* Mobile Template Selector Toggle (below header on mobile) */}
      <div className="sm:hidden px-4 py-2 bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Template:</span>
          <TemplateSelector
            value={resume.template}
            onChange={(t) => setResume(prev => ({ ...prev, template: t }))}
          />
        </div>
      </div>

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
      <div className="flex-1 w-full px-2 md:px-4 lg:px-6 py-4 md:py-6 overflow-y-auto scrollbar-hide">
        <div className="lg:grid lg:grid-cols-[40%_60%] lg:gap-4 xl:gap-6 items-start max-w-[1920px] mx-auto">
          {/* Form Section */}
          <div className={`${activeTab === 'form' ? 'block' : 'hidden'} lg:block space-y-6`}>
            <ResumeForm resume={resume} onChange={setResume} />
          </div>

          {/* Preview Section */}
          <div className={`${activeTab === 'preview' ? 'block' : 'hidden'} lg:block lg:sticky lg:top-24 space-y-6 invisible-scrollbar`}>
            <div ref={previewRef} className="shadow-lg rounded-none overflow-hidden bg-white">
              <ResumePreview resume={resume} />
            </div>
            {/* AI Optimizer removed from here, moving to Modal */}
          </div>
        </div>
      </div>

      {/* AI Assistant Chat Bot */}
      <AiAssistant currentResume={resume} onUpdateResume={setResume} />

      {/* PDF Download Loader Overlay */}
      {downloadProgress > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center flex-col gap-4">
          <div className="bg-white dark:bg-gray-900 p-10 rounded-2xl shadow-2xl flex flex-col items-center border border-gray-100 dark:border-gray-800">
            {/* SVG Circular Loader - Larger & Gradient */}
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full transform" viewBox="0 0 100 100">
                <circle
                  className="text-gray-100 dark:text-gray-800 stroke-current"
                  strokeWidth="8"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                ></circle>
                <circle
                  className="transition-all duration-300 ease-out drop-shadow-md"
                  strokeWidth="8"
                  strokeLinecap="round"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * downloadProgress) / 100}
                  stroke="url(#loaderGradient)"
                  transform="rotate(-90 50 50)"
                ></circle>
                <defs>
                  <linearGradient id="loaderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{downloadProgress}%</span>
              </div>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white animate-pulse">Generating PDF...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait while we prepare your document</p>
          </div>
        </div>
      )}
    </div >
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
