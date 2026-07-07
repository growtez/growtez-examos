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
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  // Add student form fields
  const [newName, setNewName] = useState('');
  const [newRoll, setNewRoll] = useState('');
  const [newDob, setNewDob] = useState('');
  const [importCsvMode, setImportCsvMode] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

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

    // Fetch assigned students for this exam
    const { data: examStudents } = await supabase
      .from('exam_students')
      .select('*, students:student_id(full_name, roll_number, date_of_birth)')
      .eq('exam_id', params.id)
      .order('created_at');
    setAssignedStudents(examStudents || []);

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

  const formatDobPassword = (dateStr: string) => {
    const parts = dateStr.split('-');
    return `${parts[2]}${parts[1]}${parts[0]}`;
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    setAddingStudent(true);
    try {
      const res = await fetch('/api/students/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newName,
          roll_number: newRoll,
          date_of_birth: newDob,
          exam_id: params.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add student');
      setAddSuccess(`Student "${newName}" added successfully!`);
      setNewName(''); setNewRoll(''); setNewDob('');
      fetchExamData();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddingStudent(false);
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setAddError('');
    setAddSuccess('');
    setAddingStudent(true);
    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].toLowerCase();
      if (!headers.includes('name') || !headers.includes('roll')) {
        throw new Error('CSV must have columns: name, roll_number, dob');
      }
      let imported = 0;
      const errors: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 3) continue;
        const [studentName, studentRoll, studentDob] = cols;
        // Parse DD/MM/YYYY or YYYY-MM-DD
        let formattedDob = studentDob;
        if (studentDob.includes('/')) {
          const [d, m, y] = studentDob.split('/');
          formattedDob = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
        }
        try {
          const res = await fetch('/api/students/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name: studentName, roll_number: studentRoll, date_of_birth: formattedDob, exam_id: params.id }),
          });
          if (res.ok) { imported++; } else {
            const d = await res.json();
            errors.push(`${studentRoll}: ${d.error || 'Failed'}`);
          }
        } catch { errors.push(`${studentRoll}: Failed`); }
      }
      setAddSuccess(`Imported ${imported} students${errors.length ? `. ${errors.length} failed.` : '.'}`);
      setCsvFile(null);
      fetchExamData();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (examStudentId: string, studentId: string) => {
    if (!confirm('Remove this student from the exam? Their account will be deleted.')) return;
    // Remove from exam_students first
    await supabase.from('exam_students').delete().eq('id', examStudentId);
    // Also delete the student user account via API
    await fetch('/api/students/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId }),
    });
    fetchExamData();
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
      <div className="bg-white border-2 border-[#b2d8d8] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="border-l-4 border-[#008080] pl-3">
            <h3 className="text-base font-bold text-[#1a2e2e] uppercase tracking-wide">Students ({assignedStudents.length})</h3>
            <p className="text-[#555555] text-xs mt-0.5">Students are specific to this exam</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowAddStudentModal(true); setImportCsvMode(false); setAddError(''); setAddSuccess(''); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#008080] text-white text-xs font-bold hover:bg-[#006666] border-b-2 border-[#004d4d] uppercase tracking-wider transition-colors">
              + Add Student
            </button>
            <button onClick={() => { setShowAddStudentModal(true); setImportCsvMode(true); setAddError(''); setAddSuccess(''); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1a2e2e] text-xs font-bold border-2 border-[#b2d8d8] hover:border-[#008080] hover:text-[#008080] uppercase tracking-wider transition-colors">
              ↑ Import CSV
            </button>
          </div>
        </div>

        {addSuccess && <div className="bg-[#e0f2f2] border border-[#b2d8d8] p-3 text-[#008080] text-sm font-bold mb-4 uppercase">{addSuccess}</div>}

        {assignedStudents.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-[#b2d8d8]">
            <p className="text-[#555555] text-sm">No students added yet.</p>
            <p className="text-[#8aacac] text-xs mt-1">Students are specific to this exam. Add them using the button above.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#008080]">
                <th className="text-left px-4 py-2.5 text-xs font-bold text-white uppercase tracking-wider">Roll No.</th>
                <th className="text-left px-4 py-2.5 text-xs font-bold text-white uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-bold text-white uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-2.5 text-xs font-bold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignedStudents.map((as: any) => (
                <tr key={as.id} className="border-b border-[#e0f2f2] hover:bg-[#f5f9f9] transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-[#008080] bg-[#e0f2f2] border border-[#b2d8d8] px-2 py-0.5 text-xs font-bold">{as.students?.roll_number}</span>
                  </td>
                  <td className="px-4 py-3 text-[#1a2e2e] text-sm font-medium">{as.students?.full_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 font-bold uppercase border ${
                      as.status === 'submitted' ? 'bg-[#e0f2f2] text-[#008080] border-[#b2d8d8]' :
                      as.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-[#f5f5f5] text-[#555555] border-[#cccccc]'
                    }`}>
                      {as.status === 'submitted' ? '✓ Submitted' : as.status === 'in_progress' ? '▶ In Progress' : 'Assigned'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    {(as.status === 'in_progress' || as.status === 'submitted') && (
                      <button
                        onClick={async () => {
                          if (!confirm("Reset this student's exam? This will delete their current progress and results.")) return;
                          const { error } = await supabase.rpc('reset_student_exam', { p_exam_id: params.id, p_student_id: as.student_id });
                          if (error) alert('Failed to reset: ' + error.message);
                          else fetchExamData();
                        }}
                        className="text-amber-600 hover:text-amber-700 text-xs font-bold border border-amber-300 hover:bg-amber-50 px-2 py-1 uppercase transition-colors"
                      >
                        Reset
                      </button>
                    )}
                    {as.status === 'assigned' && (
                      <button
                        onClick={() => handleRemoveStudent(as.id, as.student_id)}
                        className="text-red-600 hover:text-red-700 text-xs font-bold border border-red-200 hover:bg-red-50 px-2 py-1 uppercase transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Publish Button */}
      {exam.status === 'draft' && (
        <div className="bg-white border-2 border-[#b2d8d8] p-6">
          <div className="border-l-4 border-[#008080] pl-3 mb-4">
            <h3 className="text-base font-bold text-[#1a2e2e] uppercase tracking-wide">Publish Exam</h3>
          </div>
          <p className="text-[#555555] text-sm mb-6">
            {allQuestionsReady
              ? 'All questions are ready. Set the start and end times, then publish the exam.'
              : 'Some subjects still need more questions. Add all required questions before publishing.'}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">Start Time (Auto-publish) *</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={!allQuestionsReady || publishing}
                className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] focus:outline-none focus:border-[#008080] transition-all disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">End Time (Auto-end) *</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!allQuestionsReady || publishing}
                className="w-full px-4 py-3 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] focus:outline-none focus:border-[#008080] transition-all disabled:opacity-50" />
            </div>
          </div>

          <button onClick={handlePublish} disabled={!allQuestionsReady || publishing || !startTime || !endTime}
            className="px-6 py-3 bg-[#008080] hover:bg-[#006666] text-white font-bold border-b-2 border-[#004d4d] uppercase tracking-wider disabled:opacity-50 transition-colors">
            {publishing ? 'Publishing...' : 'Publish Exam'}
          </button>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => { setShowAddStudentModal(false); setAddError(''); setAddSuccess(''); setImportCsvMode(false); }}>
          <div className="bg-white border-2 border-[#008080] shadow-[4px_4px_0px_#004d4d] w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#008080] px-6 py-3 flex items-center justify-between">
              <span className="text-white font-extrabold text-sm uppercase tracking-widest">Add Students to Exam</span>
              <button onClick={() => { setShowAddStudentModal(false); setAddError(''); setAddSuccess(''); setImportCsvMode(false); }} className="text-white/70 hover:text-white">✕</button>
            </div>

            <div className="p-6">
              {/* Toggle between individual / CSV */}
              <div className="flex mb-5 border-2 border-[#b2d8d8]">
                <button
                  onClick={() => setImportCsvMode(false)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${!importCsvMode ? 'bg-[#008080] text-white' : 'bg-white text-[#555555] hover:bg-[#f5f9f9]'}`}
                >
                  Add Individual
                </button>
                <button
                  onClick={() => setImportCsvMode(true)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${importCsvMode ? 'bg-[#008080] text-white' : 'bg-white text-[#555555] hover:bg-[#f5f9f9]'}`}
                >
                  Import CSV
                </button>
              </div>

              {addSuccess && <div className="bg-[#e0f2f2] border border-[#b2d8d8] p-3 text-[#008080] text-xs font-bold mb-4 uppercase">{addSuccess}</div>}
              {addError && <div className="bg-red-50 border border-red-400 p-3 text-red-600 text-xs font-medium mb-4">⚠ {addError}</div>}

              {!importCsvMode ? (
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">Full Name</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required
                      placeholder="Aarav Patel"
                      className="w-full px-4 py-2.5 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] placeholder-[#8aacac] focus:outline-none focus:border-[#008080] text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">Roll Number</label>
                    <input type="text" value={newRoll} onChange={e => setNewRoll(e.target.value)} required
                      placeholder="2024001"
                      className="w-full px-4 py-2.5 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] placeholder-[#8aacac] focus:outline-none focus:border-[#008080] text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">Date of Birth <span className="text-[#8aacac] normal-case">(password = DDMMYYYY)</span></label>
                    <input type="date" value={newDob} onChange={e => setNewDob(e.target.value)} required
                      className="w-full px-4 py-2.5 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] focus:outline-none focus:border-[#008080] text-sm" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={addingStudent}
                      className="flex-1 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-bold disabled:opacity-50 border-b-2 border-[#004d4d] uppercase text-sm">
                      {addingStudent ? 'Adding...' : 'Add Student'}
                    </button>
                    <button type="button" onClick={() => { setShowAddStudentModal(false); setAddError(''); }}
                      className="px-4 py-2.5 bg-white border-2 border-[#b2d8d8] text-[#1a2e2e] font-bold hover:border-[#008080] uppercase text-sm">
                      Close
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCsvImport} className="space-y-4">
                  <div className="bg-[#f5f9f9] border border-[#b2d8d8] p-4">
                    <p className="text-[#1a2e2e] text-xs font-bold mb-2 uppercase tracking-wide">CSV Format:</p>
                    <code className="text-xs text-[#008080] bg-white px-3 py-2 block border border-[#b2d8d8] font-mono">
                      name, roll_number, dob<br />
                      Aarav Patel, 2024001, 15/06/2005<br />
                      Priya Singh, 2024002, 22/03/2005
                    </code>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1a2e2e] mb-1.5 uppercase tracking-wider">Select CSV File</label>
                    <input type="file" accept=".csv,.txt" required onChange={e => setCsvFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2.5 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] file:mr-3 file:py-1 file:px-3 file:border-0 file:bg-[#008080] file:text-white file:text-xs file:font-bold file:uppercase text-sm" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={addingStudent || !csvFile}
                      className="flex-1 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-bold disabled:opacity-50 border-b-2 border-[#004d4d] uppercase text-sm">
                      {addingStudent ? 'Importing...' : 'Import'}
                    </button>
                    <button type="button" onClick={() => { setShowAddStudentModal(false); setAddError(''); }}
                      className="px-4 py-2.5 bg-white border-2 border-[#b2d8d8] text-[#1a2e2e] font-bold hover:border-[#008080] uppercase text-sm">
                      Close
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
