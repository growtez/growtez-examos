'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewExamPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  // Step 1: Exam details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [mcqCorrect, setMcqCorrect] = useState(4);
  const [mcqWrong, setMcqWrong] = useState(-1);
  const [natCorrect, setNatCorrect] = useState(4);
  const [natWrong, setNatWrong] = useState(0);

  // Step 2: Subjects
  const [subjects, setSubjects] = useState<Array<{
    name: string;
    questionCount: number;
    teacherIds: string[];
  }>>([{ name: '', questionCount: 10, teacherIds: [] }]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      if (!profile?.school_id) return;
      setSchoolId(profile.school_id);

      const { data } = await supabase.from('teachers').select('*').eq('school_id', profile.school_id);
      setTeachers(data || []);
    };
    init();
  }, []);

  const addSubject = () => {
    setSubjects([...subjects, { name: '', questionCount: 10, teacherIds: [] }]);
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index: number, field: string, value: any) => {
    const updated = [...subjects];
    (updated[index] as any)[field] = value;
    setSubjects(updated);
  };

  const toggleTeacher = (subjectIndex: number, teacherId: string) => {
    const updated = [...subjects];
    const ids = updated[subjectIndex].teacherIds;
    if (ids.includes(teacherId)) {
      updated[subjectIndex].teacherIds = ids.filter(id => id !== teacherId);
    } else {
      updated[subjectIndex].teacherIds = [...ids, teacherId];
    }
    setSubjects(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!schoolId) throw new Error('No school found');
      if (subjects.some(s => !s.name.trim())) throw new Error('All subjects must have a name');

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      // 1. Create exam
      const { data: exam, error: examError } = await supabase.from('exams').insert({
        school_id: schoolId,
        title,
        description: description || null,
        duration_minutes: durationMinutes,
        status: 'draft',
        marking_scheme: { mcq_correct: mcqCorrect, mcq_wrong: mcqWrong, nat_correct: natCorrect, nat_wrong: natWrong },
        created_by: user?.id,
      }).select().single();

      if (examError) throw examError;

      // 2. Create subjects and assign teachers
      for (let i = 0; i < subjects.length; i++) {
        const s = subjects[i];
        const { data: subjectRow, error: subjectError } = await supabase.from('exam_subjects').insert({
          exam_id: exam.id,
          subject_name: s.name,
          question_count: s.questionCount,
          sort_order: i,
        }).select().single();

        if (subjectError) throw subjectError;

        // Assign teachers
        for (const teacherId of s.teacherIds) {
          await supabase.from('exam_subject_teachers').insert({
            exam_subject_id: subjectRow.id,
            teacher_id: teacherId,
          });
        }
      }

      router.refresh();
      router.push(`/exams/${exam.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link href="/exams" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 text-sm transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Exams
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">Create New Exam</h2>
        <p className="text-gray-500 mt-1">Configure exam details, subjects, and assign teachers</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Exam Details */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="JEE Main Mock Test 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                placeholder="Full length mock test covering all topics..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes) *</label>
              <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value))} min={1} required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
            </div>
          </div>
        </div>

        {/* Marking Scheme */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Marking Scheme</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">MCQ Correct</label>
              <input type="number" value={mcqCorrect} onChange={(e) => setMcqCorrect(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">MCQ Wrong</label>
              <input type="number" value={mcqWrong} onChange={(e) => setMcqWrong(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">NAT Correct</label>
              <input type="number" value={natCorrect} onChange={(e) => setNatCorrect(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">NAT Wrong</label>
              <input type="number" value={natWrong} onChange={(e) => setNatWrong(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Subjects & Teachers</h3>
            <button type="button" onClick={addSubject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-500/20 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add Subject
            </button>
          </div>

          <div className="space-y-6">
            {subjects.map((subject, index) => (
              <div key={index} className="bg-slate-800/50 border border-gray-300 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Subject {index + 1}</span>
                  {subjects.length > 1 && (
                    <button type="button" onClick={() => removeSubject(index)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Subject Name</label>
                    <input type="text" value={subject.name} onChange={(e) => updateSubject(index, 'name', e.target.value)} required
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                      placeholder="e.g. Physics" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">No. of Questions</label>
                    <input type="number" value={subject.questionCount} onChange={(e) => updateSubject(index, 'questionCount', parseInt(e.target.value))} min={1}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Assign Teachers</label>
                  {teachers.length === 0 ? (
                    <p className="text-gray-400 text-xs">No teachers added yet. <Link href="/teachers" className="text-indigo-400 hover:underline">Add teachers first</Link>.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {teachers.map((t) => (
                        <button key={t.id} type="button" onClick={() => toggleTeacher(index, t.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            subject.teacherIds.includes(t.id)
                              ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                              : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400'
                          }`}>
                          {t.full_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-gray-900 font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25">
            {loading ? 'Creating...' : 'Create Exam'}
          </button>
          <Link href="/exams" className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
