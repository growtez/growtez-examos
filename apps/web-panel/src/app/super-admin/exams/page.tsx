'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FileText, Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Download, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useDrawer } from '../DrawerContext';

const statusColors: Record<string, string> = {
  draft: 'bg-surface-hover text-text-muted border-border',
  published: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20',
  active: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
  completed: 'bg-surface-hover text-text-main border-border',
};

export default function ExamsDashboard() {
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const [exams, setExams] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Template Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState<{
    title: string;
    description: string;
    durationMinutes: number | '';
    mcqCorrect: number | '';
    mcqWrong: number | '';
    natCorrect: number | '';
    natWrong: number | '';
  }>({
    title: '', description: '', durationMinutes: '',
    mcqCorrect: '', mcqWrong: '', natCorrect: '', natWrong: ''
  });
  const [templateSubjects, setTemplateSubjects] = useState<Array<{ name: string; questionCount: number | '' }>>([{ name: '', questionCount: '' }]);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState('');
  const [mounted, setMounted] = useState(false);

  const fetchExams = async () => {
    const supabase = createClient();
    
    const [{ data: examsData }, { data: templatesData }] = await Promise.all([
      supabase
        .from('exams')
        .select('*, schools(name), exam_students(count)')
        .eq('is_trashed', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('exam_templates')
        .select('*, exam_template_subjects(*)')
        .order('created_at', { ascending: false })
    ]);

    setExams(examsData || []);
    setTemplates(templatesData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchExams();
    window.addEventListener('refresh-tables', fetchExams);
    setMounted(true);
    return () => window.removeEventListener('refresh-tables', fetchExams);
  }, []);

  const openCreateTemplate = () => {
    setTemplateForm({
      title: '', description: '', durationMinutes: '',
      mcqCorrect: '', mcqWrong: '', natCorrect: '', natWrong: ''
    });
    setTemplateSubjects([{ name: '', questionCount: '' }]);
    setTemplateError('');
    setShowTemplateModal(true);
  };

  const addTemplateSubject = () => setTemplateSubjects(s => [...s, { name: '', questionCount: '' }]);
  const removeTemplateSubject = (i: number) => setTemplateSubjects(s => s.filter((_, idx) => idx !== i));
  const updateTemplateSubject = (i: number, field: string, value: any) => {
    setTemplateSubjects(s => { const u = [...s]; (u[i] as any)[field] = value; return u; });
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setTemplateError('');
    setSavingTemplate(true);

    const supabase = createClient();

    try {
      if (!templateForm.title.trim()) throw new Error('Template title is required');
      if (!templateForm.durationMinutes) throw new Error('Duration is required');

      const { data: template, error: templateError } = await supabase
        .from('exam_templates')
        .insert({
          title: templateForm.title.trim(),
          description: templateForm.description.trim() || null,
          duration_minutes: templateForm.durationMinutes,
          marking_scheme: {
            mcq_correct: templateForm.mcqCorrect || 0,
            mcq_wrong: templateForm.mcqWrong || 0,
            nat_correct: templateForm.natCorrect || 0,
            nat_wrong: templateForm.natWrong || 0,
          },
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create template subjects
      const validSubjects = templateSubjects.filter(s => s.name.trim());
      for (let i = 0; i < validSubjects.length; i++) {
        await supabase.from('exam_template_subjects').insert({
          template_id: template.id,
          subject_name: validSubjects[i].name.trim(),
          question_count: validSubjects[i].questionCount || 0,
          sort_order: i,
        });
      }

      fetchExams();
      setShowTemplateModal(false);
    } catch (err: any) {
      setTemplateError(err.message || 'Failed to create template');
    } finally {
      setSavingTemplate(false);
    }
  };

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
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Exam Templates</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {templates.map(template => (
            <div key={template.id} className="relative bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-accent-primary/30 transition-all group overflow-hidden flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-extrabold text-text-main tracking-tight">{template.title}</h3>
                  <p className="text-[11px] text-text-muted">{template.description || 'Custom Template'}</p>
                </div>
              </div>
              <div className="space-y-1 mb-4">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">Duration</span>
                  <span className="font-semibold text-text-main">{template.duration_minutes} min</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">Subjects</span>
                  <span className="font-semibold text-text-main">
                    {template.exam_template_subjects?.map((s: any) => s.subject_name).join(' · ') || 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">Marking</span>
                  <span className="font-semibold text-text-main">
                    +{template.marking_scheme?.mcq_correct || 0} / {template.marking_scheme?.mcq_wrong || 0}
                  </span>
                </div>
              </div>
              <button
                onClick={() => openDrawer('exam', {
                  title: template.title,
                  description: template.description,
                  durationMinutes: template.duration_minutes,
                  mcqCorrect: template.marking_scheme?.mcq_correct,
                  mcqWrong: template.marking_scheme?.mcq_wrong,
                  natCorrect: template.marking_scheme?.nat_correct,
                  natWrong: template.marking_scheme?.nat_wrong,
                  subjects: template.exam_template_subjects?.map((s: any) => ({
                    name: s.subject_name,
                    questionCount: s.question_count
                  }))
                })}
                className="mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-accent-primary/10 text-accent-primary text-[12px] font-bold hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20 cursor-pointer"
              >
                <Plus size={13} /> Use Template
              </button>
            </div>
          ))}

          {/* Custom Setup */}
          <div className="relative bg-surface border border-dashed border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-accent-primary/40 transition-all group overflow-hidden flex flex-col justify-between">
            
            <div className="flex flex-col gap-2 mt-4">
              <button
                onClick={() => openCreateTemplate()}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-accent-primary/10 text-accent-primary text-[12px] font-bold hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20 cursor-pointer"
              >
                <Plus size={13} /> Create Template
              </button>
              <button
                onClick={() => openDrawer('exam', {})}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-surface-hover text-text-main text-[12px] font-bold hover:bg-border transition-all border border-border cursor-pointer"
              >
                <Plus size={13} /> Create Exam
              </button>
            </div>
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
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[30%]" onClick={() => toggleSort('title')}>
                    <div className="flex items-center gap-2">
                      Title {getSortIcon('title')}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[20%]">School</th>
                  <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[15%]">Duration</th>
                  <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">Students</th>
                  <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[15%]">Status</th>
                  <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[10%]" onClick={() => toggleSort('newest')}>
                    <div className="flex items-center gap-2">
                      Created {getSortIcon('newest')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedExams.map((exam) => (
                  <tr 
                    key={exam.id} 
                    onClick={() => router.push(`/exams/${exam.id}`)} 
                    className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-4 align-middle">
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-text-main text-[13px] truncate group-hover:text-accent-primary transition-colors max-w-[250px]" title={exam.title}>{exam.title}</span>
                        {exam.description && <span className="text-[11px] text-text-muted truncate max-w-[250px]" title={exam.description}>{exam.description}</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 align-middle text-[13px] text-text-muted font-medium">{exam.schools?.name || 'Unknown School'}</td>
                    <td className="py-2.5 px-4 align-middle text-[13px] text-text-muted">{exam.duration_minutes} min</td>
                    <td className="py-2.5 px-4 align-middle text-[13px] text-text-muted">{exam.exam_students?.[0]?.count || 0}</td>
                    <td className="py-2.5 px-4 align-middle">
                      <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-lg border ${statusColors[exam.status] || statusColors.draft}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 align-middle text-[13px] text-text-muted whitespace-nowrap">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Template Drawer ────────────────────────────────── */}
      {showTemplateModal && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm" onClick={() => setShowTemplateModal(false)}>
          <div className="bg-bg border-l border-border h-[100dvh] w-full max-w-md p-6 space-y-4 flex flex-col justify-start animate-in slide-in-from-right duration-250" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <h2 className="text-lg font-bold text-text-main">Create Exam Template</h2>
              <button onClick={() => setShowTemplateModal(false)} className="text-text-muted hover:text-text-main transition-colors bg-transparent border-none cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {templateError && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{templateError}</div>}

            <div className="flex-1 overflow-y-auto space-y-4 pt-3 pb-24 pr-1">
              <div className="relative">
                <input type="text" placeholder="JEE Main Mock Test" value={templateForm.title}
                  onChange={e => setTemplateForm({ ...templateForm, title: e.target.value })}
                  className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent"
                />
                <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:text-accent-primary pointer-events-none transition-all duration-200">Template Title *</label>
              </div>

              <div className="relative">
                <textarea placeholder="Short description of the template" value={templateForm.description}
                  onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })}
                  rows={3}
                  className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl p-4 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent resize-none"
                />
                <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:text-accent-primary pointer-events-none transition-all duration-200">Description</label>
              </div>

              <div className="relative">
                <input type="number" placeholder="180" value={templateForm.durationMinutes}
                  onChange={e => setTemplateForm({ ...templateForm, durationMinutes: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                  className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent"
                />
                <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:text-accent-primary pointer-events-none transition-all duration-200">Duration (minutes) *</label>
              </div>

              <h4 className="text-sm font-semibold text-text-main mt-4 border-b border-border/50 pb-1">Default Marking Scheme</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input type="number" step="any" value={templateForm.mcqCorrect} onChange={(e) => setTemplateForm({ ...templateForm, mcqCorrect: e.target.value === '' ? '' : Number(e.target.value) })} className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-10 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent" placeholder="4" />
                  <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 pointer-events-none peer-focus:text-accent-primary">MCQ Correct (+)</label>
                </div>
                <div className="relative">
                  <input type="number" step="any" value={templateForm.mcqWrong} onChange={(e) => setTemplateForm({ ...templateForm, mcqWrong: e.target.value === '' ? '' : Number(e.target.value) })} className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-10 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent" placeholder="-1" />
                  <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 pointer-events-none peer-focus:text-accent-primary">MCQ Wrong (-)</label>
                </div>
                <div className="relative">
                  <input type="number" step="any" value={templateForm.natCorrect} onChange={(e) => setTemplateForm({ ...templateForm, natCorrect: e.target.value === '' ? '' : Number(e.target.value) })} className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-10 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent" placeholder="4" />
                  <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 pointer-events-none peer-focus:text-accent-primary">NAT Correct (+)</label>
                </div>
                <div className="relative">
                  <input type="number" step="any" value={templateForm.natWrong} onChange={(e) => setTemplateForm({ ...templateForm, natWrong: e.target.value === '' ? '' : Number(e.target.value) })} className="peer w-full bg-surface-hover border border-border rounded-xl px-4 h-10 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent" placeholder="0" />
                  <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 pointer-events-none peer-focus:text-accent-primary">NAT Wrong (-)</label>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-text-main mt-4 border-b border-border/50 pb-1">Subjects (Optional)</h4>
              <div className="space-y-3">
                {templateSubjects.map((subject, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input type="text" placeholder="Physics" value={subject.name} onChange={(e) => updateTemplateSubject(index, 'name', e.target.value)} className="peer w-full bg-surface-hover border border-border rounded-xl px-3 h-10 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent" />
                      <label className="absolute -top-2.5 left-2 px-1 bg-bg text-[9px] font-bold text-text-muted uppercase tracking-wider z-10 peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-[11px] peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-focus:-top-2.5 peer-focus:text-[9px] peer-focus:bg-bg peer-focus:font-bold peer-focus:text-accent-primary pointer-events-none transition-all duration-200">Subject Name</label>
                    </div>
                    <div className="relative w-24">
                      <input type="number" placeholder="45" value={subject.questionCount} onChange={(e) => updateTemplateSubject(index, 'questionCount', e.target.value === '' ? '' : Number(e.target.value))} className="peer w-full bg-surface-hover border border-border rounded-xl px-3 h-10 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent" />
                      <label className="absolute -top-2.5 left-2 px-1 bg-bg text-[9px] font-bold text-text-muted uppercase tracking-wider z-10 peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-[11px] peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-focus:-top-2.5 peer-focus:text-[9px] peer-focus:bg-bg peer-focus:font-bold peer-focus:text-accent-primary pointer-events-none transition-all duration-200">Questions</label>
                    </div>
                    {templateSubjects.length > 1 && (
                      <button type="button" onClick={() => removeTemplateSubject(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors bg-transparent border-none cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addTemplateSubject} className="text-[12px] font-bold text-accent-primary hover:text-accent-secondary flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer">
                  <Plus size={14} /> Add Subject
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className="w-full h-12 bg-accent-primary text-white rounded-xl font-bold hover:bg-accent-secondary transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingTemplate ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
