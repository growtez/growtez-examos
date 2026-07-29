'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, Download, X, Clock, Play, AlertCircle, FileText, BarChart, Users, CheckCircle2, Copy, BookOpen, User, Trash2, Pencil, Check } from 'lucide-react';
import QuickCreateDrawer from '@/components/QuickCreateDrawer';

const statusColors: Record<string, string> = {
  draft: 'bg-surface-hover text-text-muted border-border',
  published: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20',
  active: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
  completed: 'bg-surface-hover text-text-main border-border',
};

export function ExamsListContent({ schoolIdProp }: { schoolIdProp?: string }) {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [role, setRole] = useState<string>('school_admin');
  const [currentSchoolId, setCurrentSchoolId] = useState<string | undefined>(schoolIdProp);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [confirmBulkDialog, setConfirmBulkDialog] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };


  const handleCreateExam = async (templateId?: string) => {
    const supabase = createClient();
    setCreatingId(templateId || 'blank');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Not authenticated');

      let currentRole = user.user_metadata?.role || 'school_admin';
      let schoolId = schoolIdProp;

      if (!schoolId) {
        if (currentRole === 'school_admin') {
          const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
          schoolId = profile?.school_id;
        } else {
          const { data: profile } = await supabase.from('teachers').select('school_id').eq('id', user.id).single();
          schoolId = profile?.school_id;
        }
      }
      if (!schoolId) throw new Error('School not found');

      // Check current active exam count
      const { count: activeExamCount, error: countError } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_trashed', false);

      if (countError) throw countError;
      if (activeExamCount !== null && activeExamCount >= 20) {
        throw new Error('You have reached the maximum limit of 20 exams. Please delete old exams to clear space before creating a new one.');
      }

      let title = 'Untitled Exam';
      let description = '';
      let duration_minutes = 180;
      let marking_scheme = { mcq_correct: 4, mcq_wrong: -1, nat_correct: 4, nat_wrong: 0 };
      let exam_instructions = [
        'The test contains multiple-choice questions (MCQs) and numerical value questions.',
        'No deduction from the total score will be made if no response is indicated.',
        'The test will automatically end when the time limit is reached.'
      ];
      let templateSubjects: any[] = [];

      if (templateId) {
        const { data: template } = await supabase.from('exam_templates').select('*, exam_template_subjects(*)').eq('id', templateId).single();
        if (template) {
          title = template.title || title;
          description = template.description || description;
          duration_minutes = template.duration_minutes || duration_minutes;
          if (template.marking_scheme) marking_scheme = template.marking_scheme;
          if (template.exam_instructions) exam_instructions = template.exam_instructions;
          if (template.exam_template_subjects) templateSubjects = template.exam_template_subjects;
        }
      }

      const { data: exam, error } = await supabase.from('exams').insert({
        school_id: schoolId,
        title,
        description: description || null,
        duration_minutes,
        status: 'draft',
        marking_scheme,
        exam_instructions,
        created_by: user.id
      }).select().single();

      if (error) throw error;

      if (templateSubjects.length > 0) {
        for (let i = 0; i < templateSubjects.length; i++) {
          const s = templateSubjects[i];
          await supabase.from('exam_subjects').insert({
            exam_id: exam.id,
            subject_name: s.subject_name,
            question_count: s.question_count,
            sort_order: i
          });
        }
      }

      router.push(`/exams/${exam.id}`);
    } catch (error: any) {
      console.error('Error creating exam:', error);
      alert(error.message);
    } finally {
      setCreatingId(null);
    }
  };

  const fetchExams = async () => {
    const supabase = createClient();
    let schoolId: string | undefined = schoolIdProp;
    let currentRole = 'school_admin';
    let userId = '';

    if (!schoolId) {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      userId = user.id;
      currentRole = user.user_metadata?.role || 'school_admin';
      setRole(currentRole);

      if (currentRole === 'school_admin') {
        const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
        schoolId = profile?.school_id;
      } else {
        const { data: profile } = await supabase.from('teachers').select('school_id').eq('id', user.id).single();
        schoolId = profile?.school_id;
      }
      
      if (schoolId) setCurrentSchoolId(schoolId);
    }
    if (!schoolId) return;

    let examQuery = supabase
      .from('exams')
      .select('*, students(count)')
      .eq('school_id', schoolId)
      .eq('is_trashed', false)
      .order('created_at', { ascending: false });

    let assignedTeacherSubjects: any[] = [];

    if (currentRole === 'teacher' && userId) {
      const { data: assignedSubjects } = await supabase.from('exam_subject_teachers').select('exam_subject_id').eq('teacher_id', userId);
      const examSubjectIds = assignedSubjects?.map(s => s.exam_subject_id) || [];
      if (examSubjectIds.length > 0) {
        const { data: subjects } = await supabase.from('exam_subjects').select('exam_id, subject_name, id').in('id', examSubjectIds);
        assignedTeacherSubjects = subjects || [];
        const uniqueExamIds = Array.from(new Set(subjects?.map(s => s.exam_id) || []));
        if (uniqueExamIds.length > 0) {
          examQuery = examQuery.in('id', uniqueExamIds);
        } else {
          setExams([]);
          setLoading(false);
          return;
        }
      } else {
        setExams([]);
        setLoading(false);
        return;
      }
    }

    const { data } = await examQuery;

    const { data: templatesData } = await supabase
      .from('exam_templates')
      .select('*, exam_template_subjects(*)')
      .order('created_at', { ascending: true });

    if (currentRole === 'teacher' && data) {
      const mappedExams = data.map(exam => ({
        ...exam,
        teacherSubjects: assignedTeacherSubjects.filter(s => s.exam_id === exam.id)
      }));
      setExams(mappedExams);
    } else {
      setExams(data || []);
    }

    setTemplates(templatesData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchExams();
    window.addEventListener('refresh-tables', fetchExams);
    return () => window.removeEventListener('refresh-tables', fetchExams);
  }, []);

  const filteredExams = exams
    .filter(exam => {
      const matchesSearch = (exam.title || '').toLowerCase().includes(searchQuery.toLowerCase());
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

  const filteredTemplates = templates.filter(t =>
    t.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(templateSearchQuery.toLowerCase()))
  );

  const getPaginationPages = () => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage === totalPages) return [1, '...', totalPages];
    if (safePage === totalPages - 1) return [safePage - 1, safePage, totalPages];
    return [safePage, '...', totalPages];
  };

  const toggleSort = (newSort: string) => {
    if (sortBy === newSort) setSortBy(newSort === 'newest' ? 'oldest' : newSort === 'title' ? 'newest' : 'newest');
    else setSortBy(newSort);
  };

  const getSortIcon = (field: string) => {
    if (sortBy === field) return <ArrowUp size={14} />;
    if (field === 'newest' && sortBy === 'oldest') return <ArrowDown size={14} />;
    return <ArrowUpDown size={14} className="opacity-30" />;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleDeleteExam = (exam: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget({ id: exam.id, title: exam.title });
  };

  const confirmDeleteExam = async () => {
    if (!deleteTarget) return;
    const supabase = createClient();
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('exams').update({ is_trashed: true }).eq('id', deleteTarget.id);
      if (error) throw error;
      setExams(prev => prev.filter(ex => ex.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error: any) {
      console.error('Error deleting exam:', error);
      alert(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedExams.length === 0) return;
    setIsBulkDeleting(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.from('exams').update({ is_trashed: true }).in('id', selectedExams);
      if (error) throw error;
      setExams(prev => prev.filter(ex => !selectedExams.includes(ex.id)));
      setSelectedExams([]);
      setConfirmBulkDialog(false);
    } catch (err: any) {
      console.error('Error in bulk delete:', err);
      alert(err.message);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedExams(pagedExams.map(ex => ex.id));
    } else {
      setSelectedExams([]);
    }
  };

  const handleSelectExam = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedExams(prev =>
      prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Title,Duration,Status,Created At\n"
      + filteredExams.map(r => `${r.title},${r.duration_minutes},${r.status},${new Date(r.created_at).toLocaleDateString()}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `exams_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto">

      <div className="mb-4 hidden md:flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-text-main tracking-tight">
              {role === 'teacher' ? 'Assigned Exams' : 'Exams Management'}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Total exams: {filteredExams.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {role !== 'teacher' && (
            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover hover:border-accent-primary/30 text-sm font-medium transition-all cursor-pointer"
            >
              <FileText size={14} className="text-accent-primary" />
              Templates
              {templates.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent-primary/10 text-accent-primary text-[10px] font-bold">
                  {templates.length}
                </span>
              )}
            </button>
          )}
          {role !== 'teacher' && (
            <button onClick={() => handleCreateExam()} disabled={creatingId !== null}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-accent-primary text-white text-[12px] font-bold hover:bg-accent-primary/90 hover:shadow-md hover:shadow-accent-primary/20 transition-all shrink-0 disabled:opacity-50 cursor-pointer border-none">
              <Plus size={14} />
              {creatingId === 'blank' ? 'Creating...' : 'New Exam'}
            </button>
          )}
        </div>
      </div>

      {/* Control Panel — matches teachers/results page structure */}
      <div className="flex flex-row flex-wrap md:flex-nowrap items-center justify-between gap-2 md:gap-3 w-full bg-surface p-2 rounded-xl shadow-sm border border-border mb-4">
        {/* Search Box (Row 1 Left on Mobile) */}
        <div className="relative flex-1 md:flex-none md:w-[260px] order-1 md:order-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder={`Search Exams (${filteredExams.length})...`}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); setSelectedExams([]); }}
            className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
          />
          {searchQuery && (
            <button type="button" onClick={() => { setSearchQuery(''); setPage(1); setSelectedExams([]); }}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-text-muted hover:text-red-500 bg-transparent p-1 rounded-md transition-colors border-none cursor-pointer flex items-center justify-center">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Action Buttons: Sort & Filter (Row 1 Right on Mobile) */}
        <div className="flex items-center gap-2 order-2 md:order-4 shrink-0">
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex md:hidden items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium cursor-pointer"
            >
              <ArrowUpDown size={14} className="text-accent-primary" />
            </button>
            <div className={`absolute right-0 top-full mt-2 w-40 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col p-1.5 space-y-0.5 md:hidden ${isSortOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
              <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">Sort By</div>
              {[
                { id: 'newest', label: 'Newest First' },
                { id: 'oldest', label: 'Oldest First' },
                { id: 'title', label: 'Title (A-Z)' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setSortBy(opt.id); setPage(1); setIsSortOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-none flex items-center justify-between ${sortBy === opt.id ? 'bg-accent-primary/10 text-accent-primary font-bold' : 'text-text-main hover:bg-surface-hover'}`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <Check size={14} className="text-accent-primary" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleSort('newest')}
            className="hidden md:flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium cursor-pointer"
          >
            {getSortIcon('newest')}
            <span>{sortBy === 'oldest' ? 'Oldest' : sortBy === 'title' ? 'A-Z' : 'Newest'}</span>
          </button>
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium cursor-pointer"
            >
              <Filter size={14} className="text-accent-primary" /> <span className="hidden md:inline">Filter</span>
            </button>
            <div className={`absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col p-1.5 space-y-0.5 ${isFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
              <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">Filter</div>
              {[
                { id: 'all', label: 'All Status' },
                { id: 'draft', label: 'Draft' },
                { id: 'published', label: 'Published' },
                { id: 'active', label: 'Active' },
                { id: 'completed', label: 'Completed' }
              ].map(status => (
                <button
                  key={status.id}
                  type="button"
                  onClick={() => { setFilterStatus(status.id); setPage(1); setSelectedExams([]); setIsFilterOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-none flex items-center justify-between ${filterStatus === status.id ? 'bg-accent-primary/10 text-accent-primary font-bold' : 'text-text-main hover:bg-surface-hover'}`}
                >
                  <span>{status.label}</span>
                  {filterStatus === status.id && <Check size={14} className="text-accent-primary" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2 on Mobile: Templates & New Exam Buttons */}
        {role !== 'teacher' && (
          <div className="w-full flex md:hidden items-center justify-between gap-2 order-3 border-t border-border/40 pt-2 pb-0.5 px-1">
            <button
              type="button"
              onClick={() => setIsTemplatesOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover text-[12px] font-medium transition-all cursor-pointer"
            >
              <FileText size={14} className="text-accent-primary" />
              Templates
              {templates.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent-primary/10 text-accent-primary text-[10px] font-bold">
                  {templates.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleCreateExam()}
              disabled={creatingId !== null}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-accent-primary text-white text-[12px] font-bold hover:bg-accent-primary/90 transition-all disabled:opacity-50 cursor-pointer border-none"
            >
              <Plus size={14} />
              {creatingId === 'blank' ? 'Creating...' : 'New Exam'}
            </button>
          </div>
        )}

        {/* Row 3 on Mobile: Page Navigation + Items Per Page Dropdown */}
        <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto order-4 md:order-3 shrink-0 md:border-x md:border-border/50 px-1 md:px-3 py-1.5 md:py-0 border-t md:border-t-0 border-border/40">
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); setSelectedExams([]); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer">
            {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => { setPage(p => Math.max(1, p - 1)); setSelectedExams([]); }} disabled={safePage === 1} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center justify-center gap-1 w-[80px]">
              {getPaginationPages().map((p, i) => p === '...' ? (
                <div key={`ellipsis-${i}`} className="w-6 h-6 flex items-center justify-center text-[11px] text-text-muted">…</div>
              ) : (
                <button type="button" key={p} onClick={() => { setPage(p as number); setSelectedExams([]); }} className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-semibold transition-colors border-none cursor-pointer ${safePage === p ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-surface-hover bg-transparent'}`}>{p as number}</button>
              ))}
            </div>
            <button type="button" onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setSelectedExams([]); }} disabled={safePage === totalPages} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Row 4 on Mobile: Inline Active Filters */}
        <div className={`w-full md:w-auto md:flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0 order-5 md:order-2 border-t md:border-t-0 border-border/40 ${!(searchQuery || filterStatus !== 'all' || sortBy !== 'newest' || selectedExams.length > 0) ? 'hidden md:flex' : ''}`}>
          {(searchQuery || filterStatus !== 'all' || sortBy !== 'newest' || selectedExams.length > 0) ? (
            <>
              <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  "{searchQuery}"
                  <button type="button" onClick={() => setSearchQuery('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {filterStatus}
                  <button type="button" onClick={() => setFilterStatus('all')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {sortBy !== 'newest' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  {sortBy === 'oldest' ? 'Oldest' : sortBy === 'title' ? 'A-Z' : sortBy}
                  <button type="button" onClick={() => setSortBy('newest')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                </span>
              )}
              {selectedExams.length > 0 && role !== 'teacher' && (
                <button
                  type="button"
                  onClick={() => setConfirmBulkDialog(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 text-[11px] font-bold border border-red-500/20 shrink-0 cursor-pointer"
                >
                  <Trash2 size={10} /> Delete ({selectedExams.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setFilterStatus('all'); setSortBy('newest'); setPage(1); setSelectedExams([]); }}
                className="text-[11px] text-text-muted hover:text-red-500 transition-colors ml-1 bg-transparent border-none cursor-pointer font-medium shrink-0"
              >
                Clear
              </button>
            </>
          ) : (
            <span className="text-[11px] text-text-muted italic opacity-50">No active filters</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full animate-pulse">
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-3"><div className="h-3 bg-bg rounded w-3/4"></div></td>
                  <td className="px-4 py-3"><div className="h-3 bg-bg rounded w-1/2"></div></td>
                  <td className="px-4 py-3"><div className="h-3 bg-bg rounded w-1/3"></div></td>
                  <td className="px-4 py-3"><div className="h-5 bg-bg rounded w-16"></div></td>
                  <td className="px-4 py-3"><div className="h-3 bg-bg rounded w-2/3"></div></td>
                  <td className="px-4 py-3"><div className="h-5 bg-bg rounded w-12 ml-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-3">
            <FileText size={20} />
          </div>
          <h3 className="text-text-main font-bold text-sm">No exams yet</h3>
          <p className="text-text-muted mt-0.5 text-xs">
            {role === 'teacher' ? "You haven't been assigned any exams yet." : "Create your first exam to get started"}
          </p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-text-muted mb-3">
            <Search size={18} />
          </div>
          <h3 className="text-text-main font-bold text-sm">No matching exams</h3>
          <p className="text-text-muted mt-0.5 text-xs">
            {searchQuery ? `No results for "${searchQuery}"` : 'Try adjusting your filters'}
          </p>
          <button
            onClick={() => { setSearchQuery(''); setFilterStatus('all'); setSortBy('newest'); setPage(1); }}
            className="mt-3 inline-flex items-center gap-1.5 px-3 h-7 rounded-lg bg-accent-primary/10 text-accent-primary text-[11px] font-bold hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20 cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>

          <div className="md:hidden space-y-3">
            {pagedExams.map((exam) => (
              <div
                key={exam.id}
                onClick={() => router.push(`/exams/${exam.id}`)}
                className={`relative bg-surface border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer ${selectedExams.includes(exam.id) ? 'border-accent-primary ring-1 ring-accent-primary/20' : 'border-border hover:border-accent-primary/30'}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div onClick={(e) => e.stopPropagation()} className="pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                        checked={selectedExams.includes(exam.id)}
                        onChange={(e) => handleSelectExam(exam.id, e)}
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-text-main tracking-tight truncate" title={exam.title}>{exam.title}</h3>
                      <p className="text-[11px] text-text-muted truncate" title={exam.description}>{exam.description || 'No description'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border shrink-0 ${statusColors[exam.status] || statusColors.draft}`}>
                    {exam.status}
                  </span>
                </div>
                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted">Duration</span>
                    <span className="font-semibold text-text-main">{exam.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted">Students</span>
                    <span className="font-semibold text-text-main">{exam.students?.[0]?.count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted">Created</span>
                    <span className="font-semibold text-text-main">{formatDate(exam.created_at)}</span>
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/exams/${exam.id}`)}
                    aria-label="Edit exam"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-accent-primary/10 text-accent-primary text-[12px] font-bold hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20 cursor-pointer active:scale-[0.98]"
                  >
                    <Pencil size={14} />
                  </button>
                  {role !== 'teacher' && (
                    <button
                      onClick={(e) => handleDeleteExam(exam, e)}
                      aria-label="Delete exam"
                      className="flex items-center justify-center py-2 px-4 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 cursor-pointer active:scale-[0.98]"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            {role === 'teacher' ? (
              /* Teacher Card View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagedExams.map((exam) => (
                  <div key={exam.id} onClick={() => router.push(`/exams/${exam.id}`)} className={`bg-surface rounded-xl border hover:shadow-md transition-all flex flex-col overflow-hidden group cursor-pointer ${selectedExams.includes(exam.id) ? 'border-accent-primary ring-1 ring-accent-primary/20' : 'border-border hover:border-accent-primary/30'}`}>
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div onClick={(e) => e.stopPropagation()} className="cursor-pointer flex items-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                              checked={selectedExams.includes(exam.id)}
                              onChange={(e) => handleSelectExam(exam.id, e)}
                            />
                          </div>
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusColors[exam.status] || statusColors.draft}`}>
                            {exam.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-muted">{formatDate(exam.created_at)}</span>
                      </div>
                      <h3 className="text-sm font-bold text-text-main mb-1 group-hover:text-accent-primary transition-colors line-clamp-1" title={exam.title}>{exam.title}</h3>
                      <p className="text-[11px] text-text-muted flex items-center gap-1 mb-3">
                        <span className="w-1 h-1 rounded-full bg-accent-primary/40"></span>
                        {exam.duration_minutes} mins
                      </p>
                      <div className="bg-bg rounded-lg p-2 border border-border">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-1">Assigned Subjects</p>
                        <div className="flex flex-wrap gap-1">
                          {exam.teacherSubjects && exam.teacherSubjects.length > 0 ? (
                            exam.teacherSubjects.map((ts: any) => (
                              <span key={ts.id} className="inline-flex px-1.5 py-0.5 bg-surface text-accent-primary border border-border text-[10px] font-bold rounded">
                                {ts.subject_name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-text-muted">No specific subjects</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => router.push(`/exams/${exam.id}`)}
                        className="w-full py-2 bg-accent-primary hover:bg-accent-primary/80 text-white text-[12px] font-bold rounded-lg transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                      >
                        {exam.status === 'completed' ? 'View Details' : 'Prepare Questions'}
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Standard Admin Table View */
              <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                    <thead>
                      <tr className="border-b border-border bg-surface-hover/50">
                        <th className="py-2 px-3 w-[40px] text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                            checked={pagedExams.length > 0 && selectedExams.length === pagedExams.length}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide cursor-pointer hover:text-text-main transition-colors" onClick={() => toggleSort('title')}>
                          <div className="flex items-center gap-1.5">Title {getSortIcon('title')}</div>
                        </th>
                        <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide w-[12%]">Duration</th>
                        <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide w-[10%]">Students</th>
                        <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide w-[13%]">Status</th>
                        <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide cursor-pointer hover:text-text-main transition-colors w-[15%]" onClick={() => toggleSort('newest')}>
                          <div className="flex items-center gap-1.5">Created {getSortIcon('newest')}</div>
                        </th>
                        <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide w-[12%] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedExams.map((exam) => (
                        <tr key={exam.id} onClick={() => router.push(`/exams/${exam.id}`)} className={`group border-b border-border/40 last:border-b-0 transition-colors cursor-pointer ${selectedExams.includes(exam.id) ? 'bg-accent-primary/5' : 'even:bg-bg hover:bg-surface-hover'}`}>
                          <td className="py-2 px-3 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                              checked={selectedExams.includes(exam.id)}
                              onChange={(e) => handleSelectExam(exam.id, e)}
                            />
                          </td>
                          <td className="py-2 px-3 align-middle">
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-text-main text-[12px] truncate group-hover:text-accent-primary transition-colors max-w-[240px]" title={exam.title}>{exam.title}</span>
                              {exam.description && <span className="text-[10px] text-text-muted truncate max-w-[240px]" title={exam.description}>{exam.description}</span>}
                            </div>
                          </td>
                          <td className="py-2 px-3 align-middle text-[12px] text-text-muted">{exam.duration_minutes} min</td>
                          <td className="py-2 px-3 align-middle text-[12px] text-text-muted">{exam.students?.[0]?.count || 0}</td>
                          <td className="py-2 px-3 align-middle">
                            <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${statusColors[exam.status] || statusColors.draft}`}>
                              {exam.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 align-middle text-[12px] text-text-muted whitespace-nowrap">{formatDate(exam.created_at)}</td>
                          <td className="py-2 px-3 align-middle text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); router.push(`/exams/${exam.id}`); }}
                                aria-label="Edit exam"
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20 cursor-pointer"
                              >
                                <Pencil size={12} />
                              </button>
                              {role !== 'teacher' && (
                                <button
                                  onClick={(e) => handleDeleteExam(exam, e)}
                                  aria-label="Delete exam"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Templates Popup Modal */}
      {isTemplatesOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={() => { setIsTemplatesOpen(false); setExpandedTemplateId(null); setTemplateSearchQuery(''); }}
        >
          <div
            className="bg-surface border border-border rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-[1200px] flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 h-[90vh] sm:h-auto"
            style={{ maxHeight: 'calc(100vh - 64px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 sm:px-6 sm:py-5 border-b border-border shrink-0 bg-surface z-10 rounded-t-3xl sm:rounded-t-2xl relative">

              {/* Mobile drag handle (visual only) */}
              <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-1 sm:hidden" />

              <div className="flex justify-between items-center w-full sm:w-auto">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary hidden sm:flex">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-text-main leading-tight">Choose a Template</h2>
                    <p className="text-xs text-text-muted mt-0.5">{templates.length} templates available</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsTemplatesOpen(false); setExpandedTemplateId(null); setTemplateSearchQuery(''); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover text-text-muted hover:text-text-main hover:bg-border transition-all cursor-pointer sm:hidden"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="sm:ml-auto flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-8 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-text-main"
                  />
                  {templateSearchQuery && (
                    <button type="button" onClick={() => setTemplateSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-red-500 bg-surface p-1 rounded-md cursor-pointer transition-colors">
                      <X size={12} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(true)}
                  className="flex items-center gap-2 h-10 px-4 rounded-xl bg-accent-primary text-white font-bold hover:bg-accent-primary/90 transition-all text-sm shrink-0"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Create Custom Template</span>
                  <span className="sm:hidden">Create</span>
                </button>
                <button
                  onClick={() => { setIsTemplatesOpen(false); setExpandedTemplateId(null); setTemplateSearchQuery(''); }}
                  className="w-10 h-10 items-center justify-center rounded-xl border border-border text-text-muted hover:bg-surface-hover hover:text-text-main transition-all cursor-pointer hidden sm:flex shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Template Grid */}
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 bg-bg/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 animate-pulse shadow-sm">
                      <div className="h-5 bg-surface-hover rounded w-2/3" />
                      <div className="h-3 bg-surface-hover rounded w-full" />
                      <div className="h-3 bg-surface-hover rounded w-3/4" />
                      <div className="h-9 bg-surface-hover rounded-xl w-full mt-2" />
                    </div>
                  ))}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20 px-4">
                  <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center text-text-muted mb-4 shadow-inner">
                    <Search size={28} />
                  </div>
                  <p className="text-base font-bold text-text-main">No templates found</p>
                  <p className="text-sm text-text-muted mt-1 max-w-xs">We couldn't find any templates matching "{templateSearchQuery}"</p>
                  <button onClick={() => setTemplateSearchQuery('')}
                    className="mt-5 px-5 h-9 rounded-xl bg-accent-primary/10 text-accent-primary text-sm font-bold hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20 cursor-pointer shadow-sm">
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 sm:pb-0">
                  {filteredTemplates.map(template => (
                    <div key={template.id} className="bg-surface border border-border rounded-2xl p-5 flex flex-col hover:border-accent-primary/50 hover:shadow-lg hover:shadow-accent-primary/5 transition-all group relative overflow-hidden">
                      {/* Decorative accent top line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-primary/40 to-accent-secondary/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Title */}
                      <div className="mb-4">
                        <h3 className="text-base font-extrabold text-text-main group-hover:text-accent-primary transition-colors leading-tight mb-1">{template.title}</h3>
                        {template.description && (
                          <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{template.description}</p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex flex-col gap-2.5 text-xs bg-bg/50 rounded-xl p-3 mb-4 border border-border/50 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-text-muted flex items-center gap-1.5"><Clock size={12} /> Duration</span>
                          <span className="font-bold text-text-main">{template.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-text-muted flex items-center gap-1.5"><CheckCircle2 size={12} /> Marking</span>
                          <span className="font-bold text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded-md">+{template.marking_scheme?.mcq_correct || 0} / {template.marking_scheme?.mcq_wrong || 0}</span>
                        </div>
                        <div className="flex flex-col gap-2 pt-2 mt-0.5 border-t border-border/50">
                          <span className="text-text-muted flex items-center gap-1.5"><BookOpen size={12} /> Subjects</span>
                          <div className="flex flex-wrap gap-1.5">
                            {template.exam_template_subjects && template.exam_template_subjects.length > 0 ? (
                              template.exam_template_subjects.map((s: any, idx: number) => (
                                <span key={idx} className="bg-surface shadow-sm border border-border/60 text-text-main px-2 py-1 rounded-md text-[10px] font-bold leading-none">
                                  {s.subject_name}
                                </span>
                              ))
                            ) : (
                              <span className="font-bold text-text-main">—</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => { handleCreateExam(template.id); setIsTemplatesOpen(false); }}
                        disabled={creatingId !== null}
                        className="mt-auto flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-accent-primary text-white text-sm font-bold hover:bg-accent-primary/90 transition-all shadow-sm cursor-pointer disabled:opacity-50 hover:shadow-accent-primary/20 hover:-translate-y-0.5"
                      >
                        <Copy size={14} /> {creatingId === template.id ? 'Creating...' : 'Use Template'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer (Start Fresh) */}
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-t border-border shrink-0 bg-surface rounded-b-3xl sm:rounded-b-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
                <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-[0.2em]">OR START FRESH</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border" />
              </div>
              <button
                onClick={() => { handleCreateExam(); setIsTemplatesOpen(false); }}
                disabled={creatingId !== null}
                className="w-full sm:w-1/2 mx-auto flex items-center justify-center gap-2 h-12 rounded-xl bg-bg border-2 border-border text-text-main text-sm font-extrabold hover:border-text-main hover:bg-text-main hover:text-bg transition-all cursor-pointer disabled:opacity-50"
              >
                <Plus size={16} /> {creatingId === 'blank' ? 'Creating...' : 'Create Blank Exam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          <div
            className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
              <Trash2 size={22} />
            </div>
            <h3 className="text-text-main font-bold text-base">Delete this exam?</h3>
            <p className="text-text-muted text-sm mt-1.5">
              <span className="font-semibold text-text-main">{deleteTarget.title}</span> will be moved to trash. You can restore it later from the Trash page.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-border text-text-main text-sm font-bold hover:bg-surface-hover transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteExam}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {confirmBulkDialog && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !isBulkDeleting && setConfirmBulkDialog(false)}
        >
          <div
            className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-sm p-5 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
              <Trash2 size={22} />
            </div>
            <h3 className="text-text-main font-bold text-base">Delete {selectedExams.length} {selectedExams.length === 1 ? 'exam' : 'exams'}?</h3>
            <p className="text-text-muted text-sm mt-1.5">
              The selected exams will be moved to trash. You can restore them later from the Trash page.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setConfirmBulkDialog(false)}
                disabled={isBulkDeleting}
                className="flex-1 py-2.5 rounded-xl border border-border text-text-main text-sm font-bold hover:bg-surface-hover transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                disabled={isBulkDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all cursor-pointer disabled:opacity-50"
              >
                {isBulkDeleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      <QuickCreateDrawer
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        activeForm="template"
        setActiveForm={() => {}}
        onRefresh={fetchExams}
        examPrefill={{ schoolId: currentSchoolId || schoolIdProp }}
        hideTabs={true}
      />
    </div>
  );
}

export default function ExamsListPage() {
  return <ExamsListContent />;
}