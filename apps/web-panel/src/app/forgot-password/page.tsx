'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ForgotPasswordContent() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Use implicit flow to completely bypass PKCE code_verifier cookie issues
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          flowType: 'implicit',
        }
      }
    );

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess('Password reset link sent! Check your email.');
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

        {/* Forgot Password Card */}
        <div className="bg-surface/80 border border-border p-8 rounded-2xl shadow-xl backdrop-blur-md">
          {/* Card header */}
          <div className="mb-6 flex items-center gap-3">
            <Link href="/login" className="text-text-muted hover:text-accent-primary transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h2 className="text-xl font-bold text-text-main uppercase tracking-wider">
                Reset Password
              </h2>
              <p className="text-text-muted text-xs mt-1">
                Enter your email to receive a reset link
              </p>
            </div>
          </div>

          <form onSubmit={handleReset} className="space-y-5">
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
              disabled={loading}
              className="w-full py-3 px-4 bg-accent-primary text-white font-bold uppercase tracking-wider rounded-xl hover:bg-accent-primary/90 focus:outline-none focus:ring-2 focus:ring-accent-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
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

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  );
}
