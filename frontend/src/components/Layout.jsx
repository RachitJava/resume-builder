import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#18181B] sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gray-900 dark:bg-gray-50 flex items-center justify-center group-hover:bg-gray-800 dark:group-hover:bg-gray-200 transition-smooth">
              <svg className="w-5 h-5 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-display font-semibold text-lg text-gray-900 dark:text-gray-50">ResumeForge</span>
          </Link>

          {!isLoginPage && (
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <Link
                    to="/templates"
                    className={`text-sm font-medium transition-smooth ${location.pathname === '/templates'
                      ? 'text-gray-900 dark:text-gray-50'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    Templates
                  </Link>
                  <Link
                    to="/job-match"
                    className={`text-sm font-medium transition-smooth flex items-center gap-1 ${location.pathname === '/job-match'
                      ? 'text-gray-900 dark:text-gray-50'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    <span className="text-xs">🎯</span> Job Match
                  </Link>
                  <Link
                    to="/"
                    className={`text-sm font-medium transition-smooth ${location.pathname === '/'
                      ? 'text-gray-900 dark:text-gray-50'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    My Resumes
                  </Link>

                  {/* Admin Link - Only visible for admin users */}
                  {user.isAdmin && (
                    <Link
                      to="/admin"
                      className={`text-sm font-medium transition-smooth flex items-center gap-1 ${location.pathname === '/admin'
                        ? 'text-gray-900 dark:text-gray-50'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      title="Admin Dashboard"
                    >
                      <span className="text-lg">⚙️</span>
                    </Link>
                  )}

                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 hidden md:block"></div>

                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-[#27272A] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3F3F46] transition-colors border border-gray-200 dark:border-gray-800"
                    title="Toggle Theme"
                  >
                    {isDark ? '☀️' : '🌙'}
                  </button>

                  <Link to="/editor" className="btn btn-primary text-sm">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Resume
                    </span>
                  </Link>

                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px]">{user.email}</span>
                    <button
                      onClick={logout}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-smooth font-medium"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {children || <Outlet />}
      </main>
    </div>
  );
}
