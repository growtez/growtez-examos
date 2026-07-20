import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { FileText, Clock, Users, BookOpen, Calendar, Award, School as SchoolIcon } from 'lucide-react';
import Link from 'next/link';
import DeleteExamButton from '../DeleteExamButton';

const statusColors: Record<string, string> = {
  draft: 'bg-surface-hover text-text-muted border-border',
  published: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  completed: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
};

export default async function ExamDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: exam } = await supabase
    .from('exams')
    .select('*, schools(id, name, domain)')
    .eq('id', params.id)
    .single();

  if (!exam) return notFound();

  // Get counts and subjects concurrently
  const [
    { count: studentCount },
    { data: subjects },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('exam_id', exam.id),
    supabase
      .from('exam_subjects')
      .select('*, exam_subject_teachers(*, teachers:teacher_id(full_name))')
      .eq('exam_id', exam.id)
      .order('sort_order'),
  ]);

  // Fetch question counts per subject
  const questionCounts: Record<string, number> = {};
  let totalQuestions = 0;
  for (const s of (subjects || [])) {
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('exam_subject_id', s.id);
    questionCounts[s.id] = count ?? 0;
    totalQuestions += count ?? 0;
  }

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20 shrink-0 shadow-sm">
              <FileText size={28} className="text-accent-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-text-main truncate">{exam.title}</h2>
              {exam.description && (
                <p className="text-text-muted text-sm mt-1 truncate max-w-md">{exam.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide uppercase shrink-0 border ${statusColors[exam.status] || statusColors.draft}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${exam.status === 'active' ? 'bg-emerald-500 animate-pulse' : exam.status === 'published' ? 'bg-blue-500' : exam.status === 'completed' ? 'bg-violet-500' : 'bg-text-muted'}`} />
              {exam.status}
            </span>
            <div className="bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl border border-red-500/20 transition-colors">
              <DeleteExamButton examId={exam.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:border-accent-primary/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[11px] text-text-muted font-medium">Duration</p>
            <p className="text-lg font-bold text-text-main">{exam.duration_minutes} min</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:border-accent-primary/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[11px] text-text-muted font-medium">Students</p>
            <p className="text-lg font-bold text-text-main">{studentCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:border-accent-primary/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-[11px] text-text-muted font-medium">Subjects</p>
            <p className="text-lg font-bold text-text-main">{subjects?.length ?? 0}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:border-accent-primary/30 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[11px] text-text-muted font-medium">Questions</p>
            <p className="text-lg font-bold text-text-main">{totalQuestions}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
              <Calendar size={18} className="text-accent-primary" />
              <h3 className="text-[15px] font-bold text-text-main">Exam Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Start Time</p>
                <p className="text-[14px] font-medium text-text-main">{formatDate(exam.start_time)}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">End Time</p>
                <p className="text-[14px] font-medium text-text-main">{formatDate(exam.end_time)}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Total Marks</p>
                <p className="text-[14px] font-medium text-text-main">{exam.total_marks ?? '—'}</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Created On</p>
                <p className="text-[14px] font-medium text-text-main">{formatDate(exam.created_at)}</p>
              </div>
              {exam.marking_scheme && (
                <>
                  <div>
                    <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">MCQ Correct / Wrong</p>
                    <p className="text-[14px] font-medium text-text-main">
                      <span className="text-emerald-500">+{exam.marking_scheme.mcq_correct}</span>
                      {' / '}
                      <span className="text-red-500">{exam.marking_scheme.mcq_wrong}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">NAT Correct / Wrong</p>
                    <p className="text-[14px] font-medium text-text-main">
                      <span className="text-emerald-500">+{exam.marking_scheme.nat_correct}</span>
                      {' / '}
                      <span className="text-red-500">{exam.marking_scheme.nat_wrong}</span>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Subjects */}
          {subjects && subjects.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
                <BookOpen size={18} className="text-accent-primary" />
                <h3 className="text-[15px] font-bold text-text-main">Subjects</h3>
              </div>
              <div className="space-y-3">
                {subjects.map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-surface-hover/50 rounded-xl border border-border/40">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0 text-[12px] font-bold">
                        {sub.sort_order + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-text-main truncate">{sub.subject_name}</p>
                        {sub.exam_subject_teachers?.length > 0 && (
                          <p className="text-[11px] text-text-muted truncate">
                            {sub.exam_subject_teachers.map((t: any) => t.teachers?.full_name || 'Unknown').join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[12px] font-semibold text-text-muted shrink-0 ml-3">
                      {questionCounts[sub.id] || 0} Q
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* School Info Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
              <SchoolIcon size={18} className="text-accent-primary" />
              <h3 className="text-[15px] font-bold text-text-main">School</h3>
            </div>
            {exam.schools ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center mb-4 shadow-inner">
                  <span className="text-2xl font-bold text-blue-500">{exam.schools.name?.charAt(0)?.toUpperCase() || 'S'}</span>
                </div>
                <p className="text-[16px] font-bold text-text-main mb-1">{exam.schools.name}</p>
                <p className="text-[13px] text-text-muted mb-4">{exam.schools.domain || 'No domain'}</p>
                <Link
                  href={`/schools/${exam.schools.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary/10 text-accent-primary text-[12px] font-bold hover:bg-accent-primary hover:text-white transition-all border border-accent-primary/20"
                >
                  <SchoolIcon size={14} /> View School
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-[180px] text-text-muted">
                <SchoolIcon size={32} className="opacity-20 mb-3" />
                <p className="text-[13px]">School not found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
