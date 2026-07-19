'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { createClient as createSupabaseDirectClient } from '@supabase/supabase-js';
import { Sun, Moon } from 'lucide-react';

// Create a standalone client with implicit flow — no PKCE, no cookies needed
function getResetClient() {
  return createSupabaseDirectClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: 'supabase-reset-session',
      }
    }
  );
}

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const supabaseRef = useRef<ReturnType<typeof getResetClient> | null>(null);

  useEffect(() => {
    // Initialize the Supabase client — it will auto-detect the hash fragment
    const supabase = getResetClient();
    supabaseRef.current = supabase;

    // Listen for auth state changes (the client will fire PASSWORD_RECOVERY when it picks up the hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true);
        setInitializing(false);
        // Clean the URL hash
        window.history.replaceState(null, '', '/reset-password');
      }
    });

    // Also check if there's already a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setInitializing(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    const supabase = supabaseRef.current || getResetClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess('Password updated successfully! Redirecting...');
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
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

        {/* Reset Password Card */}
        <div className="bg-surface/80 border border-border p-8 rounded-2xl shadow-xl backdrop-blur-md">
          {/* Card header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-text-main uppercase tracking-wider">
              Set New Password
            </h2>
            <p className="text-text-muted text-xs mt-1">
              Enter your new password below
            </p>
          </div>

          {initializing ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
              <span className="ml-3 text-text-muted text-sm">Verifying your reset link...</span>
            </div>
          ) : !sessionReady ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/5 border border-red-500/20">
                <div className="mt-0.5">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
                </div>
                <div>
                  <h4 className="text-red-400 font-bold text-[13px] tracking-wide">Link Expired or Invalid</h4>
                  <p className="text-red-500/90 text-xs mt-0.5 font-medium leading-relaxed">Your password reset link has expired or was already used. Please request a new one.</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/forgot-password'}
                className="w-full py-3 px-4 bg-accent-primary text-white font-bold uppercase tracking-wider rounded-xl hover:bg-accent-primary/90 focus:outline-none focus:ring-2 focus:ring-accent-primary-glow transition-all text-sm shadow-sm"
              >
                Request New Reset Link
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-[11px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-text-main placeholder-text-muted/40 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary-glow transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-[11px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-text-main placeholder-text-muted/40 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary-glow transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/5 border border-red-500/20">
                  <div className="mt-0.5">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-red-400 font-bold text-[13px] tracking-wide">Error</h4>
                    <p className="text-red-500/90 text-xs mt-0.5 font-medium leading-relaxed">{error}</p>
                  </div>
                </div>
              )}
              
              {success && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <div className="mt-0.5">
                    <svg className="w-5 h-5 text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <h4 className="text-green-400 font-bold text-[13px] tracking-wide">Password Updated</h4>
                    <p className="text-green-500/90 text-xs mt-0.5 font-medium leading-relaxed">{success}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-accent-primary text-white font-bold uppercase tracking-wider rounded-xl hover:bg-accent-primary/90 focus:outline-none focus:ring-2 focus:ring-accent-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-text-muted/60 text-[10px] mt-8 uppercase tracking-widest">
          © {new Date().getFullYear()} Growtez ParikshaOS · All rights reserved
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
