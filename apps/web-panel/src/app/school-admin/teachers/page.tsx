'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const supabase = createClient();

  const fetchTeachers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
    if (!profile?.school_id) return;

    const { data } = await supabase
      .from('teachers')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false });

    setTeachers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      if (!profile?.school_id) throw new Error('No school found');

      // Create teacher via API route to preserve admin session
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: name,
          role: 'teacher',
          school_id: profile.school_id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add teacher');

      setShowModal(false);
      setName(''); setEmail(''); setPassword('');
      fetchTeachers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teachers</h2>
          <p className="text-gray-500 mt-1">Manage your school&apos;s teachers</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-gray-900 font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Teacher
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : teachers.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-gray-900 font-semibold text-lg">No teachers yet</h3>
            <p className="text-gray-500 mt-1">Add your first teacher to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Added</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <span className="text-gray-900 text-xs font-bold">{t.full_name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <span className="text-gray-900 font-medium">{t.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{t.email || '—'}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Teacher</h3>
            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="Dr. Sharma" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="sharma@school.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="Min 6 characters" />
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-gray-900 font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50">
                  {formLoading ? 'Adding...' : 'Add Teacher'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
