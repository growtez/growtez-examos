'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, Download, X, Clock, Play, AlertCircle, FileText, BarChart, Users, CheckCircle2, Copy, BookOpen, User, Trash2, Pencil } from 'lucide-react';

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
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [isPerPageOpen, setIsPerPageOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const updateMobilePageSize = () => {
      if (window.innerWidth < 768) {
        setPerPage(Math.max(filteredExams.length, 1));
      } else if (perPage > 100) {
        setPerPage(8);
      }
    };

    updateMobilePageSize();
    window.addEventListener('resize', updateMobilePageSize);
    return () => window.removeEventListener('resize', updateMobilePageSize);
  }, [filteredExams.length, perPage]);

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


      {/* Toolbar: heading + search + filters + create */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {/* Title */}
        <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0">
          {role === 'teacher' ? 'Assigned Exams' : 'Your Exams'}
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent-primary/10 text-accent-primary text-[10px] font-bold normal-case tracking-normal">
            {filteredExams.length}
          </span>
        </span>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Search */}
        <div className="relative flex-1 min-w-[140px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full h-8 pl-7 pr-6 bg-surface border border-border rounded-lg text-text-main text-[12px] focus:outline-none focus:border-accent-primary transition-all"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-red-500 bg-transparent border-none cursor-pointer flex items-center p-0.5">
              <X size={10} />
            </button>
          )}
        </div>

        {/* Filter dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border text-[12px] font-medium transition-all cursor-pointer ${
              filterStatus !== 'all'
                ? 'bg-accent-primary text-white border-accent-primary'
                : 'bg-surface border-border text-text-main hover:bg-surface-hover'
            }`}
          >
            <Filter size={12} />
            {filterStatus === 'all' ? 'Filter' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
          </button>
          {isFilterOpen && (
            <div className="absolute left-0 top-full mt-1 w-32 bg-surface border border-border rounded-xl shadow-lg z-50 flex flex-col overflow-hidden py-1">
              {['all', 'draft', 'published', 'active', 'completed'].map(status => (
                <button key={status}
                  onClick={() => { setFilterStatus(status); setPage(1); setIsFilterOpen(false); }}
                  className={`px-3 py-1.5 text-left text-[12px] hover:bg-surface-hover transition-colors ${
                    filterStatus === status ? 'text-accent-primary font-semibold' : 'text-text-main'
                  }`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort */}
        <button
          onClick={() => toggleSort('newest')}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover text-[12px] font-medium transition-all cursor-pointer"
        >
          {getSortIcon('newest')}
          {sortBy === 'oldest' ? 'Oldest' : sortBy === 'title' ? 'A-Z' : 'Newest'}
        </button>


        {/* Trash */}
        {role !== 'teacher' && (
          <Link href="/exams/trash"
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border bg-surface text-text-muted hover:bg-surface-hover text-[12px] font-medium transition-all cursor-pointer">
            <Trash2 size={12} /> Trash
          </Link>
        )}

        {/* Active filter chips */}
        {(searchQuery || filterStatus !== 'all' || sortBy !== 'newest') && (
          <button
            onClick={() => { setSearchQuery(''); setFilterStatus('all'); setSortBy('newest'); setPage(1); }}
            className="inline-flex items-center gap-1 px-2 h-8 rounded-lg text-[11px] text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent border-none"
          >
            <X size={10} /> Clear
          </button>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {/* Pagination */}
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
            <ChevronLeft size={13} />
          </button>
          <span className="text-[11px] font-medium text-text-muted whitespace-nowrap px-1">
            {safePage} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border bg-surface text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer">
            <ChevronRight size={13} />
          </button>

          {/* Per page */}
          <div className="relative">
            <button
              onClick={() => setIsPerPageOpen(!isPerPageOpen)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-border bg-surface text-text-main text-[11px] font-medium hover:bg-surface-hover transition-all cursor-pointer"
            >
              {perPage}/pg
              <ChevronRight size={12} className={`text-text-muted transition-transform duration-200 ${isPerPageOpen ? '-rotate-90' : 'rotate-90'}`} />
            </button>
            {isPerPageOpen && (
              <div className="absolute right-0 top-full mt-1 w-20 bg-surface border border-border rounded-xl shadow-lg z-50 flex flex-col overflow-hidden py-1">
                {[8, 20, 50, 100].map(n => (
                  <button
                    key={n}
                    onClick={() => { setPerPage(n); setPage(1); setIsPerPageOpen(false); }}
                    className={`px-3 py-1.5 text-left text-[11px] hover:bg-surface-hover transition-colors ${
                      perPage === n ? 'text-accent-primary font-bold' : 'text-text-main font-medium'
                    }`}
                  >
                    {n}/pg
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Templates button */}
          {role !== 'teacher' && (
            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover text-[12px] font-medium transition-all cursor-pointer"
            >
              <FileText size={12} className="text-accent-primary" />
              Templates
              {templates.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-accent-primary/10 text-accent-primary text-[10px] font-bold">
                  {templates.length}
                </span>
              )}
            </button>
          )}

          {/* Create button */}
          {role !== 'teacher' && (
            <button onClick={() => handleCreateExam()} disabled={creatingId !== null}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-accent-primary text-white text-[12px] font-bold hover:bg-accent-primary/80 transition-all shrink-0 cursor-pointer disabled:opacity-50">
              <Plus size={12} />
              {creatingId === 'blank' ? 'Creating...' : 'New Exam'}
            </button>
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
                className="relative bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-accent-primary/30 transition-all overflow-hidden flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-text-main tracking-tight truncate" title={exam.title}>{exam.title}</h3>
                    <p className="text-[11px] text-text-muted truncate" title={exam.description}>{exam.description || 'No description'}</p>
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
                  <div key={exam.id} className="bg-surface rounded-xl border border-border hover:border-accent-primary/30 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusColors[exam.status] || statusColors.draft}`}>
                          {exam.status}
                        </span>
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
                        <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide cursor-pointer hover:text-text-main transition-colors w-[38%]" onClick={() => toggleSort('title')}>
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
                        <tr key={exam.id} onClick={() => router.push(`/exams/${exam.id}`)} className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors cursor-pointer">
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 sm:p-8"
          onClick={() => { setIsTemplatesOpen(false); setExpandedTemplateId(null); setTemplateSearchQuery(''); }}
        >
          <div
            className="bg-surface border border-border rounded-2xl shadow-2xl w-full flex flex-col animate-in fade-in zoom-in-95 duration-200"
            style={{ maxHeight: 'calc(100vh - 64px)' }}
            onClick={(e) => e.stopPropagation()}
          >
          {/* Top Bar */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-border shrink-0">
            <button
              onClick={() => { setIsTemplatesOpen(false); setExpandedTemplateId(null); setTemplateSearchQuery(''); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-main transition-all cursor-pointer bg-transparent border-none shrink-0"
            >
              <X size={16} />
            </button>
            <div>
              <h2 className="text-[15px] font-bold text-text-main leading-tight">Choose a Template</h2>
              <p className="text-[11px] text-text-muted">{templates.length} templates available — click a card to start</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={13} />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full h-9 pl-9 pr-8 bg-surface border border-border rounded-xl text-[13px] focus:outline-none focus:border-accent-primary transition-all text-text-main"
                />
                {templateSearchQuery && (
                  <button type="button" onClick={() => setTemplateSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-red-500 bg-transparent border-none cursor-pointer flex items-center p-0.5">
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Template Grid */}
          <div className="flex-1 overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 animate-pulse">
                    <div className="h-5 bg-surface-hover rounded w-2/3" />
                    <div className="h-3 bg-surface-hover rounded w-full" />
                    <div className="h-3 bg-surface-hover rounded w-3/4" />
                    <div className="h-9 bg-surface-hover rounded-xl w-full mt-2" />
                  </div>
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <div className="w-14 h-14 rounded-2xl bg-surface-hover flex items-center justify-center text-text-muted mb-4">
                  <Search size={24} />
                </div>
                <p className="text-[14px] font-bold text-text-main">No templates found</p>
                <p className="text-[12px] text-text-muted mt-1">Try a different search term</p>
                <button onClick={() => setTemplateSearchQuery('')}
                  className="mt-4 px-4 h-8 rounded-lg bg-accent-primary/10 text-accent-primary text-[12px] font-bold hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20 cursor-pointer">
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTemplates.map(template => (
                  <div key={template.id} className="bg-surface border-2 border-accent-primary/30 rounded-2xl p-5 flex flex-col gap-3 hover:border-accent-primary/60 hover:shadow-lg transition-all group">
                    {/* Title */}
                    <div>
                      <h3 className="text-[14px] font-bold text-text-main group-hover:text-accent-primary transition-colors leading-snug">{template.title}</h3>
                      {template.description && (
                        <p className="text-[11px] text-text-muted mt-0.5 leading-snug line-clamp-2">{template.description}</p>
                      )}
                    </div>
                    {/* Stats */}
                    <div className="flex flex-col gap-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Duration</span>
                        <span className="font-semibold text-text-main">{template.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-text-muted shrink-0">Subjects</span>
                        <span className="font-semibold text-text-main text-right truncate" title={template.exam_template_subjects?.map((s: any) => s.subject_name).join(', ')}>
                          {template.exam_template_subjects?.map((s: any) => s.subject_name).join(', ') || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Marking</span>
                        <span className="font-semibold text-text-main">+{template.marking_scheme?.mcq_correct || 0} / {template.marking_scheme?.mcq_wrong || 0}</span>
                      </div>
                    </div>
                    {/* CTA */}
                    <button
                      onClick={() => { handleCreateExam(template.id); setIsTemplatesOpen(false); }}
                      disabled={creatingId !== null}
                      className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-accent-primary/10 text-accent-primary text-[12px] font-bold hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20 cursor-pointer disabled:opacity-50 group-hover:bg-accent-primary group-hover:text-white group-hover:border-accent-primary"
                    >
                      <Plus size={13} /> {creatingId === template.id ? 'Creating...' : 'Use Template'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">or start fresh</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <button
              onClick={() => { handleCreateExam(); setIsTemplatesOpen(false); }}
              disabled={creatingId !== null}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-accent-primary text-white text-[13px] font-bold hover:bg-accent-primary/90 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Plus size={15} /> {creatingId === 'blank' ? 'Creating...' : 'Start with a Blank Exam'}
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
    </div>
  );
}

export default function ExamsListPage() {
  return <ExamsListContent />;
}