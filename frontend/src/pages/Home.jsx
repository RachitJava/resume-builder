import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import resumeApi from '../api/resumeApi';
import ResumeUpload from '../components/ResumeUpload';
import ProfessionalSamples from '../components/ProfessionalSamples';

export default function Home() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('samples');
  const navigate = useNavigate();

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const data = await resumeApi.getAll();
      setResumes(data);
    } catch (error) {
      console.error('Failed to load resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this resume?')) {
      try {
        await resumeApi.delete(id);
        setResumes(resumes.filter(r => r.id !== id));
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const handleExport = async (id, template, e) => {
    e.stopPropagation();
    try {
      // Show loading feedback
      const originalText = e.currentTarget.innerHTML;
      e.currentTarget.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

      await resumeApi.exportPdf(id, template);

      // Restore button and show success
      e.currentTarget.innerHTML = originalText;
      alert('PDF downloaded successfully!');
    } catch (error) {
      console.error('Failed to export:', error);
      // Show error to user
      alert(`Failed to download PDF: ${error.message || 'Unknown error'}. Please try again.`);
      // Restore button
      e.currentTarget.innerHTML = e.currentTarget.innerHTML;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-6">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-50">
          Build Your <span className="text-black dark:text-white">Perfect Resume</span>
        </h1>
        <p className="text-gray-700 dark:text-gray-300 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Upload your existing resume, use professional templates, or start from scratch.
          Our AI helps you create ATS-friendly resumes in minutes.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upload Resume */}
        <div className="md:col-span-2">
          <ResumeUpload />
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <Link
            to="/templates"
            className="block p-5 bg-gradient-to-br from-black/10 to-gray-500/10 border border-black dark:border-white/20 rounded-xl hover:border-black dark:border-white/40 transition-smooth group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-black dark:bg-white/20 flex items-center justify-center group-hover:bg-black dark:bg-white/30 transition-smooth">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-50">Browse Templates</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-400">11 designs, country-specific</p>
              </div>
            </div>
          </Link>

          <Link
            to="/editor"
            className="block p-5 bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:border-gray-700 transition-smooth group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-[#27272A] flex items-center justify-center group-hover:bg-gray-700 transition-smooth">
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-50">Start from Scratch</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-400">Create a blank resume</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Tabs: Samples / My Resumes */}
      <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto invisible-scrollbar">
        <div className="flex gap-4 md:gap-8 whitespace-nowrap min-w-max pb-px">
          <button
            onClick={() => setActiveTab('samples')}
            className={`pb-3 text-sm font-medium border-b-2 transition-smooth ${activeTab === 'samples'
              ? 'border-black dark:border-white text-black dark:text-white'
              : 'border-transparent text-gray-700 dark:text-gray-300 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100'
              }`}
          >
            Professional Samples
          </button>
          <button
            onClick={() => setActiveTab('myresumes')}
            className={`pb-3 text-sm font-medium border-b-2 transition-smooth ${activeTab === 'myresumes'
              ? 'border-black dark:border-white text-black dark:text-white'
              : 'border-transparent text-gray-700 dark:text-gray-300 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100'
              }`}
          >
            My Resumes ({resumes.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'samples' ? (
        <ProfessionalSamples />
      ) : (
        <>
          {resumes.length === 0 ? (
            <div className="text-center py-16 space-y-6">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gray-50 dark:bg-[#27272A] flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">No resumes yet</h3>
                <p className="text-gray-700 dark:text-gray-300 dark:text-gray-400">Upload a resume or use a professional sample to get started</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  onClick={() => navigate(`/editor/${resume.id}`)}
                  className="group bg-white dark:bg-[#18181B] border border-gray-200 dark:border-gray-800 rounded-xl p-5 cursor-pointer 
                             hover:border-gray-300 dark:border-gray-700 hover:bg-white dark:bg-[#18181B] transition-smooth"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-black dark:bg-white/10 flex items-center justify-center">
                      <span className="text-white font-display font-bold text-lg">
                        {resume.fullName?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-smooth">
                      <button
                        onClick={(e) => handleExport(resume.id, resume.template, e)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:bg-[#27272A] text-gray-700 dark:text-gray-300 dark:text-gray-400 hover:text-black dark:text-white"
                        title="Export PDF"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(resume.id, e)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-700 dark:text-gray-300 dark:text-gray-400 hover:text-red-400"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-1 truncate">{resume.fullName}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-400 truncate">{resume.email || 'No email'}</p>

                  {resume.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {resume.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-[#27272A] text-gray-700 dark:text-gray-300 dark:text-gray-400">
                          {skill}
                        </span>
                      ))}
                      {resume.skills.length > 3 && (
                        <span className="text-xs px-2 py-1 text-gray-700 dark:text-gray-300 dark:text-gray-400">
                          +{resume.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">{resume.template} template</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {resume.experience?.length || 0} exp • {resume.education?.length || 0} edu
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
