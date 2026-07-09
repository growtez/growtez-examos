'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileText, Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useDrawer } from '../DrawerContext';

const statusColors: Record<string, string> = {
  draft: 'bg-surface-hover text-text-muted border-border',
  published: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20',
  active: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
  completed: 'bg-surface-hover text-text-main border-border',
};

export default function ExamsDashboard() {
  const { openDrawer } = useDrawer();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      const supabase = createClient();
      
      const { data } = await supabase
        .from('exams')
        .select('*, schools(name), exam_students(count)')
        .eq('is_trashed', false)
        .order('created_at', { ascending: false });

      setExams(data || []);
      setLoading(false);
    };
    
    fetchExams();
  }, []);

  const filteredExams = exams
    .filter(exam => {
      const matchesSearch = exam.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        exam.schools?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter = filterStatus === 'all' || exam.status === filterStatus;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedExams = filteredExams.slice((safePage - 1) * perPage, safePage * perPage);

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

  const toggleSort = (newSort: string) => {
    if (sortBy === newSort) {
      setSortBy(newSort === 'newest' ? 'oldest' : newSort === 'title' ? 'newest' : 'newest');
    } else {
      setSortBy(newSort);
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy === field) return <ArrowUp size={14} />;
    if (field === 'newest' && sortBy === 'oldest') return <ArrowDown size={14} />;
    return <ArrowUpDown size={14} className="opacity-30" />;
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Title,School,Duration,Status,Created At\n"
      + filteredExams.map(r => `${r.title},${r.schools?.name || 'Unknown School'},${r.duration_minutes},${r.status},${new Date(r.created_at).toLocaleDateString()}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `exams_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">

      {/* Global Template Presets */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Global Exam Templates</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* NEET */}
          <div className="relative bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-accent-primary/30 transition-all group overflow-hidden flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-extrabold text-text-main tracking-tight">NEET</h3>
                <p className="text-[11px] text-text-muted">Medical Entrance</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">720 Marks</span>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Duration</span>
                <span className="font-semibold text-text-main">200 min</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Subjects</span>
                <span className="font-semibold text-text-main">Physics · Chemistry · Biology</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Marking</span>
                <span className="font-semibold text-text-main">+4 / −1</span>
              </div>
            </div>
            <button
              onClick={() => openDrawer('exam', {
                title: 'NEET Mock Test',
                description: 'National Eligibility cum Entrance Test for medical admissions.',
                durationMinutes: 200,
                mcqCorrect: 4, mcqWrong: -1, natCorrect: 4, natWrong: 0,
                subjects: [
                  { name: 'Physics', questionCount: 45 },
                  { name: 'Chemistry', questionCount: 45 },
                  { name: 'Biology', questionCount: 90 },
                ],
              })}
              className="mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-accent-primary/10 text-accent-primary text-[12px] font-bold hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20 cursor-pointer"
            >
              <Plus size={13} /> Use Template
            </button>
          </div>

          {/* JEE Main */}
          <div className="relative bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-400/30 transition-all group overflow-hidden flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-extrabold text-text-main tracking-tight">JEE Main</h3>
                <p className="text-[11px] text-text-muted">Engineering Entrance</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">300 Marks</span>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Duration</span>
                <span className="font-semibold text-text-main">180 min</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Subjects</span>
                <span className="font-semibold text-text-main">Physics · Chemistry · Math</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Marking</span>
                <span className="font-semibold text-text-main">+4 / −1</span>
              </div>
            </div>
            <button
              onClick={() => openDrawer('exam', {
                title: 'JEE Main Mock Test',
                description: 'Joint Entrance Examination Main for engineering admissions.',
                durationMinutes: 180,
                mcqCorrect: 4, mcqWrong: -1, natCorrect: 4, natWrong: 0,
                subjects: [
                  { name: 'Physics', questionCount: 30 },
                  { name: 'Chemistry', questionCount: 30 },
                  { name: 'Mathematics', questionCount: 30 },
                ],
              })}
              className="mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-accent-primary/10 text-accent-primary text-[12px] font-bold hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20 cursor-pointer"
            >
              <Plus size={13} /> Use Template
            </button>
          </div>

          {/* JEE Advanced */}
          <div className="relative bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-violet-400/30 transition-all group overflow-hidden flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-extrabold text-text-main tracking-tight">JEE Advanced</h3>
                <p className="text-[11px] text-text-muted">IIT Entrance</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">360 Marks</span>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Duration</span>
                <span className="font-semibold text-text-main">180 min</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Subjects</span>
                <span className="font-semibold text-text-main">Physics · Chemistry · Math</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Marking</span>
                <span className="font-semibold text-text-main">+3 / −1</span>
              </div>
            </div>
            <button
              onClick={() => openDrawer('exam', {
                title: 'JEE Advanced Mock Test',
                description: 'Joint Entrance Examination Advanced for IIT admissions.',
                durationMinutes: 180,
                mcqCorrect: 3, mcqWrong: -1, natCorrect: 3, natWrong: 0,
                subjects: [
                  { name: 'Physics', questionCount: 54 },
                  { name: 'Chemistry', questionCount: 54 },
                  { name: 'Mathematics', questionCount: 54 },
                ],
              })}
              className="mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-accent-primary/10 text-accent-primary text-[12px] font-bold hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20 cursor-pointer"
            >
              <Plus size={13} /> Use Template
            </button>
          </div>

          {/* Custom */}
          <div className="relative bg-surface border border-dashed border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-accent-primary/40 transition-all group overflow-hidden flex flex-col justify-between">
            <div className="text-center py-2">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center mx-auto">
                <FileText size={20} />
              </div>
              <h3 className="text-sm font-bold text-text-main">Custom Template</h3>
              <p className="text-[11px] text-text-muted mt-1">Build your own exam structure from scratch</p>
            </div>
            <button
              onClick={() => openDrawer('exam', {})}
              className="flex items-center justify-center gap-1.5 w-full py-2 mt-4 rounded-xl bg-accent-primary/10 text-accent-primary text-[12px] font-bold hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20 cursor-pointer"
            >
              <Plus size={13} /> Create Custom
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel (next to search field) */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border">
        {/* Search Box */}
        <div className="relative w-full md:max-w-[260px] shrink-0">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search Exams..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
          />
        </div>

        {/* Inline Active Filters */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
          {(searchQuery || filterStatus !== 'all' || sortBy !== 'newest') ? (
            <>
              <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                  <button onClick={() => setFilterStatus('all')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {sortBy !== 'newest' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {sortBy === 'oldest' ? 'Oldest' : sortBy === 'title' ? 'A-Z (Title)' : sortBy}
                  <button onClick={() => setSortBy('newest')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              <button 
                onClick={() => { setSearchQuery(''); setFilterStatus('all'); setSortBy('newest'); setPage(1); }}
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

        {/* Per-page & Actions */}
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
            <div className={`absolute right-0 top-full mt-2 w-32 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col overflow-hidden py-1 ${
              isFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
            }`}>
              {['all', 'draft', 'published', 'active', 'completed'].map(status => (
                <button key={status} onClick={() => { setFilterStatus(status); setPage(1); setIsFilterOpen(false); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${filterStatus === status ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-[12px] font-medium cursor-pointer border-none flex-1 md:flex-none"
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-text-muted">Loading exams...</div>
        ) : pagedExams.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center mx-auto mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-bold text-text-main mb-1">No Exams Found</h3>
            <p className="text-text-muted text-sm max-w-sm mx-auto mb-6">
              {searchQuery || filterStatus !== 'all' ? "No exams matched your criteria." : "There are no exams created by any schools yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-hover border-b border-border text-text-muted font-bold tracking-wider uppercase text-[11px] cursor-pointer">
                  <th className="text-left px-6 py-4 hover:text-text-main transition-colors" onClick={() => toggleSort('title')}>
                    <div className="flex items-center gap-2">Title {getSortIcon('title')}</div>
                  </th>
                  <th className="text-left px-6 py-4">School</th>
                  <th className="text-left px-6 py-4">Duration</th>
                  <th className="text-left px-6 py-4">Students</th>
                  <th className="text-left px-6 py-4">Status</th>
                  <th className="text-left px-6 py-4 hover:text-text-main transition-colors" onClick={() => toggleSort('newest')}>
                    <div className="flex items-center gap-2">Created {getSortIcon('newest')}</div>
                  </th>
                  <th className="text-right px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-text-main font-semibold block">{exam.title}</span>
                      {exam.description && <span className="text-text-muted text-xs truncate max-w-[200px] block">{exam.description}</span>}
                    </td>
                    <td className="px-6 py-4 text-text-muted font-medium">{exam.schools?.name || 'Unknown School'}</td>
                    <td className="px-6 py-4 text-text-muted">{exam.duration_minutes} min</td>
                    <td className="px-6 py-4 text-text-muted">{exam.exam_students?.[0]?.count || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-lg border ${statusColors[exam.status] || statusColors.draft}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-muted whitespace-nowrap">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/exams/${exam.id}`} className="text-accent-primary hover:text-accent-primary/80 font-bold text-xs uppercase tracking-wider transition-colors">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
