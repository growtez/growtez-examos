'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sun, Moon, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Form mode state
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [error, setError] = useState(searchParams.get('error') ?? '');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
          setIsDarkMode(true);
          document.documentElement.classList.add('dark');
        } else {
          setIsDarkMode(false);
          document.documentElement.classList.remove('dark');
        }
        // Clean the ?error param from URL without triggering re-render
        if (searchParams.get('error')) {
          const url = new URL(window.location.href);
          url.searchParams.delete('error');
          window.history.replaceState({}, '', url.toString());
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleDarkMode = () => {
    try {
      const isDark = !isDarkMode;
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        setIsDarkMode(true);
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        setIsDarkMode(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getFriendlyError = (message: string): string => {
    const msg = message.toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials') || msg.includes('wrong password') || msg.includes('email not confirmed')) {
      return 'Incorrect email or password. Please double-check your credentials and try again.';
    }
    if (msg.includes('email not found') || msg.includes('user not found') || msg.includes('no user found')) {
      return 'No account found with this email address.';
    }
    if (msg.includes('too many requests') || msg.includes('rate limit')) {
      return 'Too many failed login attempts. Please wait a few minutes before trying again.';
    }
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    if (msg.includes('email address') && msg.includes('invalid')) {
      return 'Please enter a valid email address.';
    }
    if (msg.includes('password') && (msg.includes('short') || msg.includes('weak'))) {
      return 'Password must be at least 6 characters long.';
    }
    return message.charAt(0).toUpperCase() + message.slice(1);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const supabase = createClient();

    if (isRegistering) {
      // REGISTRATION FLOW
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, schoolName, fullName })
        });
        
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to register account');
        }

        // Successfully created school, now trigger Supabase Auth signup to send OTP
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'school_admin',
              full_name: fullName,
              school_id: data.school_id,
            }
          }
        });

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        // Enter OTP Verification Mode
        setIsVerifyingOtp(true);
        setLoading(false);
        return;
      } catch (err: any) {
        setError(getFriendlyError(err.message));
        setLoading(false);
        return;
      }
    } else {
      // LOGIN FLOW
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          setIsVerifyingOtp(true);
          setLoading(false);
          return;
        }
        setError(getFriendlyError(authError.message));
        setLoading(false);
        return;
      }

      // Get user role to redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Something went wrong fetching your account. Please try again.');
        setLoading(false);
        return;
      }

      const role = user.user_metadata?.role || (user.email === 'growtezexamos@gmail.com' ? 'super_admin' : 'student');

      // Redirect based on role
      const protocol = window.location.protocol;
      const host = window.location.host; 
      
      // Extract base domain by removing existing subdomains if present
      let baseDomain = host;
      if (host.startsWith('admin.')) baseDomain = host.replace('admin.', '');
      else if (host.startsWith('school.')) baseDomain = host.replace('school.', '');

      if (role === 'super_admin') {
        window.location.href = `${protocol}//admin.${baseDomain}/`;
      } else if (role === 'school_admin' || role === 'teacher') {
        window.location.href = `${protocol}//school.${baseDomain}/`;
      } else {
        // Sign the user out first (they don't belong here), then show error
        await supabase.auth.signOut();
        setError('Access denied. Students must use the ParikshaOS desktop app to take exams.');
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup'
    });

    if (verifyError) {
      setError('Invalid verification code. Please try again.');
      setLoading(false);
      return;
    }

    setSuccess('Email verified successfully! Redirecting...');
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (resendError) {
      setError(getFriendlyError(resendError.message));
      setLoading(false);
      return;
    }

    setSuccess('A new verification code has been sent to your email!');
    setLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden py-12">
      {/* Background glowing accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary-glow rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary-glow rounded-full blur-3xl -z-10" />
      </div>

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleDarkMode}
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-text-main hover:bg-surface-hover shadow-sm transition-colors cursor-pointer border-none"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} />}
        </button>
      </div>

      <div className="relative w-full max-w-md px-6 z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-4 bg-surface border border-border p-3.5 rounded-2xl inline-block shadow-sm">
            <img src="/logo.png" alt="ParikshaOS Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight uppercase">ParikshaOS</h1>
          <p className="text-text-muted mt-2 text-sm font-medium">Secure Examination Management System</p>
        </div>

        {/* Login/Register Card */}
        <div className="bg-surface/80 border border-border p-8 rounded-2xl shadow-xl backdrop-blur-md">
          {/* Card header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-text-main uppercase tracking-wider">
              {isVerifyingOtp 
                ? 'Verify Email' 
                : isRegistering ? 'Create School Account' : 'Administrator Sign In'}
            </h2>
            <p className="text-text-muted text-xs mt-1">
              {isVerifyingOtp
                ? (
                  <span>
                    Enter the code sent to <strong className="text-accent-primary">{email}</strong>.
                  </span>
                )
                : isRegistering 
                  ? 'Register your institute to start managing exams' 
                  : 'Provide your credentials to access the console'}
            </p>
          </div>

          {isVerifyingOtp ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label htmlFor="otpCode" className="block text-[11px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">
                  Verification Code
                </label>
                <input
                  id="otpCode"
                  type="text"
                  maxLength={8}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full px-4 py-4 bg-surface-hover border border-accent-primary rounded-xl text-text-main placeholder-text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent-primary-glow transition-all text-center text-2xl tracking-[0.5em] font-mono shadow-sm"
                  placeholder="--------"
                />
              </div>
              
              {error && (
                <div className="border border-red-500/20 bg-red-500/10 p-3.5 rounded-xl text-red-500 text-xs font-semibold">
                  ⚠ {error}
                </div>
              )}
              
              {success && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <div className="mt-0.5">
                    <svg className="w-5 h-5 text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-green-400 font-bold text-[13px] tracking-wide">Action Successful</h4>
                    <p className="text-green-500/90 text-xs mt-0.5 font-medium leading-relaxed">{success}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3 px-4 bg-accent-primary text-white font-bold uppercase tracking-wider rounded-xl hover:bg-accent-primary/90 focus:outline-none focus:ring-2 focus:ring-accent-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-[10px] text-text-muted hover:text-accent-primary transition-colors font-bold tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Didn't receive the code? Resend
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-5">
              {isRegistering && (
              <>
                <div>
                  <label htmlFor="schoolName" className="block text-[11px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">
                    Institute / School Name
                  </label>
                  <input
                    id="schoolName"
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-text-main placeholder-text-muted/40 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary-glow transition-all text-sm"
                    placeholder="E.g. Pariksha Academy"
                  />
                </div>
                <div>
                  <label htmlFor="fullName" className="block text-[11px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">
                    Admin Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-text-main placeholder-text-muted/40 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary-glow transition-all text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-[11px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-text-main placeholder-text-muted/40 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary-glow transition-all text-sm"
                placeholder="admin@school.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Password
                </label>
                {!isRegistering && (
                  <button type="button" onClick={() => window.location.href = '/forgot-password'} className="text-[10px] font-bold text-accent-primary hover:text-accent-primary/80 transition-colors uppercase tracking-wider">
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-11 bg-surface-hover border border-border rounded-xl text-text-main placeholder-text-muted/40 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary-glow transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-primary transition-colors outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="border border-red-500/20 bg-red-500/10 p-3.5 rounded-xl text-red-500 text-xs font-semibold">
                ⚠ {error}
              </div>
            )}
            
            {success && (
              <div className="border border-green-500/20 bg-green-500/10 p-3.5 rounded-xl text-green-500 text-xs font-semibold">
                ✓ {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-accent-primary text-white font-bold uppercase tracking-wider rounded-xl hover:bg-accent-primary/90 focus:outline-none focus:ring-2 focus:ring-accent-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isRegistering ? 'Creating Account...' : 'Signing in...'}
                </span>
              ) : (
                isRegistering ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>
          )}

          {/* Toggle between login and register */}
          <div className="mt-6 text-center border-t border-border pt-4">
            <button
              type="button"
              onClick={() => {
                if (isVerifyingOtp) {
                  setIsVerifyingOtp(false);
                } else {
                  setIsRegistering(!isRegistering);
                }
                setError('');
                setSuccess('');
              }}
              className="text-xs text-text-muted hover:text-accent-primary transition-colors font-semibold tracking-wide uppercase"
            >
              {isVerifyingOtp 
                ? 'Back to login'
                : isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        <p className="text-center text-text-muted/60 text-[10px] mt-8 uppercase tracking-widest">
          © {new Date().getFullYear()} Growtez ParikshaOS · All rights reserved
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
