import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authApi from '../api/authApi';

export default function Login() {
  const [step, setStep] = useState('email'); // email | otp
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting to send OTP to:', email);
      const response = await authApi.sendOtp(email);
      console.log('✅ OTP sent successfully:', response);
      setMessage(response.message);
      setStep('otp');
    } catch (err) {
      console.error('❌ OTP send failed:', err);

      let errorMessage = 'Failed to send OTP';

      if (err.message?.includes('Network Error') || err.message?.includes('timeout')) {
        errorMessage = '🌐 Network Error: Cannot connect to server. Check your internet connection.';
      } else if (err.response) {
        errorMessage = `Server Error (${err.response.status}): ${err.response.data?.message || err.response.statusText}`;
      } else if (err.request) {
        errorMessage = '📡 No response from server. The backend might be down or unreachable.';
      } else {
        errorMessage = `Error: ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.verifyOtp(email, otp);
      login(response.token, { id: response.userId, email: response.email });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await authApi.sendOtp(email);
      setMessage('New OTP sent!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-black font-body">
      {/* Dynamic Background Blurs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[100px] opacity-50 dark:opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-[100px] opacity-50 dark:opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md p-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8 transform transition-all duration-500 ease-out">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-black dark:from-white dark:to-gray-200 flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
              <svg className="w-6 h-6 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-gray-900 dark:text-white">
              Decisive<span className="text-blue-600 dark:text-blue-400">ML</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to build your professional future</p>
        </div>

        {/* Glass Card */}
        <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-8 shadow-2xl ring-1 ring-black/5">
          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-6 animate-slideDown">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@work.com"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-black/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm font-medium text-base"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-pulse">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Continue with Email'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-slideDown">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4 ring-8 ring-blue-50/50 dark:ring-blue-900/10">
                  <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Check your mail</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">We sent a code to <span className="text-gray-900 dark:text-white font-medium">{email}</span></p>
              </div>

              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 bg-gray-50 dark:bg-black/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder-gray-300 dark:placeholder-gray-700 text-gray-900 dark:text-white"
                  maxLength={6}
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              {message && (
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm text-center">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Verify Code'
                )}
              </button>

              <div className="flex items-center justify-between text-xs sm:text-sm pt-2">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  ← Go back
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-8 text-xs text-gray-400 dark:text-gray-500">
          SECURE LOGIN • NO PASSWORD REQUIRED
        </p>
      </div>
    </div>
  );
}
