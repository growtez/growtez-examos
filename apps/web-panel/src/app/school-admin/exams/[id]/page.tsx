'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Copy, Globe, Link2, MoreVertical, Plus, Settings2, Trash2, Users, AlertCircle, Copy as CopyIcon, Play, Edit2, Check } from 'lucide-react';

function CustomCombobox({ value, onChange, options, placeholder, className }: { value: string, onChange: (v: string) => void, options: string[], placeholder: string, className: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setFilteredOptions(options.filter(o => o.toLowerCase().includes(value.toLowerCase())));
  }, [value, options]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={className}
      />
      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-[#8ab8b8]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-[#e0f2f2] mt-1 rounded-xl shadow-xl shadow-[#008080]/10 max-h-40 overflow-auto">
          {filteredOptions.map((opt) => (
            <li
              key={opt}
              className="px-4 py-2.5 hover:bg-[#f5f9f9] cursor-pointer text-sm font-medium text-[#1a2e2e] transition-colors"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
  const [editDurationMode, setEditDurationMode] = useState(false);
  const [inlineEditDuration, setInlineEditDuration] = useState(180);
  const [editSubjectId, setEditSubjectId] = useState<string | null>(null);
  const [inlineEditSubjectCount, setInlineEditSubjectCount] = useState(0);
  const [assignedSearchQuery, setAssignedSearchQuery] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  // Add student form fields
  const [newName, setNewName] = useState('');
  const [newRoll, setNewRoll] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newBatch, setNewBatch] = useState('');
  const [newSession, setNewSession] = useState('');
  const [linkCourse, setLinkCourse] = useState('');
  const [linkBatch, setLinkBatch] = useState('');
  const [linkSession, setLinkSession] = useState('');
  const [schoolStudents, setSchoolStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addMode, setAddMode] = useState<'link' | 'search' | 'create' | 'csv'>('link');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);

  // Instructions Editing State & Helpers
  const [instructionsList, setInstructionsList] = useState<string[]>([]);
  const [editInstructionsMode, setEditInstructionsMode] = useState(false);

  useEffect(() => {
    if (exam) {
      setInstructionsList(exam.exam_instructions || []);
    }
  }, [exam]);

  const handleSaveInstructions = async () => {
    const filtered = instructionsList.filter(inst => inst.trim() !== '');
    const { error } = await supabase
      .from('exams')
      .update({ exam_instructions: filtered })
      .eq('id', params.id);

    if (error) {
      alert('Failed to save instructions: ' + error.message);
    } else {
      setExam({ ...exam, exam_instructions: filtered });
      setEditInstructionsMode(false);
    }
  };

  const addInstructionItem = () => {
    setInstructionsList([...instructionsList, '']);
  };

  const removeInstructionItem = (index: number) => {
    setInstructionsList(instructionsList.filter((_, i) => i !== index));
  };

  const updateInstructionItem = (index: number, value: string) => {
    const updated = [...instructionsList];
    updated[index] = value;
    setInstructionsList(updated);
  };
  const [newSubject, setNewSubject] = useState({ name: '', questionCount: 10, teacherIds: [] as string[] });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmColor: 'bg-[#008080] hover:bg-[#006666] border-[#004d4d]',
    onConfirm: () => {}
  });

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
      .select('*')
      .eq('exam_id', params.id)
      .order('created_at');

    let assignedWithStudents: any[] = [];
    if (examStudents && examStudents.length > 0) {
      const studentIds = examStudents.map((es: any) => es.student_id);
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, full_name, roll_number, date_of_birth')
        .in('id', studentIds);
        
      assignedWithStudents = examStudents.map((es: any) => ({
        ...es,
        students: studentsData?.find((s: any) => s.id === es.student_id) || null
      }));
    }
    setAssignedStudents(assignedWithStudents);

    // Fetch all students in the school
    const { data: allStudents } = await supabase
      .from('students')
      .select('id, full_name, roll_number, date_of_birth, course, batch, session')
      .eq('school_id', examData.school_id)
      .order('full_name');
    setSchoolStudents(allStudents || []);

    // Fetch all teachers in the school
    const { data: allTeachers } = await supabase
      .from('teachers')
      .select('*')
      .eq('school_id', examData.school_id)
      .order('department', { ascending: true })
      .order('full_name', { ascending: true });
    setTeachers(allTeachers || []);

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

  const handleSaveDuration = async () => {
    setEditDurationMode(false);
    await supabase.from('exams').update({ duration_minutes: inlineEditDuration }).eq('id', params.id);
    fetchExamData();
  };

  const handleSaveSubjectCount = async (subjectId: string) => {
    setEditSubjectId(null);
    await supabase.from('exam_subjects').update({ question_count: inlineEditSubjectCount }).eq('id', subjectId);
    fetchExamData();
  };

  const handleDeleteSubject = async (e: React.MouseEvent, subjectId: string, subjectName: string) => {
    e.preventDefault();
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Subject',
      message: `Are you sure you want to delete "${subjectName}"? This will remove all questions associated with it.`,
      confirmText: 'Delete',
      confirmColor: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        await supabase.from('exam_subjects').delete().eq('id', subjectId);
        fetchExamData();
      }
    });
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim()) {
      alert('Subject name is required');
      return;
    }
    
    const sortOrder = subjects.length;
    const { data: subjectRow, error: subjectError } = await supabase.from('exam_subjects').insert({
      exam_id: params.id,
      subject_name: newSubject.name,
      question_count: Math.max(0, newSubject.questionCount),
      sort_order: sortOrder,
    }).select().single();

    if (subjectError) {
      alert('Failed to add subject: ' + subjectError.message);
      return;
    }

    if (newSubject.teacherIds.length > 0) {
      const teacherInserts = newSubject.teacherIds.map(tId => ({
        exam_subject_id: subjectRow.id,
        teacher_id: tId
      }));
      await supabase.from('exam_subject_teachers').insert(teacherInserts);
    }

    setShowAddSubjectModal(false);
    setNewSubject({ name: '', questionCount: 10, teacherIds: [] });
    fetchExamData();
  };

  const toggleNewSubjectTeacher = (teacherId: string) => {
    setNewSubject(prev => {
      const ids = prev.teacherIds;
      if (ids.includes(teacherId)) {
        return { ...prev, teacherIds: ids.filter(id => id !== teacherId) };
      }
      return { ...prev, teacherIds: [...ids, teacherId] };
    });
  };

  const handleAssignExisting = async (studentId: string) => {
    setAddError('');
    setAddSuccess('');
    const { error } = await supabase.from('exam_students').insert({
      exam_id: params.id,
      student_id: studentId,
      status: 'assigned'
    });
    if (error) {
      if (error.code === '23505') {
        setAddError('Student is already assigned to this exam.');
      } else {
        setAddError(error.message);
      }
    } else {
      setAddSuccess('Student assigned successfully!');
      fetchExamData();
    }
  };

  const handleBulkAssign = async () => {
    if (selectedStudents.length === 0) return;
    setAddError('');
    setAddSuccess('');
    setBulkAssigning(true);
    
    const { error } = await supabase.rpc('assign_students', {
      p_exam_id: params.id,
      p_student_ids: selectedStudents
    });

    if (error) {
      setAddError(error.message);
    } else {
      setAddSuccess(`${selectedStudents.length} students assigned successfully!`);
      setSelectedStudents([]);
      fetchExamData();
    }
    setBulkAssigning(false);
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
          course: newCourse,
          batch: newBatch,
          session: newSession,
          exam_id: params.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add student');
      setAddSuccess(`Student "${newName}" added successfully!`);
      setNewName(''); setNewRoll(''); setNewDob('');
      setNewCourse(''); setNewBatch(''); setNewSession('');
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
        const [studentName, studentRoll, studentDob, csvCourse = '', csvBatch = '', csvSession = ''] = cols;
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
            body: JSON.stringify({ 
              full_name: studentName, 
              roll_number: studentRoll, 
              date_of_birth: formattedDob, 
              course: csvCourse,
              batch: csvBatch,
              session: csvSession,
              exam_id: params.id 
            }),
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

  const handleRemoveStudent = (examStudentId: string, studentId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Student',
      message: 'Are you sure you want to remove this student from the exam? Their account will be permanently deleted.',
      confirmText: 'Remove Student',
      confirmColor: 'bg-red-600 hover:bg-red-700 border-red-800',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        await supabase.from('exam_students').delete().eq('id', examStudentId);
        await fetch('/api/students/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId }),
        });
        fetchExamData();
      }
    });
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

  const handleUnpublish = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Unpublish Exam',
      message: 'Are you sure you want to unpublish this exam? This will revert it to a draft state.',
      confirmText: 'Unpublish',
      confirmColor: 'bg-orange-500 hover:bg-orange-600 border-orange-700',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setPublishing(true);
        const updates = { status: 'draft', start_time: null, end_time: null };
        const { error } = await supabase.from('exams').update(updates).eq('id', params.id);
        if (!error) setExam({ ...exam, ...updates });
        else alert('Failed to unpublish exam.');
        setPublishing(false);
      }
    });
  };

  const handleTrash = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Trash Exam',
      message: 'Are you sure you want to move this exam to the trash?',
      confirmText: 'Move to Trash',
      confirmColor: 'bg-red-600 hover:bg-red-700 border-red-800',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        const { error } = await supabase.from('exams').update({ is_trashed: true }).eq('id', params.id);
        if (!error) window.location.href = '/exams';
        else alert('Failed to move exam to trash.');
      }
    });
  };

  if (loading) return (
    <div className="max-w-4xl animate-pulse mx-auto">
      <div className="mb-8">
        <div className="w-24 h-4 bg-[#f5f9f9] rounded-md mb-4"></div>
        <div className="flex justify-between items-center">
          <div>
            <div className="w-64 h-8 bg-[#e0f2f2] rounded-lg mb-2"></div>
            <div className="w-96 h-4 bg-[#f5f9f9] rounded-md"></div>
          </div>
          <div className="w-32 h-10 bg-[#e0f2f2] rounded-xl"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-[#e0f2f2] rounded-2xl p-5 shadow-sm">
            <div className="w-20 h-4 bg-[#f5f9f9] rounded-md mb-3"></div>
            <div className="w-24 h-7 bg-[#e0f2f2] rounded-lg"></div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-[#e0f2f2] rounded-2xl p-6 mb-6 shadow-sm">
        <div className="w-24 h-6 bg-[#e0f2f2] rounded-md mb-4"></div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-[#f5f9f9] border border-[#e0f2f2] rounded-xl p-4 h-20"></div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-[#e0f2f2] rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex justify-between mb-4">
          <div className="w-32 h-6 bg-[#e0f2f2] rounded-md"></div>
          <div className="w-48 h-10 bg-[#f5f9f9] rounded-xl"></div>
        </div>
        <div className="w-full h-32 bg-[#f5f9f9] rounded-xl mt-4"></div>
      </div>
    </div>
  );
  if (!exam) return <div className="text-gray-500 p-12 text-center">Exam not found</div>;

  const totalQuestionsNeeded = subjects.reduce((acc, s) => acc + s.question_count, 0);
  const totalQuestionsAdded = Object.values(questionCounts).reduce((a, b) => a + b, 0);
  const allQuestionsReady = subjects.every(s => (questionCounts[s.id] || 0) >= s.question_count);

  const availableStudents = schoolStudents.filter(s => !assignedStudents.some(as => as.student_id === s.id));
  
  const uniqueCourses = Array.from(new Set(schoolStudents.map(s => s.course).filter(Boolean)));
  const uniqueBatches = Array.from(new Set(schoolStudents.map(s => s.batch).filter(Boolean)));
  const uniqueSessions = Array.from(new Set(schoolStudents.map(s => s.session).filter(Boolean)));

  const filteredStudents = availableStudents.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.roll_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = filterCourse ? s.course === filterCourse : true;
    const matchesBatch = filterBatch ? s.batch === filterBatch : true;
    return matchesSearch && matchesCourse && matchesBatch;
  });

  const filteredAssignedStudents = assignedStudents.filter((as: any) => 
    as.students?.full_name?.toLowerCase().includes(assignedSearchQuery.toLowerCase()) || 
    as.students?.roll_number?.toLowerCase().includes(assignedSearchQuery.toLowerCase())
  );

  const isExamOver = exam?.end_time ? new Date(exam.end_time) < new Date() : false;
  const displayStatus = isExamOver ? 'completed' : exam?.status || 'draft';

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1a2e2e]">{exam.title}</h2>
            {exam.description && <p className="text-[#555555] mt-1 text-sm font-medium">{exam.description}</p>}
          </div>
          <div className="flex items-center gap-3">
            {!isExamOver && exam?.status !== 'draft' && (
              <button 
                onClick={handleUnpublish}
                disabled={publishing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#e0f2f2] rounded-xl text-sm font-semibold text-[#1a2e2e] hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm disabled:opacity-50"
              >
                <Settings2 size={16} />
                Unpublish
              </button>
            )}
            <button 
              onClick={handleDuplicate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#e0f2f2] rounded-xl text-sm font-semibold text-[#1a2e2e] hover:border-[#008080] hover:text-[#008080] hover:bg-[#f5f9f9] transition-all shadow-sm"
            >
              <Copy size={16} />
              Duplicate
            </button>
            <button 
              onClick={handleTrash}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#e0f2f2] rounded-xl text-sm font-semibold text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
            >
              <Trash2 size={16} />
              Trash
            </button>
            <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColors[displayStatus] || statusColors.draft}`}>
              {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Exam Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#f5f9f9] border border-[#e0f2f2] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#008080]/10 rounded-xl flex items-center justify-center text-[#008080]">
            <Clock size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[#555555] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              Duration
              {!isExamOver && exam?.status === 'draft' && !editDurationMode && (
                <button onClick={() => { setInlineEditDuration(exam.duration_minutes || 180); setEditDurationMode(true); }} className="text-[#8ab8b8] hover:text-[#008080] transition-colors p-0.5 rounded hover:bg-[#e0f2f2]">
                  <Edit2 size={12} />
                </button>
              )}
            </p>
            {editDurationMode ? (
              <div className="flex items-center gap-2 mt-1">
                <input type="number" value={inlineEditDuration} onChange={(e) => setInlineEditDuration(Math.max(0, parseInt(e.target.value) || 0))} className="w-20 px-2 py-1 text-sm border border-[#008080] rounded outline-none font-bold text-[#1a2e2e]" min="0" />
                <button onClick={handleSaveDuration} className="text-white bg-[#008080] hover:bg-[#006666] p-1 rounded transition-colors"><Check size={14}/></button>
              </div>
            ) : (
              <p className="text-xl font-bold text-[#1a2e2e] mt-0.5">{exam?.duration_minutes || 0} min</p>
            )}
          </div>
        </div>
        <div className="bg-[#f5f9f9] border border-[#e0f2f2] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-[#555555] text-xs font-bold uppercase tracking-wider">Questions</p>
            <p className="text-xl font-bold text-[#1a2e2e] mt-0.5">{totalQuestionsAdded} / {totalQuestionsNeeded}</p>
          </div>
        </div>
        <div className="bg-[#f5f9f9] border border-[#e0f2f2] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[#555555] text-xs font-bold uppercase tracking-wider">Students Assigned</p>
            <p className="text-xl font-bold text-[#1a2e2e] mt-0.5">{assignedStudents.length}</p>
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div className="bg-white border border-[#e0f2f2] rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#1a2e2e]">Subjects</h3>
          {!isExamOver && exam?.status === 'draft' && (
            <button 
              onClick={() => setShowAddSubjectModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#b2d8d8] text-[#008080] rounded-lg text-sm font-semibold hover:bg-[#e0f2f2] transition-colors shadow-sm"
            >
              <Plus size={16} />
              Add Subject
            </button>
          )}
        </div>
        <div className="space-y-3">
          {subjects.map((s) => {
            const added = questionCounts[s.id] || 0;
            const needed = s.question_count;
            const complete = added >= needed;
            return (
              <Link key={s.id} href={`/exams/${params.id}/questions?subject=${s.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#f5f9f9] border border-[#e0f2f2] rounded-xl p-4 gap-4 hover:bg-[#e0f2f2]/50 transition-colors group cursor-pointer">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[#1a2e2e] font-bold">{s.subject_name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {added}/{needed} questions
                      </span>
                      {!isExamOver && exam?.status === 'draft' && editSubjectId !== s.id && (
                        <button onClick={(e) => { e.preventDefault(); setInlineEditSubjectCount(needed); setEditSubjectId(s.id); }} className="text-[#8ab8b8] hover:text-[#008080] transition-colors p-1 rounded-md hover:bg-[#e0f2f2]">
                          <Edit2 size={14} />
                        </button>
                      )}
                      {editSubjectId === s.id && (
                        <div className="flex items-center gap-1" onClick={e => e.preventDefault()}>
                          <input type="number" value={inlineEditSubjectCount} onChange={(e) => setInlineEditSubjectCount(Math.max(0, parseInt(e.target.value) || 0))} className="w-16 px-2 py-1 text-xs border border-[#008080] rounded outline-none font-bold text-[#1a2e2e]" min="0" />
                          <button onClick={() => handleSaveSubjectCount(s.id)} className="text-white bg-[#008080] hover:bg-[#006666] p-1 rounded transition-colors"><Check size={14}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {s.exam_subject_teachers?.map((est: any) => (
                      <span key={est.id} className="text-[10px] font-bold uppercase tracking-wider text-[#008080] bg-white border border-[#b2d8d8] px-2 py-0.5 rounded-md">
                        {est.teachers?.full_name || 'Unknown'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#b2d8d8] text-[#008080] text-sm font-semibold rounded-xl group-hover:bg-[#e0f2f2] transition-colors shadow-sm whitespace-nowrap">
                    <Plus size={16} />
                    Manage Questions
                  </span>
                  {!isExamOver && exam?.status === 'draft' && (
                    <button 
                      onClick={(e) => handleDeleteSubject(e, s.id, s.subject_name)} 
                      className="text-red-400 hover:text-red-600 transition-colors p-2 border border-transparent hover:border-red-200 rounded-xl hover:bg-red-50 bg-white shadow-sm"
                      title="Delete Subject"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Exam Instructions */}
      <div className="bg-white border border-[#e0f2f2] rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#1a2e2e]">Exam Instructions</h3>
          {!isExamOver && exam?.status === 'draft' && (
            editInstructionsMode ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveInstructions}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#008080] text-white rounded-lg text-xs font-bold hover:bg-[#006666] transition-colors shadow-sm"
                >
                  <Check size={14} />
                  Save Instructions
                </button>
                <button
                  onClick={() => {
                    setInstructionsList(exam.exam_instructions || []);
                    setEditInstructionsMode(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e0f2f2] text-[#555555] rounded-lg text-xs font-bold hover:bg-[#f5f9f9] transition-colors shadow-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setInstructionsList(exam.exam_instructions && exam.exam_instructions.length > 0 ? exam.exam_instructions : ['']);
                  setEditInstructionsMode(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#b2d8d8] text-[#008080] rounded-lg text-sm font-semibold hover:bg-[#e0f2f2] transition-colors shadow-sm"
              >
                <Edit2 size={14} />
                Edit Instructions
              </button>
            )
          )}
        </div>

        {editInstructionsMode ? (
          <div className="space-y-4">
            <div className="space-y-3">
              {instructionsList.map((inst, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-[#8ab8b8] font-bold text-sm w-6 text-right">{index + 1}.</span>
                  <input
                    type="text"
                    value={inst}
                    onChange={(e) => updateInstructionItem(index, e.target.value)}
                    placeholder="e.g. Do not close or minimize the browser window during the exam."
                    className="flex-1 px-4 py-2.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium"
                  />
                  {instructionsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstructionItem(index)}
                      className="text-red-500 hover:text-red-600 text-xs font-semibold px-2 py-1.5"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addInstructionItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#b2d8d8] text-[#008080] rounded-lg text-xs font-bold hover:bg-[#e0f2f2] transition-colors shadow-sm"
            >
              <Plus size={14} />
              Add Bullet
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {exam?.exam_instructions && exam.exam_instructions.length > 0 ? (
              <ol className="list-decimal pl-5 space-y-2">
                {exam.exam_instructions.map((inst: string, index: number) => (
                  <li key={index} className="text-[#555555] text-sm font-medium leading-relaxed">
                    {inst}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-[#8ab8b8] text-sm italic font-medium">No custom instructions configured for this exam yet. It will use the general school instructions.</p>
            )}
          </div>
        )}
      </div>

      {/* Assigned Students */}
      <div className="bg-white border border-[#e0f2f2] rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#1a2e2e]">Students ({assignedStudents.length})</h3>
            <p className="text-[#555555] text-sm font-medium mt-1">Students are specific to this exam</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isExamOver && (
              <>
                <button onClick={() => { setShowAddStudentModal(true); setAddMode('link'); setAddError(''); setAddSuccess(''); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#008080] text-white text-sm font-semibold rounded-xl hover:bg-[#006666] hover:shadow-lg hover:shadow-[#008080]/30 transition-all active:scale-95">
                  <Link2 size={16} />
                  Share Link
                </button>
                <button onClick={() => { setShowAddStudentModal(true); setAddMode('search'); setAddError(''); setAddSuccess(''); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1a2e2e] text-sm font-semibold border border-[#e0f2f2] rounded-xl hover:border-[#008080] hover:text-[#008080] hover:bg-[#f5f9f9] transition-all shadow-sm">
                  <Plus size={16} />
                  Add Student
                </button>
                <button onClick={() => { setShowAddStudentModal(true); setAddMode('csv'); setAddError(''); setAddSuccess(''); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#1a2e2e] text-sm font-semibold border border-[#e0f2f2] rounded-xl hover:border-[#008080] hover:text-[#008080] hover:bg-[#f5f9f9] transition-all shadow-sm">
                  <Plus size={16} />
                  Import CSV
                </button>
              </>
            )}
          </div>
        </div>

        {addSuccess && <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-4 rounded-xl text-sm font-medium mb-6">{addSuccess}</div>}

        <div className="mb-4">
          <input type="text" placeholder="Search assigned students..." value={assignedSearchQuery} onChange={(e) => setAssignedSearchQuery(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 bg-[#f5f9f9] border border-[#e0f2f2] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] transition-all text-sm font-medium" />
        </div>

        {assignedStudents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#e0f2f2] rounded-2xl bg-[#f5f9f9]/50">
            <Users size={32} className="mx-auto text-[#8ab8b8] mb-3" />
            <p className="text-[#1a2e2e] text-base font-bold">No students added yet.</p>
            <p className="text-[#555555] text-sm font-medium mt-1">Students are specific to this exam. Add them using the buttons above.</p>
          </div>
        ) : filteredAssignedStudents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#e0f2f2] rounded-2xl bg-[#f5f9f9]/50">
            <p className="text-[#555555] text-sm font-medium mt-1">No students found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#e0f2f2]">
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#f5f9f9] border-b border-[#e0f2f2]">
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#555555] uppercase tracking-wider">Roll No.</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#555555] uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-[#555555] uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-[#555555] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignedStudents.map((as: any) => (
                  <tr key={as.id} className="border-b border-[#e0f2f2] hover:bg-[#f5f9f9]/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-[#008080] bg-[#f5f9f9] border border-[#e0f2f2] px-2 py-1 rounded-md text-xs font-bold">{as.students?.roll_number}</span>
                    </td>
                    <td className="px-4 py-3 text-[#1a2e2e] text-sm font-semibold">{as.students?.full_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border ${
                        as.status === 'submitted' ? 'bg-[#008080]/10 text-[#008080] border-[#008080]/20' :
                        as.status === 'in_progress' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {as.status === 'submitted' ? '✓ Submitted' : as.status === 'in_progress' ? '▶ In Progress' : 'Assigned'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                      {isExamOver && as.status === 'submitted' && (
                        <Link href="/school-admin/results" className="text-[#008080] hover:text-[#006666] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#008080]/10 transition-colors">
                          View Result
                        </Link>
                      )}
                      {!isExamOver && (as.status === 'in_progress' || as.status === 'submitted') && (
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Reset Exam Attempt',
                              message: "Are you sure you want to reset this student's exam? This will completely delete their current progress and results so they can retake it.",
                              confirmText: 'Reset Exam',
                              confirmColor: 'bg-amber-600 hover:bg-amber-700 text-white',
                              onConfirm: async () => {
                                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                const { error } = await supabase.rpc('reset_student_exam', { p_exam_id: params.id, p_student_id: as.student_id });
                                if (error) alert('Failed to reset: ' + error.message);
                                else fetchExamData();
                              }
                            });
                          }}
                          className="text-amber-600 hover:text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                        >
                          Reset
                        </button>
                      )}
                      {!isExamOver && as.status === 'assigned' && (
                        <button
                          onClick={() => handleRemoveStudent(as.id, as.student_id)}
                          className="text-red-500 hover:text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Publish Button */}
      {exam.status === 'draft' && (
        <div className="bg-[#f5f9f9] border border-[#e0f2f2] rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#1a2e2e] mb-2">Publish Exam</h3>
          <p className="text-[#555555] text-sm font-medium mb-6">
            {allQuestionsReady
              ? 'All questions are ready. Set the start and end times, then publish the exam.'
              : 'Some subjects still need more questions. Add all required questions before publishing.'}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-2xl">
            <div>
              <label className="block text-xs font-semibold text-[#1a2e2e] mb-1.5">Start Time (Auto-publish) *</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={!allQuestionsReady || publishing}
                className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all disabled:opacity-50 text-sm font-medium" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a2e2e] mb-1.5">End Time (Auto-end) *</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!allQuestionsReady || publishing}
                className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all disabled:opacity-50 text-sm font-medium" />
            </div>
          </div>

          <button onClick={handlePublish} disabled={!allQuestionsReady || publishing || !startTime || !endTime}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#008080] hover:bg-[#006666] text-white font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm">
            <Play size={16} />
            {publishing ? 'Publishing...' : 'Publish Exam'}
          </button>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowAddStudentModal(false); setAddError(''); setAddSuccess(''); setAddMode('link'); setLinkCopied(false); setSearchQuery(''); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#008080] px-6 py-4 flex items-center justify-between">
              <span className="text-white font-bold">Add Students to Exam</span>
              <button onClick={() => { setShowAddStudentModal(false); setAddError(''); setAddSuccess(''); setAddMode('link'); setLinkCopied(false); setSearchQuery(''); }} className="text-white/70 hover:text-white transition-colors">✕</button>
            </div>

            <div className="p-6">
              {/* Tabs */}
              <div className="flex bg-[#f5f9f9] rounded-xl p-1 mb-6 border border-[#e0f2f2]">
                <button
                  onClick={() => { setAddMode('link'); setAddError(''); setAddSuccess(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMode === 'link' ? 'bg-white text-[#008080] shadow-sm' : 'text-[#8ab8b8] hover:text-[#1a2e2e]'}`}
                >
                  Share Link
                </button>
                <button
                  onClick={() => { setAddMode('search'); setAddError(''); setAddSuccess(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMode === 'search' || addMode === 'create' ? 'bg-white text-[#008080] shadow-sm' : 'text-[#8ab8b8] hover:text-[#1a2e2e]'}`}
                >
                  Search & Add
                </button>
                <button
                  onClick={() => { setAddMode('csv'); setAddError(''); setAddSuccess(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMode === 'csv' ? 'bg-white text-[#008080] shadow-sm' : 'text-[#8ab8b8] hover:text-[#1a2e2e]'}`}
                >
                  Import CSV
                </button>
              </div>

              {addSuccess && <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-600 text-sm font-medium mb-6">{addSuccess}</div>}
              {addError && <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-sm font-medium mb-6 flex items-center gap-2"><AlertCircle size={16}/> {addError}</div>}

              {addMode === 'link' ? (
                <div className="space-y-4">
                  <div className="bg-white border border-[#e0f2f2] rounded-xl p-6">
                    <Globe size={32} className="mx-auto text-[#008080] mb-3" />
                    <p className="text-[#1a2e2e] text-base font-bold text-center mb-2">Public Registration Link</p>
                    <p className="text-[#555555] text-sm font-medium text-center mb-5">Share this link with students. They will be automatically added to this exam upon completing the form.</p>
                    
                    <div className="bg-[#f5f9f9] border border-[#e0f2f2] p-4 rounded-xl mb-5 space-y-3">
                      <p className="text-xs font-bold text-[#008080] uppercase tracking-wider mb-2">Optional: Pre-fill Student Details</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-wider mb-1">Course</label>
                          <CustomCombobox 
                            value={linkCourse} 
                            onChange={setLinkCourse} 
                            options={uniqueCourses as string[]} 
                            placeholder="e.g. NEET"
                            className="w-full px-3 py-2 bg-white border border-[#b2d8d8] rounded-lg text-[#1a2e2e] text-xs focus:outline-none focus:border-[#008080]" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-wider mb-1">Batch</label>
                          <CustomCombobox 
                            value={linkBatch} 
                            onChange={setLinkBatch} 
                            options={uniqueBatches as string[]} 
                            placeholder="e.g. Morning"
                            className="w-full px-3 py-2 bg-white border border-[#b2d8d8] rounded-lg text-[#1a2e2e] text-xs focus:outline-none focus:border-[#008080]" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#555555] uppercase tracking-wider mb-1">Session</label>
                          <CustomCombobox 
                            value={linkSession} 
                            onChange={setLinkSession} 
                            options={uniqueSessions as string[]} 
                            placeholder="e.g. 2024-25"
                            className="w-full px-3 py-2 bg-white border border-[#b2d8d8] rounded-lg text-[#1a2e2e] text-xs focus:outline-none focus:border-[#008080]" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register/${params.id}${linkCourse || linkBatch || linkSession ? `?p=${btoa(JSON.stringify({ c: linkCourse || undefined, b: linkBatch || undefined, s: linkSession || undefined }))}` : ''}`}
                        className="flex-1 px-4 py-2.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-sm text-[#555555] font-mono focus:outline-none truncate" 
                      />
                      <button 
                        onClick={() => {
                          const url = `${window.location.origin}/register/${params.id}${linkCourse || linkBatch || linkSession ? `?p=${btoa(JSON.stringify({ c: linkCourse || undefined, b: linkBatch || undefined, s: linkSession || undefined }))}` : ''}`;
                          navigator.clipboard.writeText(url);
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }}
                        className="px-4 py-2.5 bg-[#008080] hover:bg-[#006666] text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
                      >
                        <CopyIcon size={16}/>
                        {linkCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="button" onClick={() => { setShowAddStudentModal(false); setAddError(''); setSearchQuery(''); }}
                      className="px-6 py-2.5 bg-white border border-[#e0f2f2] text-[#555555] font-semibold rounded-xl hover:bg-[#f5f9f9] text-sm transition-colors">
                      Close
                    </button>
                  </div>
                </div>
              ) : addMode === 'search' ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      placeholder="Search by name or roll number..."
                      className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 text-sm font-medium transition-all"
                    />
                    <div className="flex gap-2">
                      <select
                        value={filterCourse}
                        onChange={e => setFilterCourse(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-[#e0f2f2] rounded-lg text-sm text-[#1a2e2e] focus:outline-none focus:border-[#008080]"
                      >
                        <option value="">All Courses</option>
                        {uniqueCourses.map((c: any) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select
                        value={filterBatch}
                        onChange={e => setFilterBatch(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-[#e0f2f2] rounded-lg text-sm text-[#1a2e2e] focus:outline-none focus:border-[#008080]"
                      >
                        <option value="">All Batches</option>
                        {uniqueBatches.map((b: any) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {filteredStudents.length > 0 && (
                    <div className="flex justify-between items-center px-1">
                      <div className="text-xs font-semibold text-[#555555]">
                        {selectedStudents.length} selected
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            if (selectedStudents.length === filteredStudents.length) {
                              setSelectedStudents([]);
                            } else {
                              setSelectedStudents(filteredStudents.map(s => s.id));
                            }
                          }}
                          className="text-[#008080] text-xs font-bold hover:underline"
                        >
                          {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="max-h-60 overflow-y-auto border border-[#e0f2f2] rounded-xl divide-y divide-[#e0f2f2]">
                    {filteredStudents.map(student => (
                      <div key={student.id} className="p-3 flex justify-between items-center hover:bg-[#f5f9f9] transition-colors cursor-pointer" onClick={() => {
                        setSelectedStudents(prev => 
                          prev.includes(student.id) 
                            ? prev.filter(id => id !== student.id)
                            : [...prev, student.id]
                        );
                      }}>
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => {}} 
                            className="w-4 h-4 text-[#008080] border-[#b2d8d8] rounded focus:ring-[#008080] cursor-pointer"
                          />
                          <div>
                            <p className="font-semibold text-[#1a2e2e] text-sm">{student.full_name}</p>
                            <p className="text-xs font-mono text-[#008080] mt-0.5">Roll: {student.roll_number} <span className="text-[#8ab8b8] px-1">•</span> <span className="text-gray-500 font-sans">{student.course} ({student.batch})</span></p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAssignExisting(student.id); }} 
                          className="px-4 py-2 bg-[#e0f2f2] text-[#008080] hover:bg-[#008080] hover:text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                    {filteredStudents.length === 0 && (
                      <div className="p-6 text-center">
                        <p className="text-sm font-medium text-[#555555]">No available students found.</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedStudents.length > 0 && (
                    <button 
                      onClick={handleBulkAssign}
                      disabled={bulkAssigning}
                      className="w-full py-3 mt-2 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl shadow-lg shadow-[#008080]/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {bulkAssigning ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        `Assign ${selectedStudents.length} Selected Student${selectedStudents.length !== 1 ? 's' : ''}`
                      )}
                    </button>
                  )}

                  <div className="pt-2 text-center">
                    <p className="text-sm font-medium text-[#555555]">Can't find the student?</p>
                    <button 
                      type="button" 
                      onClick={() => { setAddMode('create'); setAddError(''); setAddSuccess(''); }} 
                      className="mt-2 text-[#008080] font-bold text-sm hover:underline"
                    >
                      Create New Student
                    </button>
                  </div>
                </div>
              ) : addMode === 'create' ? (
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[#1a2e2e] font-bold text-sm">Create New Student</h4>
                    <button 
                      type="button" 
                      onClick={() => { setAddMode('search'); setAddError(''); setAddSuccess(''); }} 
                      className="text-[#008080] text-xs font-bold hover:underline"
                    >
                      ← Back to Search
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1.5">Full Name</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required
                      placeholder="Aarav Patel"
                      className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 text-sm font-medium transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1.5">Roll Number</label>
                    <input type="text" value={newRoll} onChange={e => setNewRoll(e.target.value)} required
                      placeholder="2024001"
                      className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 text-sm font-medium transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1.5">Date of Birth <span className="text-[#8ab8b8] font-normal">(password = DDMMYYYY)</span></label>
                    <input type="date" value={newDob} onChange={e => setNewDob(e.target.value)} required
                      className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 text-sm font-medium transition-all" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1.5">Course</label>
                      <CustomCombobox 
                        value={newCourse} 
                        onChange={setNewCourse} 
                        options={uniqueCourses as string[]} 
                        placeholder="e.g. NEET"
                        className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 text-sm font-medium transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1.5">Batch</label>
                      <CustomCombobox 
                        value={newBatch} 
                        onChange={setNewBatch} 
                        options={uniqueBatches as string[]} 
                        placeholder="e.g. Morning"
                        className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 text-sm font-medium transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#555555] mb-1.5">Session</label>
                      <CustomCombobox 
                        value={newSession} 
                        onChange={setNewSession} 
                        options={uniqueSessions as string[]} 
                        placeholder="e.g. 2024-25"
                        className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 text-sm font-medium transition-all" 
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={addingStudent}
                      className="flex-1 py-3 bg-[#008080] hover:bg-[#006666] text-white font-semibold rounded-xl disabled:opacity-50 text-sm transition-colors shadow-sm shadow-[#008080]/20">
                      {addingStudent ? 'Creating...' : 'Create & Assign'}
                    </button>
                    <button type="button" onClick={() => { setShowAddStudentModal(false); setAddError(''); setSearchQuery(''); }}
                      className="px-6 py-3 bg-white border border-[#e0f2f2] text-[#555555] font-semibold rounded-xl hover:bg-[#f5f9f9] text-sm transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCsvImport} className="space-y-4">
                  <div className="bg-[#f5f9f9] border border-[#e0f2f2] rounded-xl p-5">
                    <p className="text-[#1a2e2e] text-sm font-bold mb-2">CSV Format:</p>
                    <code className="text-xs text-[#008080] bg-white px-4 py-3 block border border-[#e0f2f2] rounded-lg font-mono overflow-x-auto whitespace-nowrap">
                      name, roll_number, dob, course, batch, session<br />
                      Aarav Patel, 2024001, 15/06/2005, NEET, Morning, 2024-25<br />
                      Priya Singh, 2024002, 22/03/2005, JEE, Evening, 2024-25
                    </code>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#555555] mb-1.5">Select CSV File</label>
                    <input type="file" accept=".csv,.txt" required onChange={e => setCsvFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-lg file:bg-[#008080]/10 file:text-[#008080] file:font-semibold hover:file:bg-[#008080]/20 transition-all text-sm" />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={addingStudent || !csvFile}
                      className="flex-1 py-3 bg-[#008080] hover:bg-[#006666] text-white font-semibold rounded-xl disabled:opacity-50 text-sm transition-colors shadow-sm shadow-[#008080]/20">
                      {addingStudent ? 'Importing...' : 'Import CSV'}
                    </button>
                    <button type="button" onClick={() => { setShowAddStudentModal(false); setAddError(''); }}
                      className="px-6 py-3 bg-white border border-[#e0f2f2] text-[#555555] font-semibold rounded-xl hover:bg-[#f5f9f9] text-sm transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-[#1a2e2e] mb-2">{confirmDialog.title}</h3>
              <p className="text-[#555555] text-sm font-medium mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 bg-white border border-[#e0f2f2] text-[#555555] font-semibold rounded-xl hover:bg-[#f5f9f9] text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  className={`flex-1 py-3 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm ${
                    confirmDialog.confirmColor.includes('red') ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 
                    confirmDialog.confirmColor.includes('orange') ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 
                    confirmDialog.confirmColor.includes('amber') ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 
                    'bg-[#008080] hover:bg-[#006666] shadow-[#008080]/20'
                  }`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#008080] px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold">Add Subject</h3>
              <button onClick={() => setShowAddSubjectModal(false)} className="text-white/70 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddSubject} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1.5">Subject Name</label>
                  <input type="text" value={newSubject.name} onChange={(e) => setNewSubject({...newSubject, name: e.target.value})} required
                    className="w-full px-4 py-2.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium"
                    placeholder="e.g. Physics" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1.5">No. of Questions</label>
                  <input type="number" value={newSubject.questionCount} onChange={(e) => setNewSubject({...newSubject, questionCount: Math.max(0, parseInt(e.target.value) || 0)})} min="0" required
                    className="w-full px-4 py-2.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium" />
                </div>
              </div>
              <div className="mb-6 max-h-48 overflow-y-auto custom-scrollbar border border-[#e0f2f2] rounded-lg p-3 bg-[#f5f9f9]">
                <label className="block text-xs font-semibold text-[#555555] mb-2">Assign Teachers</label>
                {teachers.length === 0 ? (
                  <p className="text-[#8ab8b8] text-xs font-medium">No teachers available.</p>
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
                            <button key={t.id} type="button" onClick={() => toggleNewSubjectTeacher(t.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                newSubject.teacherIds.includes(t.id)
                                  ? 'bg-[#008080]/10 border-[#008080]/30 text-[#008080]'
                                  : 'bg-white border-[#e0f2f2] text-[#8ab8b8] hover:border-[#b2d8d8] hover:text-[#555555]'
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
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddSubjectModal(false)}
                  className="px-5 py-2.5 bg-white border border-[#e0f2f2] text-[#555555] font-semibold rounded-xl hover:bg-[#f5f9f9] text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2.5 bg-[#008080] text-white font-semibold rounded-xl hover:bg-[#006666] text-sm transition-colors shadow-sm">
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
