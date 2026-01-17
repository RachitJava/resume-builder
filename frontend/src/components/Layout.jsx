import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink-800/50 backdrop-blur-sm bg-ink-950/80 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-smooth">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-display font-semibold text-lg text-ink-100">ResumeForge</span>
          </Link>
          
          {!isLoginPage && (
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <Link 
                    to="/templates" 
                    className={`text-sm font-medium transition-smooth ${
                      location.pathname === '/templates' 
                        ? 'text-accent' 
                        : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    Templates
                  </Link>
                  <Link 
                    to="/job-match" 
                    className={`text-sm font-medium transition-smooth flex items-center gap-1 ${
                      location.pathname === '/job-match' 
                        ? 'text-accent' 
                        : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    <span className="text-xs">🎯</span> Job Match
                  </Link>
                  <Link 
                    to="/" 
                    className={`text-sm font-medium transition-smooth ${
                      location.pathname === '/' 
                        ? 'text-accent' 
                        : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    My Resumes
                  </Link>
                  <Link to="/editor" className="btn btn-primary text-sm">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Resume
                    </span>
                  </Link>
                  
                  <div className="h-6 w-px bg-ink-700"></div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-ink-400">{user.email}</span>
                    <button
                      onClick={logout}
                      className="text-sm text-ink-500 hover:text-ink-300 transition-smooth"
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
