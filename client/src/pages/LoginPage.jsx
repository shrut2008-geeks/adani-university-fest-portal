import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogIn, 
  UserPlus, 
  AlertCircle,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Ticket,
  Sparkles,
  RefreshCw,
  X,
  Building2,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

export const LoginPage = () => {
  const { user, login, register, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [role, setRole] = useState('student');

  // Validation & feedback state
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [ssoMessage, setSsoMessage] = useState('');

  const passwordInputRef = useRef(null);

  // If already authenticated, show switch account option or navigate
  if (isAuthenticated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-[#F8F5FA] via-[#F2EBF5] to-[#EAE0F0] p-4 relative overflow-hidden">
        {/* Ambient Glassy Glow Orbs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#6B1B6E]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl shadow-purple-950/10 border border-white/70 text-center space-y-4 max-w-md w-full relative z-10 ring-1 ring-black/5">
          <div className="inline-flex p-3 rounded-2xl bg-purple-50/80 border border-purple-100/80 shadow-inner">
            <img src="/logo.png" alt="Adani University Logo" className="w-12 h-12 object-contain" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Already Signed In</h2>
          <p className="text-xs text-gray-600">
            You are currently signed in as <strong className="text-[#6B1B6E]">{user?.email}</strong> ({user?.role}).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95 transition-all"
              style={{ background: '#6B1B6E' }}
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => logout()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-700 bg-white/70 hover:bg-white border border-gray-200/80 transition-colors shadow-2xs"
            >
              Sign In as Another Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('au_fest_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Form validation helper
  const validateForm = () => {
    const errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Please enter your university email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email format (e.g. name@adani.ac.in).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (mode === 'register' && password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, role);
      }

      // Handle "Remember me"
      if (rememberMe) {
        localStorage.setItem('au_fest_remembered_email', email.trim());
      } else {
        localStorage.removeItem('au_fest_remembered_email');
      }

      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid university credentials. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // University SSO Simulation / Helper
  const handleUniversitySso = () => {
    setError('');
    setSsoMessage('Connecting to Adani University Single Sign-On (SSO)... Pre-filling student account for demo.');
    setEmail('student@adani.ac.in');
    setPassword('adani123');
    setFieldErrors({});
    setTimeout(() => {
      setSsoMessage('');
    }, 4000);
  };

  // Quick Demo Account Helpers for testing
  const handleDemoSelect = (demoEmail, demoPass = '') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setMode('login');
    setError('');
    setFieldErrors({});
    if (!demoPass) {
      setTimeout(() => passwordInputRef.current?.focus(), 50);
    }
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] max-h-[100dvh] flex flex-col bg-gradient-to-br from-[#F8F5FA] via-[#F2EBF5] to-[#EAE0F0] text-gray-900 overflow-y-auto lg:overflow-hidden select-text relative">
      
      {/* ─────────────────────────────────────────────────────────────────────────────
          AMBIENT GLASSY GLOW ORBS & BACKDROP ACCENTS
         ───────────────────────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#6B1B6E]/15 blur-3xl" />
        <div className="absolute top-1/4 -right-24 w-[28rem] h-[28rem] rounded-full bg-purple-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 w-[30rem] h-[30rem] rounded-full bg-[#802283]/15 blur-3xl" />
        <div className="absolute top-2/3 right-1/3 w-72 h-72 rounded-full bg-pink-300/15 blur-2xl" />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          1. HEADER (Fixed height: 64px, Glassmorphism, Logo on left, "Back to adaniuni.ac.in" on right,
             no navigation links)
         ───────────────────────────────────────────────────────────────────────────── */}
      <header className="h-16 shrink-0 bg-white/70 backdrop-blur-md border-b border-white/60 px-4 sm:px-8 flex items-center justify-between z-20 shadow-xs relative">
        {/* Left: Adani University Logo & Portal Name */}
        <Link 
          to="/" 
          className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1B6E] rounded-xl"
        >
          <img 
            src="/logo.png" 
            alt="Adani University Logo" 
            className="h-10 w-10 sm:h-11 sm:w-11 object-contain shrink-0" 
          />
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#6B1B6E]">
                adani
              </span>
              <span className="text-sm sm:text-base font-semibold text-gray-800">
                University
              </span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 -mt-1">
              Club &amp; Event Portal
            </span>
          </div>
        </Link>

        {/* Right: Back to adaniuni.ac.in external link */}
        <a
          href="https://www.adaniuni.ac.in/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-[#6B1B6E] hover:bg-white/60 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B1B6E]"
        >
          <span>Back to adaniuni.ac.in</span>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#6B1B6E]" />
        </a>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA (Centered vertically and horizontally, Desktop Split, Glassy Card)
         ───────────────────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-y-auto lg:overflow-hidden relative z-10">
        <div className="w-full max-w-5xl bg-white/75 backdrop-blur-xl rounded-3xl shadow-2xl shadow-purple-950/10 border border-white/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 my-auto ring-1 ring-black/5">
          
          {/* ─────────────────────────────────────────────────────────────────────────
              DESKTOP LEFT COLUMN: Portal Branding & Fest Showcase (Spans 5 cols)
             ───────────────────────────────────────────────────────────────────────── */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#501353]/95 via-[#6B1B6E]/95 to-[#802283]/95 backdrop-blur-md text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden border-r border-white/10">
            {/* Background decorative circles */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/15 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-purple-300/20 blur-3xl pointer-events-none" />

            {/* Top Badge */}
            <div className="relative z-10 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-purple-100 border border-white/25 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Campus Fest &amp; Activities
              </span>

              <h2 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Adani University <br />
                <span className="text-purple-200">Club &amp; Event Portal</span>
              </h2>

              <p className="text-xs xl:text-sm text-purple-100/90 leading-relaxed">
                Your official gateway to technical symposiums, robotic challenges, cultural showcases, and recognized student societies.
              </p>
            </div>

            {/* Center Highlights */}
            <div className="relative z-10 space-y-3.5 my-6">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                <div className="p-2 rounded-xl bg-white/15 shrink-0 text-purple-200">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Live Event Schedule</h4>
                  <p className="text-[11px] text-purple-200 leading-snug">Venue capacity tracking and instant seat reservation.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                <div className="p-2 rounded-xl bg-white/15 shrink-0 text-purple-200">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Student Societies</h4>
                  <p className="text-[11px] text-purple-200 leading-snug">Flagship fest chapters, robotics, AI, and arts clubs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                <div className="p-2 rounded-xl bg-white/15 shrink-0 text-purple-200">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Digital Event Passes</h4>
                  <p className="text-[11px] text-purple-200 leading-snug">Present pass ID at campus venue for check-in verification.</p>
                </div>
              </div>
            </div>

            {/* Bottom Campus Note */}
            <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-purple-200">
              <span>Shantigram, SG Highway</span>
              <span className="font-semibold text-white">Ahmedabad, Gujarat</span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────────
              RIGHT COLUMN: Clean Sign-In Form (Spans 7 cols, Glassy Frosted Backing)
             ───────────────────────────────────────────────────────────────────────── */}
          <div className="col-span-1 lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white/65 lg:bg-white/70 backdrop-blur-xl overflow-y-auto">
            <div className="max-w-md w-full mx-auto space-y-5">
              
              {/* Form Heading & Subtitle */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {mode === 'login' ? 'Welcome back' : 'Create an account'}
                </h1>
                <p className="text-sm font-medium text-gray-600 mt-1">
                  {mode === 'login' 
                    ? 'Sign in to the Club & Event Portal' 
                    : 'Join campus clubs and register for fest events'}
                </p>
              </div>

              {/* Optional University SSO Button */}
              {mode === 'login' && (
                <div>
                  <button
                    type="button"
                    onClick={handleUniversitySso}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-gray-200/90 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-[#6B1B6E] text-gray-700 hover:text-[#6B1B6E] text-xs sm:text-sm font-semibold transition-all shadow-xs group"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#6B1B6E]" />
                    <span>Sign in with University SSO</span>
                  </button>

                  {/* SSO feedback notification */}
                  {ssoMessage && (
                    <div className="mt-2 p-2 rounded-lg bg-purple-50/90 backdrop-blur-xs border border-purple-200 text-xs text-[#6B1B6E] font-medium flex items-center gap-1.5 animate-fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{ssoMessage}</span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200/80" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/80 backdrop-blur-md px-3 font-semibold text-gray-500 tracking-wider">
                        or continue with email
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dismissible Error Banner */}
              {error && (
                <div 
                  className="p-3.5 rounded-xl bg-rose-50/90 backdrop-blur-sm border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-2 shadow-xs animate-fade-in"
                  role="alert"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError('')}
                    className="text-rose-500 hover:text-rose-700 p-0.5 rounded-md transition-colors"
                    aria-label="Dismiss error banner"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Sign In / Register Form */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                
                {/* Email Field */}
                <div>
                  <label 
                    htmlFor="email"
                    className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5"
                  >
                    University Email
                  </label>
                  <div className="relative">
                    <Mail 
                      className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
                    />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                      }}
                      placeholder="name@adani.ac.in"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm bg-white/80 backdrop-blur-sm border text-gray-900 placeholder:text-gray-400 font-medium focus:bg-white focus:outline-none transition-all shadow-xs ${
                        fieldErrors.email 
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200' 
                          : 'border-gray-200/90 focus:border-[#6B1B6E] focus:ring-2 focus:ring-[#6B1B6E]/20'
                      }`}
                    />
                  </div>
                  {/* Inline validation message */}
                  {fieldErrors.email && (
                    <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1 animate-fade-in">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.email}</span>
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label 
                    htmlFor="password"
                    className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound 
                      className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
                    />
                    <input
                      id="password"
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                      }}
                      placeholder="Enter your password"
                      className={`w-full pl-10 pr-11 py-2.5 rounded-xl text-sm bg-white/80 backdrop-blur-sm border text-gray-900 placeholder:text-gray-400 font-medium focus:bg-white focus:outline-none transition-all shadow-xs ${
                        fieldErrors.password 
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200' 
                          : 'border-gray-200/90 focus:border-[#6B1B6E] focus:ring-2 focus:ring-[#6B1B6E]/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-1 focus:ring-[#6B1B6E] rounded-md"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {/* Inline validation message */}
                  {fieldErrors.password && (
                    <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1 animate-fade-in">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{fieldErrors.password}</span>
                    </p>
                  )}
                </div>

                {/* Role selection if Registering */}
                {mode === 'register' && (
                  <div>
                    <label 
                      htmlFor="role"
                      className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1.5"
                    >
                      Account Type
                    </label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/80 backdrop-blur-sm border border-gray-200/90 text-gray-900 focus:bg-white focus:outline-none focus:border-[#6B1B6E] focus:ring-2 focus:ring-[#6B1B6E]/20 shadow-xs"
                    >
                      <option value="student">Student Account (Default)</option>
                      <option value="club_admin">Club Head / Organizer</option>
                    </select>
                  </div>
                )}

                {/* "Remember me" and "Forgot password?" row */}
                {mode === 'login' && (
                  <div className="flex items-center justify-between pt-0.5 text-xs sm:text-sm">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="remember-me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded text-[#6B1B6E] focus:ring-[#6B1B6E] border-gray-300 accent-[#6B1B6E] cursor-pointer"
                      />
                      <span className="font-medium text-gray-700">Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="font-semibold text-[#6B1B6E] hover:text-[#501353] hover:underline transition-colors focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Primary Purple Sign In Button with loading state */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md shadow-[#6B1B6E]/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B1B6E]"
                  style={{ background: '#6B1B6E' }}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                    </>
                  ) : mode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>

              {/* ─────────────────────────────────────────────────────────────────
                  3. REGISTRATION SECTION
                  Clear secondary outlined button + Note for faculty/club heads
                 ───────────────────────────────────────────────────────────────── */}
              <div className="pt-4 border-t border-gray-200/60 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError('');
                    setFieldErrors({});
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border-2 border-[#6B1B6E] bg-white/50 backdrop-blur-sm text-[#6B1B6E] hover:bg-[#6B1B6E]/10 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#6B1B6E] shadow-xs"
                >
                  {mode === 'login' ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>New here? Create an account</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Already have an account? Sign in</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-gray-500 text-center leading-relaxed font-medium">
                  Faculty and club heads: contact the admin office for access
                </p>
              </div>

              {/* Discreet Demo Account Helper Chips (DEV/Testing convenience) */}
              <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                <span className="font-semibold text-gray-400">Demo Fill:</span>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('student@adani.ac.in', 'adani123')}
                  className="px-2 py-0.5 rounded-md bg-white/70 backdrop-blur-sm hover:bg-white text-gray-700 font-semibold border border-gray-200/70 transition-colors shadow-2xs"
                >
                  Student
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('clubadmin@adani.ac.in')}
                  className="px-2 py-0.5 rounded-md bg-white/70 backdrop-blur-sm hover:bg-white text-gray-700 font-semibold border border-gray-200/70 transition-colors shadow-2xs"
                >
                  Club Admin
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('admin@adani.ac.in')}
                  className="px-2 py-0.5 rounded-md bg-white/70 backdrop-blur-sm hover:bg-white text-gray-700 font-semibold border border-gray-200/70 transition-colors shadow-2xs"
                >
                  Admin
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────────────────
          FORGOT PASSWORD MODAL DIALOG (Glassy backdrop & card)
         ───────────────────────────────────────────────────────────────────────── */}
      {showForgotModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#6B1B6E]">
              <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100/80">
                <HelpCircle className="w-5 h-5 text-[#6B1B6E]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Forgot your password?</h3>
                <p className="text-xs text-gray-500">Adani University IT Helpdesk</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Adani University accounts are managed through the central campus directory. To reset your portal password or reactivate your account, please contact IT Services:
            </p>

            <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-200/80 space-y-1.5 text-xs text-gray-700 shadow-2xs">
              <p><strong>Email:</strong> support@adaniuni.ac.in</p>
              <p><strong>Office:</strong> Academic Block A, Room 104</p>
              <p><strong>Hours:</strong> Mon – Fri, 9:00 AM – 5:00 PM</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:opacity-95"
                style={{ background: '#6B1B6E' }}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
