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
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
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

  // Helper to format ISO string for datetime-local input
  const formatForInput = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    // Adjust to local time format YYYY-MM-DDThh:mm
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  useEffect(() => {
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
    // Fetch exam
    const { data: examData } = await supabase.from('exams').select('*').eq('id', params.id).single();
    setExam(examData);
    if (!examData) { setLoading(false); return; }
    
    if (examData.start_time) setStartTime(formatForInput(examData.start_time));
    if (examData.end_time) setEndTime(formatForInput(examData.end_time));

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
    if (!startTime || !endTime) {
      alert('Please set a start time and end time before publishing.');
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      alert('End time must be after start time.');
      return;
    }

    setPublishing(true);
    
    const updates = {
      status: 'published',
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString()
    };
    
    await supabase.from('exams').update(updates).eq('id', params.id);
    setExam({ ...exam, ...updates });
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

  const handleDuplicate = async () => {
    const newTitle = prompt('Enter a title for the duplicated exam:', `${exam.title} (Copy)`);
    if (!newTitle) return;
    
    setLoading(true);
    const { data: newExamId, error } = await supabase.rpc('duplicate_exam', {
      p_exam_id: params.id,
      p_new_title: newTitle
    });

    if (error) {
      alert('Failed to duplicate exam: ' + error.message);
      console.error(error);
      setLoading(false);
    } else {
      // Redirect to the new exam
      window.location.href = `/exams/${newExamId}`;
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Are you sure you want to unpublish this exam? This will revert it to a draft state.')) return;
    setPublishing(true);
    const updates = {
      status: 'draft',
      start_time: null,
      end_time: null
    };
    
    const { error } = await supabase.from('exams').update(updates).eq('id', params.id);
    if (!error) {
      setExam({ ...exam, ...updates });
    } else {
      alert('Failed to unpublish exam.');
    }
    setPublishing(false);
  };

  const handleTrash = async () => {
    if (!confirm('Are you sure you want to move this exam to the trash?')) return;
    
    const { error } = await supabase.from('exams').update({ is_trashed: true }).eq('id', params.id);
    if (!error) {
      window.location.href = '/exams';
    } else {
      alert('Failed to move exam to trash.');
    }
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
          <div className="flex items-center gap-3">
            {exam.status !== 'draft' && (
              <button 
                onClick={handleUnpublish}
                disabled={publishing}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Unpublish
              </button>
            )}
            <button 
              onClick={handleDuplicate}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
              Duplicate
            </button>
            <button 
              onClick={handleTrash}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Trash
            </button>
            <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium border ${statusColors[exam.status] || statusColors.draft}`}>
              {exam.status?.charAt(0).toUpperCase() + exam.status?.slice(1)}
            </span>
          </div>
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
          <div className="flex flex-col gap-3">
            {assignedStudents.map((as: any) => (
              <div key={as.id} className="flex items-center justify-between bg-white border border-gray-300 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-md text-xs">{as.students?.roll_number}</span>
                  <span className="text-gray-900 text-sm font-medium">{as.students?.full_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-md border font-medium ${
                    as.status === 'submitted' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                    as.status === 'in_progress' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                    'bg-slate-500/10 text-slate-500 border-slate-500/20'
                  }`}>
                    {as.status === 'submitted' ? 'Submitted' : as.status === 'in_progress' ? 'In Progress' : 'Assigned'}
                  </span>
                  {(as.status === 'in_progress' || as.status === 'submitted') && (
                    <button
                      onClick={async () => {
                        if (!confirm("Are you sure you want to reset this student's exam? This will delete their current progress and results.")) return;
                        
                        const { error } = await supabase.rpc('reset_student_exam', {
                          p_exam_id: params.id,
                          p_student_id: as.student_id
                        });
                        
                        if (error) {
                          alert('Failed to reset exam: ' + error.message);
                        } else {
                          fetchExamData();
                        }
                      }}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-md text-xs font-medium transition-colors border border-transparent hover:border-red-200"
                    >
                      Retry / Reset
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publish Button */}
      {exam.status === 'draft' && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Publish Exam</h3>
          <p className="text-gray-500 text-sm mb-6">
            {allQuestionsReady
              ? 'All questions are ready. Set the start and end times, then publish the exam.'
              : 'Some subjects still need more questions. Add all required questions before publishing.'}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time (Auto-publish) *</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={!allQuestionsReady || publishing}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time (Auto-end) *</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!allQuestionsReady || publishing}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all disabled:opacity-50" />
            </div>
          </div>

          <button onClick={handlePublish} disabled={!allQuestionsReady || publishing || !startTime || !endTime}
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
