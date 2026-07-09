'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';

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
  const [mcqCorrect, setMcqCorrect] = useState<number | string>(4);
  const [mcqWrong, setMcqWrong] = useState<number | string>(-1);
  const [natCorrect, setNatCorrect] = useState<number | string>(4);
  const [natWrong, setNatWrong] = useState<number | string>(0);

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

      const { data } = await supabase.from('teachers').select('*').eq('school_id', profile.school_id).order('department', { ascending: true }).order('full_name', { ascending: true });
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
        marking_scheme: { 
          mcq_correct: parseFloat(String(mcqCorrect)) || 0, 
          mcq_wrong: parseFloat(String(mcqWrong)) || 0, 
          nat_correct: parseFloat(String(natCorrect)) || 0, 
          nat_wrong: parseFloat(String(natWrong)) || 0 
        },
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

      router.push(`/exams/${exam.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#1a2e2e]">Create New Exam</h2>
        <p className="text-[#555555] mt-1 text-sm font-medium">Configure exam details, subjects, and assign teachers</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Exam Details */}
        <div className="bg-[#f5f9f9] border border-[#e0f2f2] rounded-2xl p-6">
          <h3 className="text-lg font-bold text-[#1a2e2e] mb-4">Exam Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">Title *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium"
                placeholder="JEE Main Mock Test 1" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all resize-none text-sm font-medium"
                placeholder="Full length mock test covering all topics..." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">Duration (minutes) *</label>
              <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value))} min={1} required
                className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium" />
            </div>
          </div>
        </div>

        {/* Marking Scheme */}
        <div className="bg-[#f5f9f9] border border-[#e0f2f2] rounded-2xl p-6">
          <h3 className="text-lg font-bold text-[#1a2e2e] mb-4">Marking Scheme</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">MCQ Correct</label>
              <input type="number" step="any" value={mcqCorrect} onChange={(e) => setMcqCorrect(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">MCQ Wrong (Negative)</label>
              <input type="number" step="any" value={mcqWrong} onChange={(e) => setMcqWrong(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">NAT Correct</label>
              <input type="number" step="any" value={natCorrect} onChange={(e) => setNatCorrect(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1a2e2e] mb-1.5">NAT Wrong (Negative)</label>
              <input type="number" step="any" value={natWrong} onChange={(e) => setNatWrong(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium" />
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-[#f5f9f9] border border-[#e0f2f2] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#1a2e2e]">Subjects & Teachers</h3>
            <button type="button" onClick={addSubject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#b2d8d8] text-[#008080] rounded-lg text-sm font-semibold hover:bg-[#e0f2f2] transition-colors shadow-sm">
              <Plus size={16} />
              Add Subject
            </button>
          </div>

          <div className="space-y-6">
            {subjects.map((subject, index) => (
              <div key={index} className="bg-white border border-[#e0f2f2] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-[#1a2e2e]">Subject {index + 1}</span>
                  {subjects.length > 1 && (
                    <button type="button" onClick={() => removeSubject(index)} className="text-red-500 hover:text-red-600 text-sm font-semibold">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1.5">Subject Name</label>
                    <input type="text" value={subject.name} onChange={(e) => updateSubject(index, 'name', e.target.value)} required
                      className="w-full px-4 py-2.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium"
                      placeholder="e.g. Physics" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1.5">No. of Questions</label>
                    <input type="number" value={subject.questionCount} onChange={(e) => updateSubject(index, 'questionCount', parseInt(e.target.value))} min={1}
                      className="w-full px-4 py-2.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-2">Assign Teachers</label>
                  {teachers.length === 0 ? (
                    <p className="text-[#8ab8b8] text-xs font-medium">No teachers added yet. <Link href="/teachers" className="text-[#008080] hover:underline">Add teachers first</Link>.</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(
                        teachers.reduce((acc, t) => {
                          const dep = t.department || 'No Department';
                          if (!acc[dep]) acc[dep] = [];
                          acc[dep].push(t);
                          return acc;
                        }, {} as Record<string, any[]>)
                      ).map(([dep, depTeachers]: [string, any]) => (
                        <div key={dep} className="mb-2">
                          <p className="text-[10px] font-bold text-[#8ab8b8] uppercase tracking-wider mb-1.5">{dep}</p>
                          <div className="flex flex-wrap gap-2">
                            {depTeachers.map((t: any) => (
                              <button key={t.id} type="button" onClick={() => toggleTeacher(index, t.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  subject.teacherIds.includes(t.id)
                                    ? 'bg-[#008080]/10 border-[#008080]/30 text-[#008080]'
                                    : 'bg-[#f5f9f9] border-[#e0f2f2] text-[#8ab8b8] hover:border-[#b2d8d8] hover:text-[#555555]'
                                }`}>
                                {t.full_name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm font-medium">{error}</div>}

        <div className="flex items-center gap-3 pt-4">
          <button type="submit" disabled={loading}
            className="px-8 py-3.5 bg-[#008080] text-white font-semibold rounded-xl hover:bg-[#006666] transition-all disabled:opacity-50 shadow-lg shadow-[#008080]/20 text-sm">
            {loading ? 'Creating...' : 'Create Exam'}
          </button>
          <Link href="/exams" className="px-8 py-3.5 bg-white border border-[#e0f2f2] text-[#555555] font-semibold rounded-xl hover:bg-[#f5f9f9] transition-colors text-sm">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
