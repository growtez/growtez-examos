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
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1a2e2e]">Teachers</h2>
          <p className="text-[#555555] mt-1 text-sm font-medium">Manage your school&apos;s teaching staff</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              placeholder="Search teachers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0f2f2] rounded-xl text-sm text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ab8b8]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2.5 bg-white border border-[#e0f2f2] rounded-xl text-sm font-semibold text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all cursor-pointer shadow-sm hover:bg-[#f5f9f9]"
          >
            <option value="all">All Departments</option>
            {uniqueDepartments.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#008080] text-white text-sm font-semibold rounded-xl hover:bg-[#006666] hover:shadow-lg hover:shadow-[#008080]/30 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            Add Teacher
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e0f2f2] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <table className="w-full animate-pulse">
            <thead>
              <tr className="bg-[#f5f9f9]">
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[#e0f2f2]">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#e0f2f2]"></div>
                    <div className="h-4 bg-[#e0f2f2] rounded w-48"></div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 bg-[#e0f2f2] rounded w-56"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-[#e0f2f2] rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-[#e0f2f2] rounded w-24"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : teachers.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#008080]/10 flex items-center justify-center text-[#008080] mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-[#1a2e2e] font-bold text-lg">No teachers yet</h3>
            <p className="text-[#555555] mt-1 text-sm font-medium">Add your first teacher to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px]">
              <thead>
              <tr className="bg-[#f5f9f9] border-b border-[#e0f2f2]">
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Department</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Added</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((t) => (
                <tr key={t.id} className="border-b border-[#e0f2f2] hover:bg-[#f5f9f9]/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-[#1a2e2e] font-medium">{t.full_name}</span>
                  </td>
                  <td className="px-6 py-4 text-[#555555] text-sm">{t.email || '—'}</td>
                  <td className="px-6 py-4 text-[#555555] text-sm">
                    {t.department ? (
                      <span className="bg-[#e0f2f2] text-[#008080] px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">{t.department}</span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 text-[#555555] text-sm">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center flex justify-center gap-2">
                    <button onClick={() => {
                      setName(t.full_name);
                      setEmail(t.email);
                      setDepartment(t.department || '');
                      setEditTeacherId(t.id);
                    }} className="text-[#008080] hover:text-[#005555] text-xs font-bold px-2 py-1 rounded hover:bg-[#e0f2f2] transition-colors">Edit</button>
                    <button onClick={() => setDeleteTeacherId(t.id)} className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded hover:bg-red-50 transition-colors">Delete</button>
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
        <div className="fixed inset-0 bg-[#1a2e2e]/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e0f2f2] bg-[#f5f9f9]">
              <h3 className="text-xl font-bold text-[#1a2e2e]">Add Teacher</h3>
              <p className="text-sm text-[#555555] mt-1">Add a new teacher to your school</p>
            </div>
            <form onSubmit={handleAddTeacher} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all"
                  placeholder="e.g. Dr. Sharma" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all"
                  placeholder="sharma@school.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all"
                  placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">Temporary Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all"
                  placeholder="Min 6 characters" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm font-medium">{error}</div>}
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-3 bg-[#008080] text-white font-semibold rounded-xl hover:bg-[#006666] transition-all disabled:opacity-50">
                  {formLoading ? 'Adding...' : 'Add Teacher'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-white border border-[#e0f2f2] text-[#555555] font-semibold rounded-xl hover:bg-[#f5f9f9] transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTeacherId && (
        <div className="fixed inset-0 bg-[#1a2e2e]/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setEditTeacherId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e0f2f2] bg-[#f5f9f9]">
              <h3 className="text-xl font-bold text-[#1a2e2e]">Edit Teacher</h3>
              <p className="text-sm text-[#555555] mt-1">Update teacher profile details</p>
            </div>
            <form onSubmit={handleEditTeacher} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required
                  className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all"
                  placeholder="e.g. Mathematics" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm font-medium">{error}</div>}
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-3 bg-[#008080] text-white font-semibold rounded-xl hover:bg-[#006666] transition-all disabled:opacity-50">
                  {formLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditTeacherId(null)}
                  className="px-6 py-3 bg-white border border-[#e0f2f2] text-[#555555] font-semibold rounded-xl hover:bg-[#f5f9f9] transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTeacherId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteTeacherId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              </div>
              <h3 className="text-xl font-bold text-[#1a2e2e] mb-2">Delete Teacher</h3>
              <p className="text-[#555555] text-sm">Are you sure you want to permanently delete this teacher from the database? This action cannot be undone.</p>
            </div>
            <div className="bg-[#f5f9f9] px-6 py-4 flex gap-3">
              <button onClick={() => setDeleteTeacherId(null)} className="flex-1 py-2.5 bg-white border border-[#e0f2f2] text-[#555555] font-bold rounded-xl hover:bg-[#e0f2f2] transition-colors text-sm">Cancel</button>
              <button onClick={handleDeleteTeacher} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors text-sm shadow-sm">Delete</button>
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
