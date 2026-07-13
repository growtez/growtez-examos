'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Download, X, Plus, Share2, Copy, Check, FileDown } from 'lucide-react';

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
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-text-muted bg-transparent">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
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

export function StudentsListContent({ schoolIdProp }: { schoolIdProp?: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const uniqueCourses = Array.from(new Set(students.map(s => s.course).filter(Boolean)));
  const uniqueBatches = Array.from(new Set(students.map(s => s.batch).filter(Boolean)));
  const uniqueSessions = Array.from(new Set(students.map(s => s.session).filter(Boolean))).sort().reverse();

  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [schoolId, setSchoolId] = useState<string | null>(schoolIdProp || null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareCourse, setShareCourse] = useState('');
  const [shareBatch, setShareBatch] = useState('');
  const [shareSession, setShareSession] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentYear = new Date().getFullYear();
  const defaultSession = `${currentYear}-${(currentYear + 1).toString().slice(2)}`;
  
  // Form fields
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('');
  const [course, setCourse] = useState('');
  const [batch, setBatch] = useState('');
  const [sessionVal, setSessionVal] = useState('');
  
  // Edit & Delete
  const [editStudentId, setEditStudentId] = useState<string | null>(null);
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchStudents = async () => {
    let activeSchoolId: string | undefined = schoolIdProp;
    if (!activeSchoolId) {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      if (!profile?.school_id) return;
      activeSchoolId = profile.school_id;
    }
    setSchoolId(activeSchoolId || null);

    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', activeSchoolId)
      .order('full_name', { ascending: true });

    setStudents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const formatDobPassword = (dateStr: string) => {
    const parts = dateStr.split('-');
    return `${parts[2]}${parts[1]}${parts[0]}`;
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      if (!schoolId) throw new Error('No school found');

      const studentEmail = `${rollNumber}@${schoolId}.student.examos.local`;
      const studentPassword = formatDobPassword(dob);

      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: studentEmail,
          password: studentPassword,
          full_name: name,
          role: 'student',
          school_id: schoolId,
          roll_number: rollNumber,
          date_of_birth: dob,
          course,
          batch,
          session: sessionVal
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add student');

      setShowModal(false);
      setName(''); setRollNumber(''); setDob('');
      setCourse(''); setBatch(''); setSessionVal('');
      fetchStudents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      if (!editStudentId) throw new Error('No student selected');
      const { error: updateError } = await supabase.from('students').update({
        full_name: name,
        roll_number: rollNumber,
        date_of_birth: dob,
        course,
        batch,
        session: sessionVal
      }).eq('id', editStudentId);

      if (updateError) throw new Error(updateError.message);

      setEditStudentId(null);
      setName(''); setRollNumber(''); setDob('');
      setCourse(''); setBatch(''); setSessionVal('');
      fetchStudents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentId) return;
    try {
      const res = await fetch('/api/students/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: deleteStudentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete student');
      
      setDeleteStudentId(null);
      fetchStudents();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    try {
      if (!schoolId) throw new Error('No school found');
      const file = fileInputRef.current?.files?.[0];
      if (!file) throw new Error('Please select a file');

      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      const header = lines[0].toLowerCase();
      const hasHeader = header.includes('name') || header.includes('roll');
      const dataLines = hasHeader ? lines.slice(1) : lines;

      let imported = 0;
      let errors: string[] = [];

      for (const line of dataLines) {
        const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
        if (cols.length < 3) continue;

        const [studentName, studentRoll, studentDob, sCourse, sBatch, sSession] = cols;
        let formattedDob = studentDob;
        if (studentDob.includes('/')) {
          const p = studentDob.split('/');
          formattedDob = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
        }

        const studentEmail = `${studentRoll}@${schoolId}.student.examos.local`;
        const studentPassword = formattedDob.includes('-')
          ? formatDobPassword(formattedDob)
          : studentDob.replace(/\//g, '');

        try {
          const res = await fetch('/api/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: studentEmail,
              password: studentPassword,
              full_name: studentName,
              role: 'student',
              school_id: schoolId,
              roll_number: studentRoll,
              date_of_birth: formattedDob,
              course: sCourse || 'General',
              batch: sBatch || 'Main',
              session: sSession || defaultSession
            })
          });

          if (res.ok) imported++;
          else {
            const data = await res.json();
            errors.push(`${studentRoll}: ${data.error || 'Failed'}`);
          }
        } catch {
          errors.push(`${studentRoll}: Failed`);
        }
      }

      setSuccess(`Successfully imported ${imported} students${errors.length ? `. ${errors.length} failed.` : '.'}`);
      setShowImportModal(false);
      fetchStudents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

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

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.roll_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter ? s.course === courseFilter : true;
    const matchesBatch = batchFilter ? s.batch === batchFilter : true;
    const matchesSession = sessionFilter ? s.session === sessionFilter : true;
    return matchesSearch && matchesCourse && matchesBatch && matchesSession;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'name') return (a.full_name || '').localeCompare(b.full_name || '');
    if (sortBy === 'roll') return (a.roll_number || '').localeCompare(b.roll_number || '');
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedStudents = filteredStudents.slice((safePage - 1) * perPage, safePage * perPage);

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
      + "Roll No,Name,Course,Batch,Session,DOB\n"
      + filteredStudents.map(r => {
        let dobStr = '';
        if (r.date_of_birth) {
          const parts = r.date_of_birth.split('-');
          dobStr = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : r.date_of_birth;
        }
        return `${r.roll_number},${r.full_name},${r.course},${r.batch},${r.session},${dobStr}`;
      }).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "name,roll_number,dob,course,batch,session\n"
      + "Aarav Patel,2024001,15/06/2005,JEE,Main,2024-25\n"
      + "Priya Singh,2024002,22/03/2005,JEE,Main,2024-25";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students_sample_format.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const registrationLink = typeof window !== 'undefined' && schoolId
    ? `${window.location.origin}/register/school/${schoolId}${shareCourse || shareBatch || shareSession ? `?p=${btoa(JSON.stringify({ c: shareCourse || undefined, b: shareBatch || undefined, s: shareSession || undefined }))}` : ''}`
    : '';

  const handleCopyShareLink = async () => {
    if (!registrationLink) return;
    try {
      await navigator.clipboard.writeText(registrationLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setError('Failed to copy link');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 text-emerald-600 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">{success}</div>
      )}

      {/* Actions Row */}
      <div className="flex justify-end items-center gap-2 mb-3">
        <button 
          onClick={handleExport}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-[12px] font-semibold cursor-pointer border-none"
        >
          <Download size={14} /> Export CSV
        </button>
        <button onClick={() => setShowImportModal(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-hover transition-colors text-[12px] font-semibold border border-border shrink-0 cursor-pointer">
          Import CSV
        </button>
        <button onClick={() => setShowShareModal(true)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors text-[12px] font-semibold border border-emerald-500/20 shrink-0 cursor-pointer">
          <Share2 size={14} /> Share Registration Link
        </button>
        <button onClick={() => {
          setEditStudentId(null);
          setName(''); setRollNumber(''); setDob('');
          setCourse(''); setBatch(''); setSessionVal('');
          setShowModal(true);
        }}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-primary/10 text-accent-primary hover:bg-accent-primary hover:text-white transition-all text-[12px] font-semibold border border-accent-primary/20 shrink-0 cursor-pointer">
          <Plus size={14} /> Add Student
        </button>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border mb-4">
        {/* Search Box */}
        <div className="relative w-full md:max-w-[260px] shrink-0">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search Students..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
          />
        </div>

        {/* Inline Active Filters */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
          {(searchQuery || courseFilter || batchFilter || sessionFilter || sortBy !== 'newest') ? (
            <>
              <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {courseFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {courseFilter}
                  <button onClick={() => setCourseFilter('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {batchFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {batchFilter}
                  <button onClick={() => setBatchFilter('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {sessionFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {sessionFilter}
                  <button onClick={() => setSessionFilter('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {sortBy !== 'newest' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {sortBy === 'oldest' ? 'Oldest' : sortBy === 'name' ? 'A-Z' : sortBy}
                  <button onClick={() => setSortBy('newest')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              <button 
                onClick={() => { setSearchQuery(''); setCourseFilter(''); setBatchFilter(''); setSessionFilter(''); setSortBy('newest'); setPage(1); }}
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
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Course</label>
                <select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }} className="w-full p-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-main focus:outline-none">
                  <option value="">All Courses</option>
                  {uniqueCourses.map((c: any) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Batch</label>
                <select value={batchFilter} onChange={(e) => { setBatchFilter(e.target.value); setPage(1); }} className="w-full p-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-main focus:outline-none">
                  <option value="">All Batches</option>
                  {uniqueBatches.map((b: any) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Session</label>
                <select value={sessionFilter} onChange={(e) => { setSessionFilter(e.target.value); setPage(1); }} className="w-full p-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-main focus:outline-none">
                  <option value="">All Sessions</option>
                  {uniqueSessions.map((s: any) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <table className="w-full animate-pulse">
            <thead>
              <tr className="bg-surface-hover">
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-6 py-5"><div className="h-4 bg-surface-hover rounded w-32"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-surface-hover rounded w-48"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-surface-hover rounded w-24"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-surface-hover rounded w-24"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-surface-hover rounded w-32"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-surface-hover rounded w-24"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : students.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h3 className="text-text-main font-bold text-lg">No students yet</h3>
            <p className="text-text-muted mt-1 text-sm font-medium">Add students individually or import via CSV</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
              <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[15%]" onClick={() => toggleSort('roll')}>
                  <div className="flex items-center gap-2">Roll No. {getSortIcon('roll')}</div>
                </th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[30%]" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-2">Name {getSortIcon('name')}</div>
                </th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[15%]">Course</th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">Batch</th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">Session</th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">DOB</th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-muted font-medium">
                    No students match your search criteria.
                  </td>
                </tr>
              ) : pagedStudents.map((s) => (
                <tr key={s.id} className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors">
                  <td className="py-2.5 px-4 align-middle">
                    <span className="inline-flex px-2 py-0.5 bg-surface border border-border text-accent-primary text-[11px] font-mono font-bold rounded-md">{s.roll_number}</span>
                  </td>
                  <td className="py-2.5 px-4 align-middle text-text-main font-medium text-[13px]">{s.full_name}</td>
                  <td className="py-2.5 px-4 align-middle text-text-muted text-[13px]">
                    <span className="bg-surface border border-border text-accent-primary px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">{s.course}</span>
                  </td>
                  <td className="py-2.5 px-4 align-middle text-text-muted text-[13px]">{s.batch}</td>
                  <td className="py-2.5 px-4 align-middle text-text-muted text-[13px]">{s.session}</td>
                  <td className="py-2.5 px-4 align-middle text-text-muted text-[13px]">{s.date_of_birth ? (() => {
                    const parts = s.date_of_birth.split('-');
                    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : s.date_of_birth;
                  })() : '—'}</td>
                  <td className="py-2.5 px-4 align-middle text-center">
                    <div className="flex justify-center gap-1.5">
                      <button onClick={() => {
                        setName(s.full_name || '');
                        setRollNumber(s.roll_number || '');
                        setDob(s.date_of_birth || '');
                        setCourse(s.course || '');
                        setBatch(s.batch || '');
                        setSessionVal(s.session || '');
                        setEditStudentId(s.id);
                        setShowModal(true);
                      }} className="text-accent-primary hover:text-accent-primary text-[12px] font-semibold px-2 py-1 rounded-md hover:bg-accent-primary/10 hover:scale-105 active:scale-95 transition-all border border-transparent">Edit</button>
                      <button onClick={() => setDeleteStudentId(s.id)} className="text-red-500 hover:text-red-600 text-[12px] font-semibold px-2 py-1 rounded-md hover:bg-red-500/10 hover:scale-105 active:scale-95 transition-all border border-transparent">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowModal(false); setEditStudentId(null); }}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-accent-primary px-6 py-4 flex items-center justify-between">
              <span className="text-white font-bold">{editStudentId ? 'Edit Student' : 'Add Student'}</span>
              <button onClick={() => { setShowModal(false); setEditStudentId(null); }} className="text-white/70 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-6">
            <form onSubmit={editStudentId ? handleEditStudent : handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all"
                    placeholder="Aarav Patel" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">Roll Number</label>
                  <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all"
                    placeholder="2024001" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">Date of Birth</label>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">Course</label>
                  <CustomCombobox 
                    value={course} 
                    onChange={setCourse} 
                    options={uniqueCourses as string[]} 
                    placeholder="e.g. JEE"
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">Batch</label>
                  <CustomCombobox 
                    value={batch} 
                    onChange={setBatch} 
                    options={uniqueBatches as string[]} 
                    placeholder="e.g. Main"
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">Session</label>
                  <CustomCombobox 
                    value={sessionVal} 
                    onChange={setSessionVal} 
                    options={uniqueSessions as string[]} 
                    placeholder="e.g. 2024-25"
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all" 
                  />
                </div>
              </div>
              <p className="text-accent-primary text-xs">Password will be DOB in DDMMYYYY format</p>
              {error && <div className="border border-red-400 bg-red-50 dark:bg-red-500/10 p-3 text-red-600 text-sm">⚠ {error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditStudentId(null); }}
                  className="px-6 py-2.5 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-surface-hover text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white font-bold rounded-xl shadow-lg shadow-accent-primary/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm">
                  {formLoading ? (editStudentId ? 'Saving...' : 'Adding...') : (editStudentId ? 'Save Changes' : 'Add Student')}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowImportModal(false)}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-accent-primary px-6 py-4 flex items-center justify-between">
              <span className="text-white font-bold">Import Students via CSV</span>
              <button onClick={() => setShowImportModal(false)} className="text-white/70 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-6">
            <div className="bg-surface-hover border border-border p-4 rounded-xl mb-4">
              <p className="text-text-main text-sm font-bold mb-2">CSV Format:</p>
              <code className="text-xs text-accent-primary bg-surface px-3 py-2 block border border-border rounded font-mono overflow-auto">
                name, roll_number, dob<br />
                Aarav Patel, 2024001, 15/06/2005<br />
                Priya Singh, 2024002, 22/03/2005
              </code>
              <button type="button" onClick={handleDownloadSampleCsv}
                className="mt-3 flex items-center justify-center gap-1.5 w-full px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-hover transition-colors text-[12px] font-semibold border border-border cursor-pointer text-text-main">
                <FileDown size={14} /> Download Sample CSV
              </button>
            </div>
            <form onSubmit={handleCsvImport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5">Select CSV File</label>
                <input type="file" ref={fileInputRef} accept=".csv,.txt" required
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main file:mr-4 file:py-1.5 file:px-3 file:border-0 file:rounded-md file:bg-accent-primary file:text-white file:text-sm file:font-semibold focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all text-sm" />
              </div>
              {error && <div className="border border-red-400 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl text-red-600 text-sm flex items-center gap-2">⚠ {error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowImportModal(false)}
                  className="px-6 py-2.5 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-surface-hover text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white font-bold rounded-xl shadow-lg shadow-accent-primary/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm">
                  {formLoading ? 'Importing...' : 'Import'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Share Registration Link Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-accent-primary px-6 py-4 flex items-center justify-between">
              <span className="text-white font-bold">Student Self-Registration Link</span>
              <button onClick={() => setShowShareModal(false)} className="text-white/70 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-6">
              <p className="text-text-muted text-sm mb-4">
                Share this link with students so they can register themselves. New registrations will appear in your students list.
              </p>

              <div className="bg-bg border border-border p-4 rounded-xl mb-5 space-y-3">
                <p className="text-xs font-bold text-accent-primary uppercase tracking-wider mb-2">Optional: Pre-fill Student Details</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Course</label>
                    <CustomCombobox 
                      value={shareCourse} 
                      onChange={setShareCourse} 
                      options={uniqueCourses as string[]} 
                      placeholder="e.g. NEET"
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-main text-xs focus:outline-none focus:border-accent-primary" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Batch</label>
                    <CustomCombobox 
                      value={shareBatch} 
                      onChange={setShareBatch} 
                      options={uniqueBatches as string[]} 
                      placeholder="e.g. Morning"
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-main text-xs focus:outline-none focus:border-accent-primary" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Session</label>
                    <CustomCombobox 
                      value={shareSession} 
                      onChange={setShareSession} 
                      options={uniqueSessions as string[]} 
                      placeholder="e.g. 2024-25"
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-main text-xs focus:outline-none focus:border-accent-primary" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-surface-hover border border-border p-3 rounded-xl mb-4">
                <input
                  type="text"
                  readOnly
                  value={registrationLink}
                  className="flex-1 bg-transparent text-text-main text-xs font-mono outline-none truncate"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  onClick={handleCopyShareLink}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-primary hover:bg-accent-primary/80 text-white text-xs font-semibold shrink-0 transition-all cursor-pointer"
                >
                  {linkCopied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </button>
              </div>
              {!schoolId && (
                <p className="text-red-500 text-xs">School not found — link unavailable.</p>
              )}
              <div className="flex justify-end pt-2">
                <button onClick={() => setShowShareModal(false)}
                  className="px-6 py-2.5 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-surface-hover text-sm transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteStudentId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteStudentId(null)}>
          <div className="bg-surface rounded-2xl shadow-xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">Delete Student?</h3>
              <p className="text-sm text-text-muted">This action cannot be undone. Are you sure you want to delete this student?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteStudentId(null)}
                className="flex-1 px-4 py-2.5 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-surface-hover transition-colors text-sm">
                Cancel
              </button>
              <button onClick={handleDeleteStudent}
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

export default function StudentsPage() {
  return <StudentsListContent />;
}