'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewSchoolPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [schoolName, setSchoolName] = useState('');
  const [domain, setDomain] = useState('');
  const [maxStudents, setMaxStudents] = useState(500);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // School admin credentials
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    try {
      // 1. Create the school
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert({
          name: schoolName,
          domain: domain || null,
          max_students: maxStudents,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null,
          is_active: true,
        })
        .select()
        .single();

      if (schoolError) throw schoolError;

      // 2. Create the school admin auth user via secure API route (avoids logout and email confirm issues)
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          full_name: adminName,
          role: 'school_admin',
          school_id: school.id,
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create admin user');
      }

      router.push('/schools');
    } catch (err: any) {
      setError(err.message || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link
          href="/schools"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 text-sm transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Schools
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Onboard New School</h2>
        <p className="text-gray-500 mt-1">Create a school and its admin account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* School Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">School Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">School Name *</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="Delhi Public School"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Domain (optional)</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="dps.school.saasdomain.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Students</label>
                <input
                  type="number"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="principal@dps.edu.in"
              />
            </div>
          </div>
        </div>

        {/* Admin Account */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">School Admin Account</h3>
          <p className="text-gray-500 text-sm mb-4">This person will manage the school panel</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="Rajesh Kumar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="admin@dps.edu.in"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="Min 6 characters"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-gray-900 font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25"
          >
            {loading ? 'Creating...' : 'Onboard School'}
          </button>
          <Link
            href="/schools"
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
