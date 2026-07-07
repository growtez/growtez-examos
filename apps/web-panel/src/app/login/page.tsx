'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Get user role to redirect
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Failed to get user info');
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
      setError('Students should use the desktop app to take exams.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f9f9]" style={{backgroundImage: 'linear-gradient(135deg, #f0f8f8 0%, #ffffff 50%, #e8f4f4 100%)'}}>
      {/* Background geometric accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#008080]" />
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5" style={{background: 'linear-gradient(135deg, #008080, transparent)'}}>
          <div className="absolute inset-0" style={{clipPath: 'polygon(100% 0, 0 0, 100% 100%)', background: '#008080'}} />
        </div>
        <div className="absolute bottom-0 left-0 w-48 h-48 opacity-5">
          <div className="absolute inset-0" style={{clipPath: 'polygon(0 100%, 0 0, 100% 100%)', background: '#008080'}} />
        </div>
      </div>

      <div className="relative w-full max-w-md px-6">
        {/* Logo / Brand */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="mb-4 border-2 border-[#008080] p-3 inline-block" style={{background: 'white'}}>
            <img src="/logo.png" alt="ParikshaOS Logo" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#1a2e2e] tracking-tight uppercase">ParikshaOS</h1>
          <p className="text-[#555555] mt-2 text-sm font-medium">Secure Examination Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border-2 border-[#008080] p-8 shadow-[4px_4px_0px_#008080]">
          {/* Card header bar */}
          <div className="-mx-8 -mt-8 mb-6 px-8 py-3 bg-[#008080]">
            <h2 className="text-base font-bold text-white uppercase tracking-widest">Administrator Sign In</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] placeholder-[#8aacac] focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-sm"
                placeholder="admin@school.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] placeholder-[#8aacac] focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="border border-red-400 bg-red-50 p-3 text-red-600 text-sm font-medium">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#008080] text-white font-bold uppercase tracking-wider hover:bg-[#006666] focus:outline-none focus:ring-2 focus:ring-[#008080] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm border-b-4 border-[#004d4d] active:border-b-0 active:translate-y-[4px]"
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

        <p className="text-center text-[#8aacac] text-xs mt-6 uppercase tracking-wider">
          © {new Date().getFullYear()} Growtez ParikshaOS · All rights reserved
        </p>
      </div>
    </div>
  );
}
