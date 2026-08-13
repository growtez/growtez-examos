'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function NewExamPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schoolId, setSchoolId] = useState<string | null>(null);

  // Exam Details to be inserted (default or from template)
  const [title, setTitle] = useState('Untitled Exam');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [mcqCorrect, setMcqCorrect] = useState<number | string>(4);
  const [mcqWrong, setMcqWrong] = useState<number | string>(-1);
  const [natCorrect, setNatCorrect] = useState<number | string>(4);
  const [natWrong, setNatWrong] = useState<number | string>(0);
  const [instructions, setInstructions] = useState<string[]>([
    'The test contains multiple-choice questions (MCQs) and numerical value questions.',
    'No deduction from the total score will be made if no response is indicated.',
    'The test will automatically end when the time limit is reached.'
  ]);
  const [subjects, setSubjects] = useState<Array<{ name: string; questionCount: number; }>>([]);

  // Session Setup Modal 
  const [examCourse, setExamCourse] = useState('');
  const [examBatch, setExamBatch] = useState('');
  const [examSession, setExamSession] = useState('');
  const [existingCourses, setExistingCourses] = useState<string[]>([]);
  const [existingBatches, setExistingBatches] = useState<string[]>([]);
  const [existingSessions, setExistingSessions] = useState<string[]>([]);
  const [sessionModalError, setSessionModalError] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      if (!profile?.school_id) return;
      setSchoolId(profile.school_id);

      const [templatesRes, examsRes] = await Promise.all([
        supabase.from('exam_templates').select('*, exam_template_subjects(*)').or(`school_id.is.null,school_id.eq.${profile.school_id}`).order('created_at', { ascending: false }),
        supabase.from('exams').select('course, batch, session').eq('school_id', profile.school_id).not('course', 'is', null)
      ]);

      // Collect unique values for dropdown suggestions
      const exams = examsRes.data || [];
      setExistingCourses([...new Set(exams.map((e: any) => e.course).filter(Boolean))]);
      setExistingBatches([...new Set(exams.map((e: any) => e.batch).filter(Boolean))]);
      setExistingSessions([...new Set(exams.map((e: any) => e.session).filter(Boolean))]);

      // Check for templateId in URL
      const searchParams = new URLSearchParams(window.location.search);
      const templateId = searchParams.get('templateId');
      if (templateId && templatesRes.data) {
        const template = templatesRes.data.find((t: any) => t.id === templateId);
        if (template) {
          setTitle(template.title || 'Untitled Exam');
          setDescription(template.description || '');
          setDurationMinutes(template.duration_minutes || 180);
          if (template.marking_scheme) {
            setMcqCorrect(template.marking_scheme.mcq_correct ?? 4);
            setMcqWrong(template.marking_scheme.mcq_wrong ?? -1);
            setNatCorrect(template.marking_scheme.nat_correct ?? 4);
            setNatWrong(template.marking_scheme.nat_wrong ?? 0);
          }
          if (template.exam_instructions) {
            setInstructions(template.exam_instructions);
          }
          if (template.exam_template_subjects && template.exam_template_subjects.length > 0) {
            const sortedSubjects = [...template.exam_template_subjects].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            setSubjects(sortedSubjects.map(s => ({
              name: s.subject_name,
              questionCount: s.question_count,
            })));
          }
        }
      }
    };
    init();
  }, []);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (!schoolId) throw new Error('No school found');

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      // 1. Create exam
      const { data: exam, error: examError } = await supabase.from('exams').insert({
        school_id: schoolId,
        title,
        description: description || null,
        duration_minutes: durationMinutes,
        status: 'draft',
        marking_scheme: { 
          mcq_correct: parseFloat(String(mcqCorrect)) || 0, 
          mcq_wrong: parseFloat(String(mcqWrong)) || 0, 
          nat_correct: parseFloat(String(natCorrect)) || 0, 
          nat_wrong: parseFloat(String(natWrong)) || 0 
        },
        created_by: user?.id,
        exam_instructions: instructions.filter(inst => inst.trim() !== ''),
        course: examCourse,
        batch: examBatch,
        session: examSession,
      }).select().single();

      if (examError) throw examError;

      // 2. Create subjects
      if (subjects.length > 0) {
        for (let i = 0; i < subjects.length; i++) {
          const s = subjects[i];
          const { error: subjectError } = await supabase.from('exam_subjects').insert({
            exam_id: exam.id,
            subject_name: s.name,
            question_count: s.questionCount,
            sort_order: i,
          });

          if (subjectError) throw subjectError;
        }
      }

      router.refresh();
      router.push(`/exams/${exam.id}`);
    } catch (err: any) {
      setError(err.message);
      setSessionModalError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent-primary/10 rounded-xl">
            <BookOpen className="w-6 h-6 text-accent-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-main">Exam Session Setup</h2>
            <p className="text-xs text-text-muted mt-0.5">Required before creating the exam</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Session */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5">Academic Session <span className="text-red-500">*</span></label>
            <input
              list="sessions-list"
              value={examSession}
              onChange={e => setExamSession(e.target.value)}
              placeholder="e.g. 2025-26"
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
            />
            <datalist id="sessions-list">
              {existingSessions.map(s => <option key={s} value={s} />)}
              {!existingSessions.includes('2024-25') && <option value="2024-25" />}
              {!existingSessions.includes('2025-26') && <option value="2025-26" />}
              {!existingSessions.includes('2026-27') && <option value="2026-27" />}
            </datalist>
          </div>

          {/* Course */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5">Course <span className="text-red-500">*</span></label>
            <input
              list="courses-list"
              value={examCourse}
              onChange={e => setExamCourse(e.target.value)}
              placeholder="e.g. JEE, NEET, General"
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
            />
            <datalist id="courses-list">
              {existingCourses.map(c => <option key={c} value={c} />)}
              {!existingCourses.includes('JEE') && <option value="JEE" />}
              {!existingCourses.includes('NEET') && <option value="NEET" />}
              {!existingCourses.includes('General') && <option value="General" />}
            </datalist>
          </div>

          {/* Batch */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-1.5">Batch <span className="text-red-500">*</span></label>
            <input
              list="batches-list"
              value={examBatch}
              onChange={e => setExamBatch(e.target.value)}
              placeholder="e.g. Morning, Evening, Main"
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
            />
            <datalist id="batches-list">
              {existingBatches.map(b => <option key={b} value={b} />)}
              {!existingBatches.includes('Morning') && <option value="Morning" />}
              {!existingBatches.includes('Evening') && <option value="Evening" />}
              {!existingBatches.includes('Main') && <option value="Main" />}
            </datalist>
          </div>

          {sessionModalError && (
            <p className="text-red-500 text-sm font-medium">{sessionModalError}</p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              if (!examSession.trim() || !examCourse.trim() || !examBatch.trim()) {
                setSessionModalError('All three fields are required to create an exam.');
                return;
              }
              setSessionModalError('');
              handleSubmit();
            }}
            disabled={loading}
            className="flex-1 flex justify-center items-center bg-accent-primary text-white font-bold py-2.5 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Create Exam'}
          </button>
          <Link href="/exams" className="px-4 py-2.5 border border-border rounded-xl text-text-muted text-sm font-medium hover:bg-bg transition-colors flex items-center">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
