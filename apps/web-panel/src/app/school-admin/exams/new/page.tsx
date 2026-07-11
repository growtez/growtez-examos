'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, FileText, LayoutTemplate, ChevronDown, Eye, EyeOff, Trash2 } from 'lucide-react';

export default function NewExamPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);

  // Add Teacher Modal State
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [newTeacherDepartment, setNewTeacherDepartment] = useState('');
  const [teacherFormLoading, setTeacherFormLoading] = useState(false);
  const [teacherFormError, setTeacherFormError] = useState('');
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: Exam details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [mcqCorrect, setMcqCorrect] = useState<number | string>(4);
  const [mcqWrong, setMcqWrong] = useState<number | string>(-1);
  const [natCorrect, setNatCorrect] = useState<number | string>(4);
  const [natWrong, setNatWrong] = useState<number | string>(0);

  // Instructions State
  const [instructions, setInstructions] = useState<string[]>([
    'The test contains multiple-choice questions (MCQs) and numerical value questions.',
    'No deduction from the total score will be made if no response is indicated.',
    'The test will automatically end when the time limit is reached.',]);

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

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

      const [teachersRes, templatesRes] = await Promise.all([
        supabase.from('teachers').select('*').eq('school_id', profile.school_id).order('department', { ascending: true }).order('full_name', { ascending: true }),
        supabase.from('exam_templates').select('*, exam_template_subjects(*)').order('created_at', { ascending: false })
      ]);

      setTeachers(teachersRes.data || []);
      setTemplates(templatesRes.data || []);

      // Check for templateId in URL
      const searchParams = new URLSearchParams(window.location.search);
      const templateId = searchParams.get('templateId');
      if (templateId && templatesRes.data) {
        const template = templatesRes.data.find((t: any) => t.id === templateId);
        if (template) handleTemplateSelect(template);
      }
    };
    init();
  }, []);

  const handleTemplateSelect = (template: any) => {
    setTitle(template.title || '');
    setDescription(template.description || '');
    setDurationMinutes(template.duration_minutes || 180);
    if (template.marking_scheme) {
      setMcqCorrect(template.marking_scheme.mcq_correct ?? 4);
      setMcqWrong(template.marking_scheme.mcq_wrong ?? -1);
      setNatCorrect(template.marking_scheme.nat_correct ?? 4);
      setNatWrong(template.marking_scheme.nat_wrong ?? 0);
    }
    if (template.exam_template_subjects && template.exam_template_subjects.length > 0) {
      const sortedSubjects = [...template.exam_template_subjects].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setSubjects(sortedSubjects.map(s => ({
        name: s.subject_name,
        questionCount: s.question_count,
        teacherIds: []
      })));
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherFormError('');
    setTeacherFormLoading(true);

    try {
      if (!schoolId) throw new Error('No school found');

      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newTeacherEmail,
          password: newTeacherPassword,
          full_name: newTeacherName,
          role: 'teacher',
          school_id: schoolId,
          department: newTeacherDepartment || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add teacher');

      // Refresh teachers
      const { data: updatedTeachers } = await supabase.from('teachers').select('*').eq('school_id', schoolId).order('department', { ascending: true }).order('full_name', { ascending: true });
      setTeachers(updatedTeachers || []);

      setShowTeacherModal(false);
      setNewTeacherName(''); setNewTeacherEmail(''); setNewTeacherPassword(''); setNewTeacherDepartment('');
      setShowPassword(false);
    } catch (err: any) {
      setTeacherFormError(err.message);
    } finally {
      setTeacherFormLoading(false);
    }
  };

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
        exam_instructions: instructions.filter(inst => inst.trim() !== ''),
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
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a2e2e]">Create New Exam</h2>
        </div>
        {templates.length > 0 && (
          <div>
            <select
              onChange={(e) => {
                const selected = templates.find(t => t.id === e.target.value);
                if (selected) handleTemplateSelect(selected);
              }}
              defaultValue=""
              className="w-full sm:w-auto px-3 py-2 bg-white border border-[#b2d8d8] rounded-lg text-xs font-bold text-[#008080] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all cursor-pointer hover:bg-[#f5f9f9]"
            >
              <option value="" disabled>Load Template</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Exam Details */}
          <div className="bg-white border border-[#e0f2f2] rounded-xl p-3.5 sm:p-4 shadow-sm order-1 h-full">
              <h3 className="text-sm font-bold text-[#1a2e2e] mb-3 border-b border-[#f0f7f7] pb-1.5">Exam Details</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1">Title *</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                    className="w-full px-3 py-1.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all text-xs font-medium"
                    placeholder="JEE Main Mock Test 1" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                    className="w-full px-3 py-1.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all resize-none text-xs font-medium"
                    placeholder="Mock test covering all topics..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555555] mb-1">Duration (minutes) *</label>
                  <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value))} min={1} required
                    className="w-full px-3 py-1.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all text-xs font-medium" />
                </div>
              </div>
            </div>

          {/* Marking Scheme */}
          <div className="bg-white border border-[#e0f2f2] rounded-xl p-3.5 sm:p-4 shadow-sm order-2 h-full">
              <h3 className="text-sm font-bold text-[#1a2e2e] mb-3 border-b border-[#f0f7f7] pb-1.5">Marking Scheme</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#555555] mb-1">MCQ Correct</label>
                  <input type="number" step="any" value={mcqCorrect} onChange={(e) => setMcqCorrect(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#555555] mb-1">MCQ Wrong (-)</label>
                  <input type="number" step="any" value={mcqWrong} onChange={(e) => setMcqWrong(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#555555] mb-1">NAT Correct</label>
                  <input type="number" step="any" value={natCorrect} onChange={(e) => setNatCorrect(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#555555] mb-1">NAT Wrong (-)</label>
                  <input type="number" step="any" value={natWrong} onChange={(e) => setNatWrong(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all text-xs font-medium" />
                </div>
              </div>
            </div>

          {/* Exam Instructions */}
          <div className="bg-white border border-[#e0f2f2] rounded-xl p-3.5 sm:p-4 shadow-sm order-3 lg:col-span-2">
              <div className="flex items-center justify-between mb-3 border-b border-[#f0f7f7] pb-1.5">
                <h3 className="text-sm font-bold text-[#1a2e2e]">Exam Instructions</h3>
                <button type="button" onClick={addInstruction}
                  className="inline-flex items-center gap-1 text-[#008080] text-[11px] font-bold hover:underline">
                  <Plus size={12} /> Add
                </button>
              </div>
              <div className="space-y-1.5">
                {instructions.map((inst, index) => (
                  <div key={index} className="flex items-center gap-2 w-full">
                    <span className="text-[#8ab8b8] font-bold text-[11px] w-4 text-right flex-shrink-0">{index + 1}.</span>
                    <input type="text" value={inst} onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder="e.g. Do not close browser..."
                      className="flex-1 min-w-0 px-3 py-1.5 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all text-xs font-medium" />
                    {instructions.length > 1 && (
                      <button type="button" onClick={() => removeInstruction(index)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                        title="Remove instruction">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
          </div>

          {/* Subjects & Teachers */}
          <div className="bg-white border border-[#e0f2f2] rounded-xl p-3.5 sm:p-4 shadow-sm order-4 lg:col-span-2">
              <div className="mb-3 border-b border-[#f0f7f7] pb-1.5">
                <h3 className="text-sm font-bold text-[#1a2e2e]">Subjects & Teachers</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {subjects.map((subject, index) => (
                  <div key={index} className="bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg p-4 relative flex flex-col justify-between">
                    <div className="flex gap-3 mb-3">
                      <div className="flex-[2] min-w-0">
                        <label className="block text-[11px] font-semibold text-[#555555] mb-1">Subject Name</label>
                        <input type="text" value={subject.name} onChange={(e) => updateSubject(index, 'name', e.target.value)} required
                          className="w-full px-2.5 py-1.5 bg-white border border-[#e0f2f2] rounded-md text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all text-xs font-medium"
                          placeholder="e.g. Physics" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-[11px] font-semibold text-[#555555] mb-1">Questions</label>
                        <input type="number" value={subject.questionCount} onChange={(e) => updateSubject(index, 'questionCount', parseInt(e.target.value))} min={1}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#e0f2f2] rounded-md text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all text-xs font-medium" />
                      </div>
                      {subjects.length > 1 && (
                        <div className="flex items-end">
                          <button type="button" onClick={() => removeSubject(index)} 
                            className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors flex-shrink-0 mb-[1px]"
                            title="Remove subject">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] font-semibold text-[#555555]">Assign Teachers</label>
                        <button type="button" onClick={() => setShowTeacherModal(true)} className="text-[#008080] text-[10px] font-bold hover:underline flex items-center gap-0.5">
                          <Plus size={10} /> Add Teacher
                        </button>
                      </div>
                      
                      <div className="relative">
                        <button 
                          type="button" 
                          onClick={() => setActiveDropdownIndex(activeDropdownIndex === index ? null : index)}
                          className="w-full flex justify-between items-center px-2.5 py-2 bg-white border border-[#e0f2f2] rounded-md text-[#1a2e2e] text-xs font-medium focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all"
                        >
                          <span className={`truncate pr-2 flex-1 text-left ${subject.teacherIds.length === 0 ? "text-[#8ab8b8]" : "text-[#1a2e2e]"}`}>
                            {subject.teacherIds.length === 0 
                              ? "Select Teachers" 
                              : subject.teacherIds.map(id => teachers.find(t => t.id === id)?.full_name).filter(Boolean).join(', ')}
                          </span>
                          <ChevronDown size={14} className="text-[#8ab8b8] flex-shrink-0" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeDropdownIndex === index && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownIndex(null)}></div>
                            <div className="absolute z-20 w-full mt-1 bg-white border border-[#e0f2f2] rounded-md shadow-lg max-h-48 overflow-y-auto">
                              {teachers.length === 0 ? (
                                <div className="p-3 text-xs text-[#8ab8b8] text-center">No teachers available.</div>
                              ) : (
                                teachers.map(t => (
                                  <label key={t.id} className="flex items-center gap-2 px-3 py-2 hover:bg-[#f5f9f9] cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={subject.teacherIds.includes(t.id)} 
                                      onChange={() => toggleTeacher(index, t.id)}
                                      className="rounded border-[#b2d8d8] text-[#008080] focus:ring-[#008080]/20 w-3.5 h-3.5" 
                                    />
                                    <span className="text-xs text-[#1a2e2e] font-medium flex-1">
                                      {t.full_name} 
                                      <span className="text-[10px] text-[#8ab8b8] ml-1 font-normal">
                                        ({t.department || 'Other'})
                                      </span>
                                    </span>
                                  </label>
                                ))
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add Subject Card */}
                <button 
                  type="button" 
                  onClick={addSubject}
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#b2d8d8] rounded-lg p-6 text-[#008080] hover:bg-[#f0f7f7] hover:border-[#008080] transition-colors min-h-[140px] h-full"
                >
                  <Plus size={24} />
                  <span className="text-sm font-bold">Add Subject</span>
                </button>
              </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-xs font-bold">{error}</div>}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
          <Link href="/exams" className="w-full sm:w-auto text-center px-5 py-2.5 bg-white border border-[#e0f2f2] text-[#555555] font-bold rounded-lg hover:bg-[#f5f9f9] transition-colors text-xs">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#008080] text-white font-bold rounded-lg hover:bg-[#006666] transition-all disabled:opacity-50 shadow-md shadow-[#008080]/20 text-xs">
            {loading ? 'Creating...' : 'Create Exam'}
          </button>
        </div>
      </form>

      {/* Add Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-[#1a2e2e]/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setShowTeacherModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[#e0f2f2] bg-[#f5f9f9]">
              <h3 className="text-lg font-bold text-[#1a2e2e]">Add New Teacher</h3>
              <p className="text-xs text-[#555555] mt-0.5">Quickly add a teacher to assign</p>
            </div>
            <form onSubmit={handleAddTeacher} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1a2e2e] mb-1">Full Name</label>
                <input type="text" value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} required
                  className="w-full px-3 py-2 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all text-xs"
                  placeholder="e.g. Dr. Sharma" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1a2e2e] mb-1">Email</label>
                <input type="email" value={newTeacherEmail} onChange={(e) => setNewTeacherEmail(e.target.value)} required
                  className="w-full px-3 py-2 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all text-xs"
                  placeholder="sharma@school.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1a2e2e] mb-1">Department</label>
                <input type="text" value={newTeacherDepartment} onChange={(e) => setNewTeacherDepartment(e.target.value)} required
                  className="w-full px-3 py-2 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all text-xs"
                  placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1a2e2e] mb-1">Temporary Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={newTeacherPassword} onChange={(e) => setNewTeacherPassword(e.target.value)} required minLength={6}
                    className="w-full pl-3 pr-10 py-2 bg-[#f5f9f9] border border-[#e0f2f2] rounded-lg text-[#1a2e2e] placeholder-[#8ab8b8] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080]/20 transition-all text-xs"
                    placeholder="Min 6 characters" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ab8b8] hover:text-[#008080] focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {teacherFormError && <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-red-600 text-[11px] font-bold">{teacherFormError}</div>}
              <div className="flex gap-2 pt-3">
                <button type="submit" disabled={teacherFormLoading}
                  className="flex-1 py-2 bg-[#008080] text-white text-xs font-bold rounded-lg hover:bg-[#006666] transition-all disabled:opacity-50">
                  {teacherFormLoading ? 'Adding...' : 'Add Teacher'}
                </button>
                <button type="button" onClick={() => setShowTeacherModal(false)}
                  className="px-4 py-2 bg-white border border-[#e0f2f2] text-[#555555] text-xs font-bold rounded-lg hover:bg-[#f5f9f9] transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
