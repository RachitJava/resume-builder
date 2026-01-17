import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import resumeApi from '../api/resumeApi';
import ResumeForm from '../components/ResumeForm';
import ResumePreview from '../components/ResumePreview';
import AiChat from '../components/AiChat';

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

  useEffect(() => {
    if (id) {
      loadResume(id);
    } else if (location.state?.parsedResume && location.state?.fromUpload) {
      // Use parsed resume data from upload
      setResume({
        ...location.state.parsedResume,
        id: undefined
      });
    } else if (location.state?.sample && location.state?.useSample) {
      // Use sample data from template or professional sample
      setResume({
        ...location.state.sample,
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
      return;
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
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (template) => {
    if (!id) {
      alert('Please save the resume first');
      return;
    }
    try {
      await resumeApi.exportPdf(id, template || resume.template);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export PDF');
    }
  };

  const handleAiSuggestions = (updates) => {
    setResume({ ...resume, ...updates });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn btn-ghost p-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="font-display text-2xl font-semibold text-ink-100">
            {id ? 'Edit Resume' : 'Create Resume'}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <TemplateSelector 
            value={resume.template} 
            onChange={(template) => setResume({ ...resume, template })} 
          />
          
          {id && (
            <button onClick={() => handleExport()} className="btn btn-secondary text-sm">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export PDF
              </span>
            </button>
          )}
          
          <button onClick={handleSave} disabled={saving} className="btn btn-primary text-sm">
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="lg:hidden flex border-b border-ink-800">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-smooth ${
            activeTab === 'form' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-ink-400 hover:text-ink-200'
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-smooth ${
            activeTab === 'preview' 
              ? 'border-accent text-accent' 
              : 'border-transparent text-ink-400 hover:text-ink-200'
          }`}
        >
          Preview
        </button>
      </div>

      {/* Content */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div className={`${activeTab === 'form' ? 'block' : 'hidden'} lg:block`}>
          <ResumeForm resume={resume} onChange={setResume} />
        </div>
        <div className={`${activeTab === 'preview' ? 'block' : 'hidden'} lg:block`}>
          <ResumePreview resume={resume} />
        </div>
      </div>

      {/* AI Chat */}
      <AiChat resume={resume} onApplySuggestions={handleAiSuggestions} />
    </div>
  );
}

function TemplateSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const templates = [
    { id: 'modern', name: 'Modern', color: 'bg-blue-500', desc: 'Clean & professional' },
    { id: 'classic', name: 'Classic', color: 'bg-amber-500', desc: 'Traditional serif' },
    { id: 'minimal', name: 'Minimal', color: 'bg-emerald-500', desc: 'Ultra clean' },
    { id: 'executive', name: 'Executive', color: 'bg-slate-600', desc: 'Corporate style' },
    { id: 'creative', name: 'Creative', color: 'bg-purple-500', desc: 'Bold & colorful' },
    { id: 'ats', name: 'ATS Standard', color: 'bg-gray-500', desc: 'Simple ATS format' },
    { id: 'atsclean', name: 'ATS Clean', color: 'bg-gray-400', desc: 'Centered header, serif' },
    { id: 'atsbold', name: 'ATS Bold', color: 'bg-gray-600', desc: 'Bold sections, skills grid' },
    { id: 'atscompact', name: 'ATS Compact', color: 'bg-gray-700', desc: 'Dense, single-page' },
    { id: 'twocolumn', name: 'Two Column', color: 'bg-indigo-500', desc: 'Sidebar layout' },
    { id: 'developer', name: 'Developer', color: 'bg-green-600', desc: 'Tech focused' },
  ];

  const current = templates.find(t => t.id === value) || templates[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-ink-800/50 border border-ink-700 rounded-lg text-sm hover:bg-ink-800 transition-smooth"
      >
        <span className={`w-2 h-2 rounded-full ${current.color}`}></span>
        <span className="text-ink-200">{current.name}</span>
        <svg className={`w-4 h-4 text-ink-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-64 bg-ink-900 border border-ink-700 rounded-xl shadow-xl z-20 overflow-hidden max-h-96 overflow-y-auto">
            <div className="p-2 border-b border-ink-800">
              <p className="text-xs text-ink-500 px-2">Choose a template style</p>
            </div>
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => { onChange(template.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-ink-800 transition-smooth ${
                  value === template.id ? 'bg-ink-800/50' : ''
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${template.color} flex-shrink-0`}></span>
                <div className="flex-1 text-left">
                  <span className="text-ink-200 block">{template.name}</span>
                  <span className="text-ink-500 text-xs">{template.desc}</span>
                </div>
                {value === template.id && (
                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
