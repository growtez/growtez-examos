'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  draft: 'bg-slate-500/10 text-gray-500 border-slate-500/20',
  published: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

export default function ExamDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [exam, setExam] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [students, setStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
    // Fetch exam
    const { data: examData } = await supabase.from('exams').select('*').eq('id', params.id).single();
    setExam(examData);
    if (!examData) { setLoading(false); return; }

    // Fetch subjects with teachers
    const { data: subjectsData } = await supabase
      .from('exam_subjects')
      .select('*, exam_subject_teachers(*, teachers:teacher_id(full_name))')
      .eq('exam_id', params.id)
      .order('sort_order');
    setSubjects(subjectsData || []);

    // Fetch question counts per subject
    const counts: Record<string, number> = {};
    for (const s of (subjectsData || [])) {
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('exam_subject_id', s.id);
      counts[s.id] = count ?? 0;
    }
    setQuestionCounts(counts);

    // Fetch assigned students
    const { data: examStudents } = await supabase
      .from('exam_students')
      .select('*, students:student_id(full_name, roll_number)')
      .eq('exam_id', params.id);
    setAssignedStudents(examStudents || []);

    // Fetch all school students for assignment
    const { data: allStudentsData } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', examData.school_id)
      .order('roll_number');
    setAllStudents(allStudentsData || []);

    setLoading(false);
  };

  const handlePublish = async () => {
    setPublishing(true);
    await supabase.from('exams').update({ status: 'published' }).eq('id', params.id);
    setExam({ ...exam, status: 'published' });
    setPublishing(false);
  };

  const handleAssignStudents = async () => {
    setAssigning(true);
    
    // Call the bulletproof RPC function that bypasses all RLS quirks
    const { error } = await supabase.rpc('assign_students', {
      p_exam_id: params.id,
      p_student_ids: selectedStudentIds
    });
    
    if (error) {
      alert('Failed to assign students: ' + error.message);
      console.error(error);
    } else {
      setShowAssignModal(false);
      setSelectedStudentIds([]);
      fetchExamData();
    }
    setAssigning(false);
  };

  const handleAssignAll = () => {
    const alreadyAssigned = new Set(assignedStudents.map(a => a.student_id));
    setSelectedStudentIds(allStudents.filter(s => !alreadyAssigned.has(s.id)).map(s => s.id));
  };

  if (loading) return <div className="text-gray-500 p-12 text-center">Loading...</div>;
  if (!exam) return <div className="text-gray-500 p-12 text-center">Exam not found</div>;

  const totalQuestionsNeeded = subjects.reduce((acc, s) => acc + s.question_count, 0);
  const totalQuestionsAdded = Object.values(questionCounts).reduce((a, b) => a + b, 0);
  const allQuestionsReady = subjects.every(s => (questionCounts[s.id] || 0) >= s.question_count);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/exams" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 text-sm transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Exams
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{exam.title}</h2>
            {exam.description && <p className="text-gray-500 mt-1">{exam.description}</p>}
          </div>
          <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium border ${statusColors[exam.status] || statusColors.draft}`}>
            {exam.status?.charAt(0).toUpperCase() + exam.status?.slice(1)}
          </span>
        </div>
      </div>

      {/* Exam Info */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <p className="text-gray-500 text-sm">Duration</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{exam.duration_minutes} min</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <p className="text-gray-500 text-sm">Questions</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{totalQuestionsAdded} / {totalQuestionsNeeded}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <p className="text-gray-500 text-sm">Students Assigned</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{assignedStudents.length}</p>
        </div>
      </div>

      {/* Subjects */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subjects</h3>
        <div className="space-y-3">
          {subjects.map((s) => {
            const added = questionCounts[s.id] || 0;
            const needed = s.question_count;
            const complete = added >= needed;
            return (
              <div key={s.id} className="flex items-center justify-between bg-slate-800/50 border border-gray-300 rounded-xl p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-900 font-medium">{s.subject_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-md ${complete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {added}/{needed} questions
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    {s.exam_subject_teachers?.map((est: any) => (
                      <span key={est.id} className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-md">
                        {est.teachers?.full_name || 'Unknown'}
                      </span>
                    ))}
                  </div>
                </div>
                <Link href={`/exams/${params.id}/questions?subject=${s.id}`}
                  className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
                  Add Questions →
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assigned Students */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Assigned Students ({assignedStudents.length})</h3>
          <button onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-500/20 transition-colors">
            Assign Students
          </button>
        </div>
        {assignedStudents.length === 0 ? (
          <p className="text-gray-500 text-sm">No students assigned yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assignedStudents.slice(0, 20).map((as: any) => (
              <span key={as.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs text-gray-700">
                <span className="font-mono text-gray-500">{as.students?.roll_number}</span>
                {as.students?.full_name}
              </span>
            ))}
            {assignedStudents.length > 20 && <span className="text-gray-400 text-xs self-center">+{assignedStudents.length - 20} more</span>}
          </div>
        )}
      </div>

      {/* Publish Button */}
      {exam.status === 'draft' && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Publish Exam</h3>
          <p className="text-gray-500 text-sm mb-4">
            {allQuestionsReady
              ? 'All questions are ready. You can publish this exam to make it available to students.'
              : 'Some subjects still need more questions. Add all required questions before publishing.'}
          </p>
          <button onClick={handlePublish} disabled={!allQuestionsReady || publishing}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-gray-900 font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25">
            {publishing ? 'Publishing...' : 'Publish Exam'}
          </button>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAssignModal(false)}>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Students</h3>
            <button type="button" onClick={handleAssignAll} className="text-indigo-400 text-sm mb-4 hover:underline">Select all unassigned</button>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {allStudents.map((s) => {
                const alreadyAssigned = assignedStudents.some(a => a.student_id === s.id);
                return (
                  <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${alreadyAssigned ? 'bg-slate-800/30 opacity-50' : selectedStudentIds.includes(s.id) ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-slate-800/50 border border-gray-300 hover:border-gray-400'}`}>
                    <input type="checkbox" disabled={alreadyAssigned}
                      checked={alreadyAssigned || selectedStudentIds.includes(s.id)}
                      onChange={() => {
                        if (alreadyAssigned) return;
                        setSelectedStudentIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]);
                      }}
                      className="rounded border-gray-400" />
                    <span className="font-mono text-xs text-gray-500">{s.roll_number}</span>
                    <span className="text-gray-900 text-sm">{s.full_name}</span>
                    {alreadyAssigned && <span className="text-xs text-emerald-400 ml-auto">Assigned</span>}
                  </label>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={handleAssignStudents} disabled={selectedStudentIds.length === 0 || assigning}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-gray-900 font-medium rounded-xl disabled:opacity-50">
                {assigning ? 'Assigning...' : `Assign ${selectedStudentIds.length} Students`}
              </button>
              <button onClick={() => setShowAssignModal(false)}
                className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
