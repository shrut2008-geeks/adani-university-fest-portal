import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogIn, 
  UserPlus, 
  AlertCircle,
  KeyRound,
  Mail,
  Sparkles,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

export const LoginPage = () => {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordInputRef = useRef(null);

  // If already authenticated, redirect to home
  if (isAuthenticated) {
    navigate('/');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, role);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentDemo = () => {
    setEmail('student@adani.ac.in');
    setPassword('adani123');
    setMode('login');
    setError('');
  };

  const handlePrivilegedDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('');
    setMode('login');
    setError('');
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 0);
  };

  const inputClass = "w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2";
  const inputStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div
        className="max-w-md w-full space-y-6 p-8 rounded-3xl relative overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(30,27,46,0.10)',
        }}
      >
        {/* Brand & Heading */}
        <div className="text-center space-y-2 relative z-10">
          <div
            className="inline-flex p-3 rounded-2xl shadow-sm"
            style={{ background: 'var(--hero-bg)', border: '1px solid var(--border)' }}
          >
            <img src="/logo.png" alt="Adani University Logo" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            {mode === 'login' ? 'Sign in to Portal' : 'Create Student Account'}
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Club &amp; Event Portal
          </p>
        </div>

        {/* Quick Demo Credentials - DEV only */}
        {import.meta.env.DEV && (
          <div
            className="p-4 rounded-2xl space-y-2.5 relative z-10"
            style={{ background: 'var(--hero-bg)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
              Try a demo account
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handlePrivilegedDemo('admin@adani.ac.in')}
                className="py-1.5 px-2 rounded-lg font-semibold transition-all text-center border hover:opacity-90"
                style={{ background: 'rgba(107,27,114,0.06)', color: 'var(--primary)', borderColor: 'rgba(107,27,114,0.2)' }}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handlePrivilegedDemo('clubadmin@adani.ac.in')}
                className="py-1.5 px-2 rounded-lg font-semibold transition-all text-center border hover:opacity-90"
                style={{ background: 'rgba(107,27,114,0.06)', color: 'var(--primary)', borderColor: 'rgba(107,27,114,0.2)' }}
              >
                Club Admin
              </button>
              <button
                type="button"
                onClick={handleStudentDemo}
                className="py-1.5 px-2 rounded-lg font-semibold transition-all text-center border hover:opacity-90"
                style={{ background: 'rgba(107,27,114,0.06)', color: 'var(--primary)', borderColor: 'rgba(107,27,114,0.2)' }}
              >
                Student
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>University Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@adani.ac.in"
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <Eye className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                )}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>Register As</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm focus:outline-none"
                style={inputStyle}
              >
                <option value="student">Student</option>
                <option value="club_admin">Club Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-sm transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 btn-press hover:opacity-95"
            style={{ background: 'var(--primary)' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : mode === 'login' ? (
              <><LogIn className="w-4 h-4" /> Sign In</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Create Account</>
            )}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="text-center pt-2 relative z-10" style={{ borderTop: '1px solid var(--border)' }}>
          {mode === 'login' ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className="font-bold hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Register as Student
              </button>
            </p>
          ) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="font-bold hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Sign in to existing account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
