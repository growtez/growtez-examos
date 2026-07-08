'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sun, Moon } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(searchParams.get('error') ?? '');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    if (msg.includes('signup') || msg.includes('sign up') || msg.includes('not allowed')) {
      return 'Account creation is not allowed. Please contact your administrator.';
    }
    // fallback: return the original message but capitalise first letter
    return message.charAt(0).toUpperCase() + message.slice(1);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      const msg = encodeURIComponent(getFriendlyError(authError.message));
      router.replace(`/login?error=${msg}`);
      setLoading(false);
      return;
    }

    // Get user role to redirect
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const msg = encodeURIComponent('Something went wrong fetching your account. Please try again.');
      router.replace(`/login?error=${msg}`);
      setLoading(false);
      return;
    }

    const role = user.user_metadata?.role || (user.email === 'growtezexamos@gmail.com' ? 'super_admin' : 'student');

    // Redirect based on role
    if (role === 'super_admin') {
      window.location.href = '/';
    } else if (role === 'school_admin' || role === 'teacher') {
      window.location.href = '/';
    } else {
      // Sign the user out first (they don't belong here), then show error
      await supabase.auth.signOut();
      const msg = encodeURIComponent('Access denied. Students must use the ParikshaOS desktop app to take exams.');
      router.replace(`/login?error=${msg}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden">
      {/* Background glowing accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary-glow rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary-glow rounded-full blur-3xl -z-10" />
        <div className="absolute top-0 left-0 w-full h-1 bg-accent-primary" />
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

        {/* Login Card */}
        <div className="bg-surface/80 border border-border p-8 rounded-2xl shadow-xl backdrop-blur-md">
          {/* Card header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-text-main uppercase tracking-wider">Administrator Sign In</h2>
            <p className="text-text-muted text-xs mt-1">Provide your credentials to access the console</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
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
              <label htmlFor="password" className="block text-[11px] font-bold text-text-muted mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-text-main placeholder-text-muted/40 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary-glow transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="border border-red-500/20 bg-red-500/10 p-3.5 rounded-xl text-red-500 text-xs font-semibold">
                ⚠ {error}
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
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
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
