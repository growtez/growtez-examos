'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Download, X, Plus, Users } from 'lucide-react';

function CustomCombobox({ value, onChange, options, placeholder, className }: { value: string, onChange: (v: string) => void, options: string[], placeholder: string, className: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setFilteredOptions(options.filter(o => o.toLowerCase().includes(value.toLowerCase())));
  }, [value, options]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={`${className} text-ellipsis overflow-hidden whitespace-nowrap`}
        style={{ paddingRight: '1.75rem' }}
        required
      />
      {options.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-text-muted bg-transparent">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      )}
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full bg-surface border border-border mt-1 rounded-xl shadow-xl shadow-accent-primary/10 max-h-[130px] overflow-y-auto custom-scrollbar">
          {filteredOptions.map((opt) => (
            <li
              key={opt}
              className="px-4 py-2.5 hover:bg-surface-hover cursor-pointer text-sm font-medium text-text-main transition-colors"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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

  const toggleSort = (newSort: string) => {
    if (sortBy === newSort) {
      setSortBy(newSort === 'newest' ? 'oldest' : newSort === 'name' ? 'newest' : 'newest');
    } else {
      setSortBy(newSort);
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy === field) return <ArrowUp size={14} />;
    if (field === 'newest' && sortBy === 'oldest') return <ArrowDown size={14} />;
    return <ArrowUpDown size={14} className="opacity-30" />;
  };

  const filteredTeachers = teachers.filter(t => 
    (t.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(t => selectedDepartment === 'all' || t.department === selectedDepartment)
   .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'name') return (a.full_name || '').localeCompare(b.full_name || '');
      if (sortBy === 'department') return (a.department || '').localeCompare(b.department || '');
      return 0;
   });

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedTeachers = filteredTeachers.slice((safePage - 1) * perPage, safePage * perPage);

  const getPaginationPages = () => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage === totalPages) {
      return [1, '...', totalPages];
    }
    if (safePage === totalPages - 1) {
      return [safePage - 1, safePage, totalPages];
    }
    return [safePage, '...', totalPages];
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Department,Created At\n"
      + filteredTeachers.map(r => `${r.full_name},${r.email},${r.department || ''},${new Date(r.created_at).toLocaleDateString()}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `teachers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      {/* Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border mb-4">
        {/* Search Box */}
        <div className="relative w-full md:max-w-[260px] shrink-0">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search Teachers..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
          />
        </div>

        {/* Inline Active Filters */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
          {(searchQuery || selectedDepartment !== 'all' || sortBy !== 'newest') ? (
            <>
              <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {selectedDepartment !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {selectedDepartment}
                  <button onClick={() => setSelectedDepartment('all')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {sortBy !== 'newest' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {sortBy === 'oldest' ? 'Oldest' : sortBy === 'name' ? 'A-Z' : sortBy}
                  <button onClick={() => setSortBy('newest')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              <button 
                onClick={() => { setSearchQuery(''); setSelectedDepartment('all'); setSortBy('newest'); setPage(1); }}
                className="text-[11px] text-text-muted hover:text-red-500 transition-colors ml-1 bg-transparent border-none cursor-pointer font-medium shrink-0"
              >
                Clear
              </button>
            </>
          ) : (
            <span className="text-[11px] text-text-muted italic opacity-50">No active filters</span>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between md:justify-start gap-1 shrink-0 md:border-x md:border-border/50 px-3 py-1.5 md:py-0 w-full md:w-auto">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
            <ChevronLeft size={14} />
          </button>
          <div className="flex items-center justify-center gap-1 w-[80px]">
            {getPaginationPages().map((p, i) => p === '...' ? (
              <div key={`ellipsis-${i}`} className="w-6 h-6 flex items-center justify-center text-[11px] text-text-muted">…</div>
            ) : (
              <button key={p} onClick={() => setPage(p as number)} className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-semibold transition-colors border-none cursor-pointer ${safePage === p ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-surface-hover bg-transparent'}`}>{p as number}</button>
            ))}
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Controls and Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer flex-1 md:flex-none">
            {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <div className="relative group flex-1 md:flex-none">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium"
            >
              <Filter size={14} className="text-accent-primary" /> Filter
            </button>
            <div className={`absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col p-3 space-y-3 ${
              isFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
            }`}>
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Department</label>
                <select value={selectedDepartment} onChange={(e) => { setSelectedDepartment(e.target.value); setPage(1); }} className="w-full p-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-main focus:outline-none">
                  <option value="all">All Departments</option>
                  {uniqueDepartments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-[12px] font-medium cursor-pointer border-none flex-1 md:flex-none"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-primary/10 text-accent-primary hover:bg-accent-primary hover:text-white transition-all text-[12px] font-medium border border-accent-primary/20 shrink-0 cursor-pointer flex-1 md:flex-none"
          >
            <Plus size={14} /> Add Teacher
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
            <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
              <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[30%]" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-2">Name {getSortIcon('name')}</div>
                </th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[30%]">Email</th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[20%]" onClick={() => toggleSort('department')}>
                  <div className="flex items-center gap-2">Department {getSortIcon('department')}</div>
                </th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[10%]" onClick={() => toggleSort('newest')}>
                  <div className="flex items-center gap-2">Added {getSortIcon('newest')}</div>
                </th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedTeachers.map((t) => (
                <tr key={t.id} className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors">
                  <td className="py-2.5 px-4 align-middle">
                    <span className="text-text-main font-medium text-[13px]">{t.full_name}</span>
                  </td>
                  <td className="py-2.5 px-4 align-middle text-text-muted text-[13px]">{t.email || '—'}</td>
                  <td className="py-2.5 px-4 align-middle text-text-muted text-[13px]">
                    {t.department ? (
                      <span className="bg-surface border border-border text-accent-primary px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">{t.department}</span>
                    ) : '—'}
                  </td>
                  <td className="py-2.5 px-4 align-middle text-text-muted text-[13px]">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="py-2.5 px-4 align-middle text-center">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => {
                        setName(t.full_name);
                        setEmail(t.email);
                        setDepartment(t.department || '');
                        setEditTeacherId(t.id);
                      }} className="text-accent-primary hover:text-accent-primary text-[12px] font-semibold px-2 py-1 rounded-md hover:bg-accent-primary/10 hover:scale-105 active:scale-95 transition-all border border-transparent">Edit</button>
                      <button onClick={() => setDeleteTeacherId(t.id)} className="text-red-500 hover:text-red-600 text-[12px] font-semibold px-2 py-1 rounded-md hover:bg-red-500/10 hover:scale-105 active:scale-95 transition-all border border-transparent">Delete</button>
                    </div>
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
                <CustomCombobox
                  value={department}
                  onChange={setDepartment}
                  options={uniqueDepartments as string[]}
                  placeholder="e.g. Mathematics"
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all"
                />
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
                <CustomCombobox
                  value={department}
                  onChange={setDepartment}
                  options={uniqueDepartments as string[]}
                  placeholder="e.g. Mathematics"
                  className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all"
                />
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
