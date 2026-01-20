import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import ResumeUpload from '../components/ResumeUpload';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const getFirstName = (email) => {
    if (!email) return 'User';
    const namePart = email.split('@')[0];
    const firstMatch = namePart.match(/[a-zA-Z]+/);
    const name = firstMatch ? firstMatch[0] : 'User';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/resumes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/resumes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setResumes(resumes.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black overflow-x-hidden touch-pan-y">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12">
        {/* Dashboard Header */}
        <div className="mb-6 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2">
            Build Resume
          </h1>
          <p className="text-sm md:text-lg text-gray-600 dark:text-gray-400">
            Welcome back, {getFirstName(user?.email)}! Manage your resumes and applications.
          </p>
        </div>

        {/* My Resumes Section */}
        <div className="mb-12 md:mb-16 overflow-hidden">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-4 mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-2xl md:text-3xl">📄</span> My Resumes
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="w-12 h-12 sm:w-auto sm:px-6 sm:py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all duration-300 shadow-sm flex items-center justify-center gap-2 flex-shrink-0"
                title="Upload Resume"
              >
                <span className="text-xl">📤</span>
                <span className="hidden sm:inline">Upload Resume</span>
              </button>
              <button
                onClick={() => navigate('/editor')}
                className="w-12 h-12 sm:w-auto sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 flex-shrink-0"
                title="Create New Resume"
              >
                <span className="text-2xl font-light">+</span>
                <span className="hidden sm:inline">Create New Resume</span>
              </button>
            </div>
          </div>

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-black w-full max-w-xl rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Upload Existing Resume
                  </h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
                <ResumeUpload />
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900/50 border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No resumes yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first professional resume in minutes
              </p>
              <button
                onClick={() => navigate('/editor')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Get Started
              </button>
            </div>
          ) : (
            <div className="relative w-full overflow-hidden">
              <div className="flex overflow-x-auto pb-8 gap-6 snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex-shrink-0 w-[80vw] sm:w-[320px] md:w-auto md:flex-1 md:min-w-0 snap-center group bg-white dark:bg-zinc-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-5 md:p-6 hover:shadow-2xl hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 border-b-4 border-b-transparent hover:border-b-blue-500"
                  >
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="flex-1">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                          {resume.fullName || 'Untitled Resume'}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {resume.jobTitle || resume.experience?.[0]?.position || 'No title'}
                        </p>
                      </div>
                      <div className="w-10 h-10 md:w-12 md:h-12 border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl flex items-center justify-center text-xl md:text-2xl">
                        📄
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <span>🎨 {resume.template || 'Modern'}</span>
                      <span>•</span>
                      <span>📅 {new Date(resume.updatedAt || resume.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/editor/${resume.id}`)}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-1"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(resume.id)}
                        className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                {/* Extra spacer for scroll padding on mobile */}
                <div className="flex-shrink-0 w-4 md:hidden" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

