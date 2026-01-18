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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isLoginPage = location.pathname === '/login';

  const NavLinks = () => (
    <>
      <Link
        to="/templates"
        onClick={() => setIsMenuOpen(false)}
        className={`text-sm font-medium transition-smooth ${location.pathname === '/templates'
          ? 'text-gray-900 dark:text-gray-50'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
      >
        Templates
      </Link>
      <Link
        to="/job-match"
        onClick={() => setIsMenuOpen(false)}
        className={`text-sm font-medium transition-smooth flex items-center gap-1 ${location.pathname === '/job-match'
          ? 'text-gray-900 dark:text-gray-50'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
      >
        <span className="text-xs">🎯</span> Job Match
      </Link>
      <Link
        to="/"
        onClick={() => setIsMenuOpen(false)}
        className={`text-sm font-medium transition-smooth ${location.pathname === '/'
          ? 'text-gray-900 dark:text-gray-50'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
      >
        My Resumes
      </Link>
      {user?.isAdmin && (
        <Link
          to="/admin"
          onClick={() => setIsMenuOpen(false)}
          className={`text-sm font-medium transition-smooth flex items-center gap-1 ${location.pathname === '/admin'
            ? 'text-gray-900 dark:text-gray-50'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
        >
          <span className="text-xs">⚙️</span> Admin
        </Link>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#18181B] sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-gray-900 to-black dark:from-gray-50 dark:to-white flex items-center justify-center group-hover:scale-105 transition-all shadow-lg">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-display font-bold text-lg md:text-xl tracking-tight text-gray-900 dark:text-gray-50">Decisive<span className="text-blue-600 dark:text-blue-400">ML</span></span>
          </Link>

          {!isLoginPage && (
            <div className="flex items-center gap-2 md:gap-4">
              {user && (
                <>
                  {/* Desktop Nav */}
                  <div className="hidden lg:flex items-center gap-6 mr-4">
                    <NavLinks />
                  </div>

                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 hidden lg:block mr-2"></div>

                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-[#27272A] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3F3F46] transition-colors border border-gray-200 dark:border-gray-800"
                    title="Toggle Theme"
                  >
                    {isDark ? '☀️' : '🌙'}
                  </button>

                  <Link to="/editor" className="btn btn-primary text-xs md:text-sm px-3 md:px-4">
                    <span className="flex items-center gap-1 md:gap-2">
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="hidden sm:inline">New Resume</span>
                      <span className="sm:hidden">New</span>
                    </span>
                  </Link>

                  {/* Desktop User Info */}
                  <div className="hidden md:flex items-center gap-3 ml-2 pl-4 border-l border-gray-200 dark:border-gray-800">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[120px] lg:max-w-[180px]">{user.email}</span>
                    <button
                      onClick={logout}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-smooth font-medium"
                    >
                      Sign out
                    </button>
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {isMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      )}
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}
        </nav>

        {/* Mobile Sidebar/Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-16 inset-x-0 bg-white dark:bg-[#18181B] border-b border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden animate-slideDown z-40">
            <div className="flex flex-col p-4 space-y-4">
              <NavLinks />
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 mb-2">{user?.email}</p>
                <button
                  onClick={logout}
                  className="w-full text-left text-sm font-medium text-red-500 py-2"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex-1">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#18181B] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gray-900 dark:bg-gray-50 flex items-center justify-center">
              <svg className="w-3 h-3 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-50">DecisiveML</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Developed by <span className="font-medium text-gray-900 dark:text-gray-200">Rachit</span>
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-gray-400 dark:text-gray-500">© 2026 DecisiveML. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
