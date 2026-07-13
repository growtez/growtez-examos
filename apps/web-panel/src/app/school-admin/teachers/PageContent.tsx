'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Users } from 'lucide-react';

export function TeachersListContent({ schoolIdProp }: { schoolIdProp?: string }) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  
  // Search, Edit, Delete
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [editTeacherId, setEditTeacherId] = useState<string | null>(null);
  const [deleteTeacherId, setDeleteTeacherId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchTeachers = async () => {
    let activeSchoolId: string | undefined = schoolIdProp;
    if (!activeSchoolId) {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      if (!profile?.school_id) return;
      activeSchoolId = profile.school_id;
    }

    const { data } = await supabase
      .from('teachers')
      .select('*')
      .eq('school_id', activeSchoolId)
      .order('department', { ascending: true })
      .order('full_name', { ascending: true });

    setTeachers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      let activeSchoolId: string | undefined = schoolIdProp;
      if (!activeSchoolId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
        if (!profile?.school_id) throw new Error('No school found');
        activeSchoolId = profile.school_id;
      }

      // Create teacher via API route to preserve admin session
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: name,
          role: 'teacher',
          school_id: activeSchoolId,
          department: department || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add teacher');

      setShowModal(false);
      setName(''); setEmail(''); setPassword(''); setDepartment('');
      fetchTeachers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      if (!editTeacherId) throw new Error('No teacher selected');
      
      const { error: updateError } = await supabase.from('teachers').update({
        full_name: name,
        email: email,
        department: department || null
      }).eq('id', editTeacherId);

      if (updateError) throw new Error(updateError.message);

      setEditTeacherId(null);
      setName(''); setEmail(''); setPassword(''); setDepartment('');
      fetchTeachers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deleteTeacherId) return;
    try {
      const res = await fetch('/api/students/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: deleteTeacherId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete teacher');
      
      setDeleteTeacherId(null);
      fetchTeachers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const uniqueDepartments = Array.from(new Set(teachers.map(t => t.department).filter(Boolean))).sort();

  const filteredTeachers = teachers.filter(t => 
    (t.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(t => selectedDepartment === 'all' || t.department === selectedDepartment);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Teachers</h2>
          <p className="text-text-muted mt-1 text-sm font-medium">Manage your school&apos;s teaching staff</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 w-full md:w-64 shrink-0">
            <input 
              type="text" 
              placeholder="Search teachers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all shadow-sm"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all cursor-pointer shadow-sm hover:bg-surface-hover"
          >
            <option value="all">All Departments</option>
            {uniqueDepartments.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-white text-sm font-semibold rounded-xl hover:bg-accent-primary/80 hover:shadow-lg hover:shadow-accent-primary/30 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            Add Teacher
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <table className="w-full animate-pulse">
            <thead>
              <tr className="bg-bg">
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-hover"></div>
                    <div className="h-4 bg-surface-hover rounded w-48"></div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 bg-surface-hover rounded w-56"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-surface-hover rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-surface-hover rounded w-24"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : teachers.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-text-main font-bold text-lg">No teachers yet</h3>
            <p className="text-text-muted mt-1 text-sm font-medium">Add your first teacher to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px]">
              <thead>
              <tr className="bg-bg border-b border-border">
                <th className="text-left px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Department</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Added</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((t) => (
                <tr key={t.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-text-main font-medium">{t.full_name}</span>
                  </td>
                  <td className="px-6 py-4 text-text-muted text-sm">{t.email || '—'}</td>
                  <td className="px-6 py-4 text-text-muted text-sm">
                    {t.department ? (
                      <span className="bg-surface-hover text-accent-primary px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">{t.department}</span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 text-text-muted text-sm">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center flex justify-center gap-2">
                    <button onClick={() => {
                      setName(t.full_name);
                      setEmail(t.email);
                      setDepartment(t.department || '');
                      setEditTeacherId(t.id);
                    }} className="text-accent-primary hover:text-accent-primary/80 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors">Edit</button>
                    <button onClick={() => setDeleteTeacherId(t.id)} className="text-red-500 hover:text-red-600 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-accent-primary px-6 py-4 flex items-center justify-between">
              <span className="text-white font-bold">Add Teacher</span>
              <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all"
                  placeholder="e.g. Dr. Sharma" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all"
                  placeholder="sharma@school.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all"
                  placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all"
                  placeholder="Min 6 characters" />
              </div>
              {error && <div className="bg-red-500/10 border border-red-200 rounded-xl p-3 text-red-600 text-sm font-medium">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-bg text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-2.5 bg-accent-primary text-white font-bold rounded-xl shadow-lg shadow-accent-primary/20 hover:bg-accent-primary/80 transition-all disabled:opacity-70 text-sm">
                  {formLoading ? 'Adding...' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTeacherId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditTeacherId(null)}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-accent-primary px-6 py-4 flex items-center justify-between">
              <span className="text-white font-bold">Edit Teacher</span>
              <button onClick={() => setEditTeacherId(null)} className="text-white/70 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleEditTeacher} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all"
                  placeholder="e.g. Mathematics" />
              </div>
              {error && <div className="bg-red-500/10 border border-red-200 rounded-xl p-3 text-red-600 text-sm font-medium">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditTeacherId(null)}
                  className="px-6 py-2.5 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-bg text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-2.5 bg-accent-primary text-white font-bold rounded-xl shadow-lg shadow-accent-primary/20 hover:bg-accent-primary/80 transition-all disabled:opacity-70 text-sm">
                  {formLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTeacherId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteTeacherId(null)}>
          <div className="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">Delete Teacher?</h3>
              <p className="text-sm text-text-muted">This action cannot be undone. Are you sure you want to delete this teacher?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTeacherId(null)}
                className="flex-1 px-4 py-2.5 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-surface-hover transition-colors text-sm">
                Cancel
              </button>
              <button onClick={handleDeleteTeacher}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all text-sm">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeachersPage() {
  return <TeachersListContent />;
}
