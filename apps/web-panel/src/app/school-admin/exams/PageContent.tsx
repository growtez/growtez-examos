'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, FileText, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Download, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
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
      .select('*, exam_students(count)')
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
      .order('created_at', { ascending: false });

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">
            {role === 'teacher' ? 'My Assigned Exams' : 'Exams'}
          </h2>
          <p className="text-text-muted mt-1 text-sm font-medium">
            {role === 'teacher' 
              ? 'Manage and prepare questions for your assigned subjects.' 
              : 'Create and manage examinations'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {role !== 'teacher' && (
            <>
              <Link href="/exams/trash"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border text-text-main text-sm font-semibold rounded-xl hover:border-accent-primary hover:text-accent-primary hover:bg-surface-hover transition-all shadow-sm">
                <Trash2 size={18} />
                Trash
              </Link>
              <button onClick={() => handleCreateExam()} disabled={creatingId !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-white text-sm font-semibold rounded-xl hover:bg-accent-primary/80 hover:shadow-lg hover:shadow-accent-primary/30 transition-all active:scale-95 disabled:opacity-50">
                <Plus size={18} />
                {creatingId === 'blank' ? 'Creating...' : 'Create Exam'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Global Template Presets */}
      {role !== 'teacher' && templates.length > 0 && (
        <div className="mb-8 mt-2">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Exam Templates</span>
              <div className="h-4 w-px bg-border hidden lg:block" />
              <span className="text-[10px] text-accent-primary/60 font-medium flex items-center animate-pulse">Scroll horizontally for more</span>
            </div>
            
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
                <input 
                  type="text" 
                  placeholder="Search templates..."
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  className="w-full lg:w-48 h-8 pl-7 pr-3 bg-surface-hover border border-border rounded-lg text-[11px] focus:outline-none focus:border-accent-primary transition-all text-text-main"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* Templates Slider */}
            <div className="relative w-full overflow-hidden rounded-2xl group/slider">
              
              {/* Scroll Left Button */}
              <button 
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 mb-2 w-8 h-8 flex items-center justify-center bg-surface border border-border rounded-full shadow-lg text-accent-primary hover:bg-accent-primary hover:text-white transition-all opacity-0 invisible group-hover/slider:opacity-100 group-hover/slider:visible cursor-pointer z-20"
              >
                <ChevronLeft size={18} />
              </button>

              <div ref={sliderRef} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth w-full h-full [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-text-muted/40">
                {filteredTemplates.map(template => (
                <div key={template.id} className="relative bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-accent-primary/30 transition-all group overflow-hidden flex flex-col w-[280px] shrink-0 snap-start">
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
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="text-text-muted shrink-0">Subjects</span>
                      <span className="font-semibold text-text-main truncate max-w-[120px]" title={template.exam_template_subjects?.map((s: any) => s.subject_name).join(' · ')}>
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
                    onClick={() => handleCreateExam(template.id)}
                    disabled={creatingId !== null}
                    className="mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-accent-primary/10 text-accent-primary text-[12px] font-bold hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20 cursor-pointer disabled:opacity-50"
                  >
                    <Plus size={13} /> {creatingId === template.id ? 'Creating...' : 'Use Template'}
                  </button>
                </div>
              ))}
              </div>
              
              {/* Scroll Right Button */}
              <button 
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 mb-2 w-8 h-8 flex items-center justify-center bg-surface border border-border rounded-full shadow-lg text-accent-primary hover:bg-accent-primary hover:text-white transition-all opacity-0 invisible group-hover/slider:opacity-100 group-hover/slider:visible cursor-pointer z-20"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border mb-4">
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

      {loading ? (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full animate-pulse">
            <thead>
              <tr className="bg-bg">
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
                  <td className="px-6 py-5"><div className="h-4 bg-bg rounded w-3/4 mb-2"></div><div className="h-3 bg-bg rounded w-1/2"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-bg rounded w-1/2"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-bg rounded w-1/3"></div></td>
                  <td className="px-6 py-5"><div className="h-6 bg-bg rounded w-20"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-bg rounded w-2/3"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-bg rounded w-12 ml-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-4">
            <FileText size={32} />
          </div>
          <h3 className="text-text-main font-bold text-lg">No exams yet</h3>
          <p className="text-text-muted mt-1 text-sm font-medium">
            {role === 'teacher' ? "You haven't been assigned any exams yet." : "Create your first exam to get started"}
          </p>
        </div>
      ) : role === 'teacher' ? (
        /* Teacher Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pagedExams.map((exam) => (
            <div key={exam.id} className="bg-surface rounded-2xl border border-border hover:border-accent-primary/30 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusColors[exam.status] || statusColors.draft}`}>
                    {exam.status}
                  </span>
                  <span className="text-xs text-text-muted font-medium">{new Date(exam.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-bold text-text-main mb-1 group-hover:text-accent-primary transition-colors line-clamp-1" title={exam.title}>{exam.title}</h3>
                <p className="text-xs text-text-muted font-medium flex items-center gap-1.5 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-primary/40"></span>
                  Duration: {exam.duration_minutes} mins
                </p>

                <div className="bg-bg rounded-xl p-3 border border-border">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted mb-1.5">Your Assigned Subjects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {exam.teacherSubjects && exam.teacherSubjects.length > 0 ? (
                      exam.teacherSubjects.map((ts: any) => (
                        <span key={ts.id} className="inline-flex px-2 py-1 bg-surface text-accent-primary border border-border text-[11px] font-bold rounded-lg shadow-sm">
                          {ts.subject_name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-text-muted">No specific subjects</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-border bg-gray-50/50">
                <button
                  onClick={() => router.push(`/exams/${exam.id}`)}
                  className="w-full py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 group-hover:shadow-md active:scale-[0.98]"
                >
                  {exam.status === 'completed' ? 'View Exam Details' : 'Prepare Questions'}
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Standard Admin Table View */
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
              <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[35%]" onClick={() => toggleSort('title')}>
                  <div className="flex items-center gap-2">Title {getSortIcon('title')}</div>
                </th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[15%]">Duration</th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%]">Students</th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[15%]">Status</th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[15%]" onClick={() => toggleSort('newest')}>
                  <div className="flex items-center gap-2">Created {getSortIcon('newest')}</div>
                </th>
                <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedExams.map((exam) => (
                <tr key={exam.id} onClick={() => router.push(`/exams/${exam.id}`)} className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors cursor-pointer">
                  <td className="py-2.5 px-4 align-middle">
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-text-main text-[13px] truncate group-hover:text-accent-primary transition-colors max-w-[250px]" title={exam.title}>{exam.title}</span>
                      {exam.description && <span className="text-[11px] text-text-muted truncate max-w-[250px]" title={exam.description}>{exam.description}</span>}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 align-middle text-[13px] text-text-muted">{exam.duration_minutes} min</td>
                  <td className="py-2.5 px-4 align-middle text-[13px] text-text-muted">{exam.exam_students?.[0]?.count || 0}</td>
                  <td className="py-2.5 px-4 align-middle">
                    <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase rounded-lg border ${statusColors[exam.status] || statusColors.draft}`}>
                      {exam.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 align-middle text-[13px] text-text-muted whitespace-nowrap">{new Date(exam.created_at).toLocaleDateString()}</td>
                  <td className="py-2.5 px-4 align-middle text-right">
                    <span className="text-accent-primary group-hover:text-accent-secondary text-[13px] font-medium transition-colors">
                      Manage
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamsListPage() {
  return <ExamsListContent />;
}
