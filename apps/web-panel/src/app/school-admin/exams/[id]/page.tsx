'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Copy, Globe, Link2, MoreVertical, Plus, Settings2, Trash2, Users, AlertCircle, Copy as CopyIcon, Play, Edit2, Check, Download, ShieldCheck, CreditCard } from 'lucide-react';
import { openRazorpayCheckout } from '@/components/RazorpayCheckout';

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
        className={`${className} text-ellipsis overflow-hidden whitespace-nowrap`}
        style={{ paddingRight: '1.75rem' }}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-text-muted bg-transparent">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full bg-surface border border-border mt-1 rounded-xl shadow-xl shadow-[#008080]/10 max-h-[130px] overflow-y-auto custom-scrollbar">
          {filteredOptions.map((opt) => (
            <li
              key={opt}
              className="px-4 py-2.5 hover:bg-bg cursor-pointer text-sm font-medium text-text-main transition-colors"
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
  const [savingExam, setSavingExam] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const step = searchParams.get('step');
      if (step) {
        const parsedStep = parseInt(step);
        if (!isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 5) {
          setCurrentStep(parsedStep);
        }
      }
    }
  }, []);

  const handleSetStep = (step: number) => {
    setCurrentStep(step);
    window.history.replaceState(null, '', `?step=${step}`);
  };

  const [examFee, setExamFee] = useState<number>(300);
  
  // Exam Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [mcqCorrect, setMcqCorrect] = useState<number | string>(4);
  const [mcqWrong, setMcqWrong] = useState<number | string>(-1);
  const [natCorrect, setNatCorrect] = useState<number | string>(4);
  const [natWrong, setNatWrong] = useState<number | string>(0);
  const [role, setRole] = useState<string>('school_admin');
  const [userId, setUserId] = useState<string>('');
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
  const [filterSession, setFilterSession] = useState('');
  const [assignedBatchFilter, setAssignedBatchFilter] = useState('');
  const [assignedCourseFilter, setAssignedCourseFilter] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  
  const [teachers, setTeachers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manage Subject Teachers State
  const [manageTeachersSubject, setManageTeachersSubject] = useState<any | null>(null);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [showAddTeacherMode, setShowAddTeacherMode] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [newTeacherDepartment, setNewTeacherDepartment] = useState('');
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [addTeacherError, setAddTeacherError] = useState('');
  
  const [showInstructionPreview, setShowInstructionPreview] = useState(false);

  // Instructions Editing State & Helpers
  const [instructionsList, setInstructionsList] = useState<string[]>([]);
  const [editInstructionsMode, setEditInstructionsMode] = useState(false);

  const canProceedToNextStep = (step: number) => {
    if (step === 1) {
      return title.trim() !== '' && durationMinutes > 0 && subjects.length > 0;
    }
    if (step === 2) {
      return subjects.length > 0 && subjects.every(s => (questionCounts[s.id] || 0) >= s.question_count);
    }
    if (step === 3) {
      return assignedStudents.length > 0;
    }
    if (step === 4) {
      return startTime !== '' && endTime !== '';
    }
    return true;
  };

  useEffect(() => {
    if (exam) {
      setInstructionsList(exam.exam_instructions || []);
    }
  }, [exam]);

  const autoSaveExamDetails = async (
    currentTitle = title,
    currentDesc = description,
    currentDuration = durationMinutes,
    currentMcqCorrect = mcqCorrect,
    currentMcqWrong = mcqWrong,
    currentNatCorrect = natCorrect,
    currentNatWrong = natWrong,
    currentInstructions = instructionsList
  ) => {
    if (!currentTitle.trim() || currentDuration < 1) {
      return;
    }
    setSaveStatus('saving');
    try {
      const filteredInstructions = currentInstructions.filter(inst => inst.trim() !== '');
      const { error } = await supabase.from('exams').update({
        title: currentTitle,
        description: currentDesc,
        duration_minutes: currentDuration,
        marking_scheme: { 
          mcq_correct: parseFloat(String(currentMcqCorrect)) || 0, 
          mcq_wrong: parseFloat(String(currentMcqWrong)) || 0, 
          nat_correct: parseFloat(String(currentNatCorrect)) || 0, 
          nat_wrong: parseFloat(String(currentNatWrong)) || 0 
        },
        exam_instructions: filteredInstructions,
      }).eq('id', params.id);
      
      if (error) throw error;
      setExam((prev: any) => prev ? { ...prev, title: currentTitle, description: currentDesc, duration_minutes: currentDuration, exam_instructions: filteredInstructions } : null);
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  const handleSaveExamDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList);
  };

  const handleTemplateApply = async (template: any) => {
    if (!template) return;
    setApplyingTemplate(true);
    try {
      const newTitle = template.title || title;
      const newDesc = template.description || description;
      const newDuration = template.duration_minutes || durationMinutes;
      const newMcqCorrect = template.marking_scheme?.mcq_correct ?? mcqCorrect;
      const newMcqWrong = template.marking_scheme?.mcq_wrong ?? mcqWrong;
      const newNatCorrect = template.marking_scheme?.nat_correct ?? natCorrect;
      const newNatWrong = template.marking_scheme?.nat_wrong ?? natWrong;
      const newInstructions = template.exam_instructions?.length ? template.exam_instructions : instructionsList;

      setTitle(newTitle);
      setDescription(newDesc);
      setDurationMinutes(newDuration);
      setMcqCorrect(newMcqCorrect);
      setMcqWrong(newMcqWrong);
      setNatCorrect(newNatCorrect);
      setNatWrong(newNatWrong);
      setInstructionsList(newInstructions);

      const savePromise = autoSaveExamDetails(newTitle, newDesc, newDuration, newMcqCorrect, newMcqWrong, newNatCorrect, newNatWrong, newInstructions);

      let subjectsPromise = Promise.resolve();

      // Apply subjects if template has them (replace existing)
      if (template.exam_template_subjects?.length > 0) {
        subjectsPromise = (async () => {
          // Delete existing subjects first
          await supabase.from('exam_subjects').delete().eq('exam_id', params.id);
          
          // Bulk insert template subjects
          const subjectsToInsert = template.exam_template_subjects.map((s: any, i: number) => ({
            exam_id: params.id,
            subject_name: s.subject_name,
            question_count: s.question_count,
            sort_order: i,
          }));
          await supabase.from('exam_subjects').insert(subjectsToInsert);

          // Refresh subjects state
          const { data: subjectsData } = await supabase
            .from('exam_subjects')
            .select('*, exam_subject_teachers(*, teachers:teacher_id(full_name))')
            .eq('exam_id', params.id)
            .order('sort_order');
          
          setSubjects(subjectsData || []);
          setQuestionCounts({});
        })();
      }

      await Promise.all([savePromise, subjectsPromise]);
    } catch (err: any) {
      console.error('Failed to apply template:', err);
    } finally {
      setApplyingTemplate(false);
    }
  };

  const addInstructionItem = () => {
    const updated = [...instructionsList, ''];
    setInstructionsList(updated);
    autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, updated);
  };

  const removeInstructionItem = (index: number) => {
    const updated = instructionsList.filter((_, i) => i !== index);
    setInstructionsList(updated);
    autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, updated);
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
    confirmColor: 'bg-accent-primary hover:bg-accent-primary/80 border-[#004d4d]',
    onConfirm: () => {}
  });

  const [generatingPDF, setGeneratingPDF] = useState(false);

  const downloadQuestionPaper = async () => {
    try {
      setGeneratingPDF(true);
      
      // Fetch all questions for all subjects
      const { data: questionsData, error } = await supabase
        .from('questions')
        .select('*, exam_subjects(subject_name)')
        .in('exam_subject_id', subjects.map(s => s.id))
        .order('exam_subject_id')
        .order('created_at');
        
      if (error) throw error;
      
      const formattedDate = exam.start_time ? new Date(exam.start_time).toLocaleDateString() : 'N/A';
      const formattedStartTime = exam.start_time ? new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const formattedEndTime = exam.end_time ? new Date(exam.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      // Render HTML string
      let html = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #1a2e2e;">
          <h1 style="text-align: center; color: #008080; margin-bottom: 5px;">${exam.title}</h1>
          <h3 style="text-align: center; color: #555555; margin-top: 0; margin-bottom: 5px;">Question Paper</h3>
          <div style="text-align: center; color: #777777; margin-bottom: 30px; font-size: 14px;">
            <strong>Date:</strong> ${formattedDate} ${formattedStartTime ? ` | <strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}` : ''}
          </div>
      `;
      
      let currentSubject = '';
      let qIndex = 1;
      
      (questionsData || []).forEach((q: any) => {
        if (q.exam_subjects?.subject_name !== currentSubject) {
          currentSubject = q.exam_subjects?.subject_name;
          html += `<h2 style="color: #008080; border-bottom: 2px solid #e0f2f2; padding-bottom: 8px; margin-top: 30px;">${currentSubject}</h2>`;
          qIndex = 1; // Reset question number per subject
        }
        
        html += `
          <div class="question-block" style="margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid;">
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px;">Q${qIndex}. ${q.question_text || 'Image Question'}</div>
        `;
        
        if (q.image_url) {
          html += `<img src="${q.image_url}" style="max-width: 400px; max-height: 300px; display: block; margin-bottom: 15px; border-radius: 8px; border: 1px solid #e0f2f2;" />`;
        }
        
        html += `<div style="padding-left: 15px; display: flex; flex-direction: column; gap: 8px;">`;
        
        if (q.question_type === 'nat') {
          html += `
            <div style="padding: 12px 15px; border-radius: 8px; border: 2px solid #22c55e; background-color: #f0fdf4; font-size: 14px;">
              <strong>Numerical Answer:</strong> ${q.correct_option}
              <span style="color: #22c55e; font-weight: bold; float: right; font-size: 13px;">✓ Correct Answer</span>
            </div>
          `;
        } else if (q.options && typeof q.options === 'object') {
          ['A', 'B', 'C', 'D'].forEach(key => {
            const val = q.options[key];
            const imgVal = q.options[`${key}_image`];
            
            if (!val && !imgVal) return;
            
            const isCorrect = String(q.correct_option).trim().toUpperCase() === key;
            let borderStyle = isCorrect ? '2px solid #22c55e' : '1px solid #e0f2f2';
            let bgStyle = isCorrect ? '#f0fdf4' : 'transparent';
            
            html += `
              <div style="padding: 12px 15px; border-radius: 8px; border: ${borderStyle}; background-color: ${bgStyle}; font-size: 14px; display: flex; flex-direction: column; gap: 8px;">
                <div>
                  <strong>${key})</strong> ${val || ''}
                  ${isCorrect ? '<span style="color: #22c55e; font-weight: bold; float: right; font-size: 13px;">✓ Correct Option</span>' : ''}
                </div>
                ${imgVal ? `<img src="${imgVal}" style="max-width: 200px; max-height: 150px; display: block; margin-top: 8px; border-radius: 4px; border: 1px solid #e0f2f2;" />` : ''}
              </div>
            `;
          });
        }
        html += `</div></div>`;
        qIndex++;
      });
      
      html += `</div>`;
      
      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin: 10,
        filename: `${exam.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_question_paper.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'css', avoid: '.question-block' }
      };
      
      await html2pdf().set(opt).from(html).save();
    } catch (err: any) {
      alert('Failed to generate question paper: ' + err.message);
    } finally {
      setGeneratingPDF(false);
    }
  };

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
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user) {
      setUserId(user.id);
      setRole(user.user_metadata?.role || 'school_admin');
    }

    // Fetch exam
    const { data: examData } = await supabase.from('exams').select('*').eq('id', params.id).single();
    setExam(examData);
    if (!examData) { setLoading(false); return; }
    
    if (examData.start_time) setStartTime(formatForInput(examData.start_time));
    if (examData.end_time) setEndTime(formatForInput(examData.end_time));
    
    setTitle(examData.title || '');
    setDescription(examData.description || '');
    setDurationMinutes(examData.duration_minutes || 180);
    if (examData.marking_scheme) {
      setMcqCorrect(examData.marking_scheme.mcq_correct ?? 4);
      setMcqWrong(examData.marking_scheme.mcq_wrong ?? -1);
      setNatCorrect(examData.marking_scheme.nat_correct ?? 4);
      setNatWrong(examData.marking_scheme.nat_wrong ?? 0);
    }

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

    // Fetch results for this exam
    const { data: examResults } = await supabase
      .from('results')
      .select('student_id, total_marks, answers, time_taken_seconds')
      .eq('exam_id', params.id);

    let assignedWithStudents: any[] = [];
    if (examStudents && examStudents.length > 0) {
      const studentIds = examStudents.map((es: any) => es.student_id);
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, full_name, roll_number, date_of_birth, course, batch, session')
        .in('id', studentIds);
        
      assignedWithStudents = examStudents.map((es: any) => ({
        ...es,
        students: studentsData?.find((s: any) => s.id === es.student_id) || null,
        result: examResults?.find((r: any) => r.student_id === es.student_id) || null
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

    // Fetch the Fixed Payment plan to get the exam conduction fee dynamically
    const { data: feePlan } = await supabase
      .from('plans')
      .select('price')
      .eq('name', 'Fixed Payment')
      .single();
    if (feePlan) {
      setExamFee(Number(feePlan.price));
    }

    // Fetch exam templates
    const { data: allTemplates } = await supabase
      .from('exam_templates')
      .select('*, exam_template_subjects(*)')
      .order('created_at', { ascending: false });
    setTemplates(allTemplates || []);

    setLoading(false);
  };

  const handlePublish = async (bypassPayment = false) => {
    if (!startTime || !endTime) {
      alert('Please set a start time and end time before publishing.');
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      alert('End time must be after start time.');
      return;
    }

    setPublishing(true);
    
    try {
      if (!exam.is_paid && !bypassPayment) {
        alert('You must pay the exam conduction fee before publishing this exam.');
        setPublishing(false);
        return;
      }
      
      const updates: any = {
        status: 'published',
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString()
      };

      if (bypassPayment && !exam.is_paid) {
        updates.is_paid = true;
      }
      
      await supabase.from('exams').update(updates).eq('id', params.id);
      setExam({ ...exam, ...updates });
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred while publishing.');
    } finally {
      setPublishing(false);
    }
  };

  const handlePayment = async () => {
    if (!exam.school_id) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    openRazorpayCheckout({
      amount: examFee,
      examId: exam.id,
      planName: `Exam Publish Fee: ${exam.title}`,
      schoolId: exam.school_id,
      userEmail: user?.email,
      onSuccess: () => {
        alert('Payment successful! You can now publish the exam.');
        fetchExamData();
      },
      onError: (err: any) => {
        alert('Payment failed or cancelled: ' + (err.message || 'Unknown error'));
      }
    });
  };

  const handleTogglePaid = async () => {
    try {
      setPublishing(true);
      const newStatus = !exam.is_paid;
      const { error } = await supabase.from('exams').update({ is_paid: newStatus }).eq('id', exam.id);
      if (error) throw error;
      alert(`Exam payment status set to: ${newStatus ? 'Paid' : 'Unpaid'}`);
      fetchExamData();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setPublishing(false);
    }
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

  const handleSaveSubjectTeachers = async () => {
    if (!manageTeachersSubject) return;
    
    // First remove existing assignments
    await supabase.from('exam_subject_teachers').delete().eq('exam_subject_id', manageTeachersSubject.id);
    
    // Add new ones
    if (selectedTeacherIds.length > 0) {
      const inserts = selectedTeacherIds.map(tId => ({
        exam_subject_id: manageTeachersSubject.id,
        teacher_id: tId
      }));
      await supabase.from('exam_subject_teachers').insert(inserts);
    }
    
    setManageTeachersSubject(null);
    fetchExamData();
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

  const handleDownloadCsvTemplate = () => {
    const csvContent = "name,roll_number,dob,course,batch,session\nAarav Patel,2024001,15/06/2005,NEET,Morning,2024-25\nPriya Singh,2024002,22/03/2005,JEE,Evening,2024-25";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleCreateAndAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddTeacherError('');
    setAddingTeacher(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      const schoolIdToUse = profile?.school_id || exam?.school_id;
      if (!schoolIdToUse) throw new Error('No school found');

      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newTeacherEmail,
          password: newTeacherPassword,
          full_name: newTeacherName,
          role: 'teacher',
          school_id: schoolIdToUse,
          department: newTeacherDepartment || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add teacher');

      // Add to teachers list
      const { data: updatedTeachers } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolIdToUse)
        .order('full_name', { ascending: true });
        
      if (updatedTeachers) {
        setTeachers(updatedTeachers);
        const added = updatedTeachers.find(t => t.email === newTeacherEmail);
        if (added) {
          setSelectedTeacherIds(prev => [...prev, added.id]);
        }
      }

      setShowAddTeacherMode(false);
      setNewTeacherName('');
      setNewTeacherEmail('');
      setNewTeacherPassword('');
      setNewTeacherDepartment('');
    } catch (err: any) {
      setAddTeacherError(err.message);
    } finally {
      setAddingTeacher(false);
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
        <div className="w-24 h-4 bg-bg rounded-md mb-4"></div>
        <div className="flex justify-between items-center">
          <div>
            <div className="w-64 h-8 bg-surface-hover rounded-lg mb-2"></div>
            <div className="w-96 h-4 bg-bg rounded-md"></div>
          </div>
          <div className="w-32 h-10 bg-surface-hover rounded-xl"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="w-20 h-4 bg-bg rounded-md mb-3"></div>
            <div className="w-24 h-7 bg-surface-hover rounded-lg"></div>
          </div>
        ))}
      </div>
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6 shadow-sm">
        <div className="w-24 h-6 bg-surface-hover rounded-md mb-4"></div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-bg border border-border rounded-xl p-4 h-20"></div>
          ))}
        </div>
      </div>
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex justify-between mb-4">
          <div className="w-32 h-6 bg-surface-hover rounded-md"></div>
          <div className="w-48 h-10 bg-bg rounded-xl"></div>
        </div>
        <div className="w-full h-32 bg-bg rounded-xl mt-4"></div>
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
    const matchesSession = filterSession ? s.session === filterSession : true;
    return matchesSearch && matchesCourse && matchesBatch && matchesSession;
  });

  const uniqueAssignedBatches = Array.from(new Set(assignedStudents.map((s: any) => s.students?.batch).filter(Boolean)));
  const uniqueAssignedCourses = Array.from(new Set(assignedStudents.map((s: any) => s.students?.course).filter(Boolean)));

  const filteredAssignedStudents = assignedStudents.filter((as: any) => {
    const matchesSearch = as.students?.full_name?.toLowerCase().includes(assignedSearchQuery.toLowerCase()) || 
                          as.students?.roll_number?.toLowerCase().includes(assignedSearchQuery.toLowerCase());
    const matchesBatch = assignedBatchFilter ? as.students?.batch === assignedBatchFilter : true;
    const matchesCourse = assignedCourseFilter ? as.students?.course === assignedCourseFilter : true;
    return matchesSearch && matchesBatch && matchesCourse;
  });

  const downloadResultsPDF = async () => {
    if (filteredAssignedStudents.length === 0) {
      alert("No results to download for the current filters.");
      return;
    }

    try {
      setGeneratingPDF(true);
      
      // Calculate actual total marks by fetching questions
      const { data: qs } = await supabase.from('questions').select('positive_marks').eq('exam_id', params.id);
      let calculatedTotal = 0;
      if (qs && qs.length > 0) {
        calculatedTotal = qs.reduce((sum, q) => sum + (q.positive_marks || 0), 0);
      }
      
      const formattedDate = exam.start_time ? new Date(exam.start_time).toLocaleDateString() : 'N/A';
      const totalExamMarks = calculatedTotal > 0 ? calculatedTotal : (exam.total_marks || 'N/A');
      const batchText = assignedBatchFilter ? `Batch: ${assignedBatchFilter}` : 'All Batches';
      const courseText = assignedCourseFilter ? `Course: ${assignedCourseFilter}` : 'All Courses';
      const filterText = `${courseText} | ${batchText}`;

      let html = `
        <div style="font-family: Arial, sans-serif; padding: 30px; color: #1a2e2e;">
          <h1 style="text-align: center; color: #008080; margin-bottom: 5px;">${exam.title}</h1>
          <h3 style="text-align: center; color: #555555; margin-top: 0; margin-bottom: 5px;">Exam Results</h3>
          <div style="text-align: center; color: #777777; margin-bottom: 30px; font-size: 14px;">
            <strong>Date:</strong> ${formattedDate} | <strong>Total Marks:</strong> ${totalExamMarks} | <strong>${filterText}</strong>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; text-align: left;">
            <thead>
              <tr style="background-color: #f5f9f9;">
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Roll No</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Name</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Course</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Batch</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Session</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Status</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Score</th>
              </tr>
            </thead>
            <tbody>
      `;

      for (const row of filteredAssignedStudents) {
        let statusText = 'Assigned';
        if (isExamOver) {
          statusText = row.status === 'assigned' ? 'Absent' : 'Completed';
        } else {
          if (row.status === 'submitted') statusText = 'Submitted';
          else if (row.status === 'in_progress') statusText = 'In Progress';
        }
        let score = row.result ? row.result.total_marks : (isExamOver ? (row.status === 'assigned' ? 'Absent' : 'N/A') : 'N/A');
        const scoreColor = score === 'Absent' || score === 'N/A' ? '#999' : '#008080';

        html += `
          <tr>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.roll_number || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.full_name || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.course || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.batch || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.session || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${statusText}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2; font-weight: bold; color: ${scoreColor};">${score}</td>
          </tr>
        `;
      }

      html += `
            </tbody>
          </table>
        </div>
      `;

      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin: 10,
        filename: `${exam.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results${assignedBatchFilter ? `_${assignedBatchFilter.replace(/[^a-z0-9]/gi, '_').toLowerCase()}` : ''}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(html).save();
    } catch (err: any) {
      alert('Failed to generate results PDF: ' + err.message);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const isExamOver = exam?.end_time ? new Date(exam.end_time) < new Date() : false;
  const displayStatus = isExamOver ? 'completed' : exam?.status || 'draft';

  return (
    <div className="max-w-[1400px] animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto px-4 lg:px-8">
      
      {/* Title & Actions */}
      <div className="mb-6 flex flex-col xl:flex-row xl:justify-between xl:items-start gap-4">
        <div className="flex-1 w-full xl:w-auto pr-0 xl:pr-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <input 
              type="text"
              value={title}
              onChange={(e) => {
                const newTitle = e.target.value;
                setTitle(newTitle);
                setExam((prev: any) => prev ? {...prev, title: newTitle} : null);
                window.dispatchEvent(new CustomEvent('breadcrumb-update', { detail: { id: params.id, title: newTitle } }));
              }}
              onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
              disabled={role === 'teacher' || exam?.status !== 'draft'}
              className={`text-2xl font-bold text-text-main bg-transparent border-none outline-none rounded-lg px-2 -ml-2 transition-colors ${role !== 'teacher' && exam?.status === 'draft' ? 'hover:bg-surface-hover focus:ring-2 focus:ring-accent-primary/20 cursor-text' : 'cursor-default'}`}
              placeholder="Exam Title"
              style={{ width: `${Math.max(title.length || 0, 10)}ch` }}
            />
            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[displayStatus] || statusColors.draft}`}>
              {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
            </span>
          </div>

        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 xl:shrink-0 mt-2 xl:mt-0">
            {isExamOver && (
              <button 
                onClick={downloadQuestionPaper}
                disabled={generatingPDF}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-accent-primary to-accent-primary/70 border border-[#004d4d] rounded-lg text-xs font-semibold text-white hover:from-[#006666] hover:to-[#004d4d] transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <Download size={14} />
                {generatingPDF ? 'Generating...' : 'Download Paper'}
              </button>
            )}
            {role !== 'teacher' && (
              <>
                {!isExamOver && exam?.status !== 'draft' && (
                  <button 
                    onClick={handleUnpublish}
                    disabled={publishing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-text-main hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm disabled:opacity-50"
                  >
                    <Settings2 size={14} />
                    Unpublish
                  </button>
                )}
                {templates.length > 0 && exam?.status === 'draft' && (
                  <div className="flex items-center gap-1.5">
                    <select
                      onChange={(e) => {
                        const selected = templates.find(t => t.id === e.target.value);
                        if (selected) handleTemplateApply(selected);
                        e.target.value = '';
                      }}
                      defaultValue=""
                      disabled={applyingTemplate}
                      className="px-2 py-1.5 bg-bg border border-border rounded-lg text-text-main text-xs font-semibold focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all disabled:opacity-50"
                    >
                      <option value="" disabled>Template...</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                    {applyingTemplate && (
                      <span className="text-[10px] text-accent-primary flex items-center gap-1 font-semibold animate-pulse">
                        <span className="w-2 h-2 rounded-full border-2 border-[#008080] border-t-transparent animate-spin" />
                      </span>
                    )}
                  </div>
                )}
                <div className="relative" ref={moreMenuRef}>
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-text-main hover:border-accent-primary hover:text-accent-primary hover:bg-bg transition-all shadow-sm"
                  >
                    <MoreVertical size={14} />
                  </button>
                  {showMoreMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                      <button
                        onClick={() => {
                          handleDuplicate();
                          setShowMoreMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-text-main hover:bg-surface-hover hover:text-accent-primary flex items-center gap-2"
                      >
                        <Copy size={12} />
                        Duplicate
                      </button>
                      <button
                        onClick={() => {
                          handleTrash();
                          setShowMoreMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                      >
                        <Trash2 size={12} />
                        Trash
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
        </div>
      </div>

      {/* Stepper Header */}
      {role !== 'teacher' && exam?.status === 'draft' && (
        <div className="mb-8 flex items-center justify-between relative max-w-3xl mx-auto">
          <div className="absolute left-0 top-5 -translate-y-1/2 w-full h-1 bg-border z-0 rounded-full"></div>
          <div className="absolute left-0 top-5 -translate-y-1/2 h-1 bg-accent-primary z-0 rounded-full transition-all duration-300" style={{ width: `${((currentStep - 1) / 4) * 100}%` }}></div>
          
          {[
            { step: 1, label: 'Setup' },
            { step: 2, label: 'Questions' },
            { step: 3, label: 'Candidates' },
            { step: 4, label: 'Schedule' },
            { step: 5, label: 'Publish' }
          ].map((s) => (
            <div key={s.step} className="relative z-10 flex flex-col items-center gap-2">
              <button 
                onClick={() => {
                  // Only allow navigating to completed steps or next step
                  if (s.step < currentStep || (s.step === currentStep + 1 && canProceedToNextStep(currentStep))) {
                    handleSetStep(s.step);
                  }
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2
                  ${currentStep === s.step ? 'bg-accent-primary text-white border-[#008080] shadow-md shadow-accent-primary/30 scale-110' : 
                    currentStep > s.step ? 'bg-accent-primary text-white border-[#008080]' : 
                    'bg-surface text-text-muted border-border'}`}
              >
                {currentStep > s.step ? <Check size={18} /> : s.step}
              </button>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${currentStep === s.step ? 'text-text-main' : currentStep > s.step ? 'text-accent-primary' : 'text-text-muted'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={`grid grid-cols-1 ${role !== 'teacher' && exam?.status === 'draft' ? 'max-w-4xl mx-auto' : 'xl:grid-cols-3 gap-6 lg:gap-8'} mb-10`}>
        
        {/* Left Column (Main Content) */}
        <div className={`${role !== 'teacher' && exam?.status === 'draft' ? 'col-span-1' : 'xl:col-span-2'} space-y-6`}>
          

      {/* Teacher Banner */}
      {role === 'teacher' && (
        <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-2xl p-5 mb-6 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="text-text-main font-bold text-base">Question Preparation Mode</h3>
            <p className="text-text-muted text-sm font-medium mt-1">
              Select your assigned subject below to start adding or editing questions. You only have access to manage questions for subjects specifically assigned to you.
            </p>
          </div>
        </div>
      )}

      {/* Subjects */}
      {(!exam || exam.status !== 'draft' || role === 'teacher' || currentStep === 2) && (
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6 shadow-sm">
        <div className="mb-4 border-b border-[#f0f7f7] pb-1.5">
          <h3 className="text-lg font-bold text-text-main">Subjects</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => {
            const added = questionCounts[s.id] || 0;
            const needed = s.question_count;
            const complete = added >= needed;
            const isAssignedTeacher = role !== 'teacher' || (role === 'teacher' && s.exam_subject_teachers?.some((est: any) => est.teacher_id === userId));
            return (
              <Link 
                key={s.id} 
                href={`/exams/${params.id}/questions?subject=${s.id}`} 
                className={`flex flex-col justify-between rounded-xl p-4 gap-4 transition-all ${
                  role === 'teacher' 
                    ? (isAssignedTeacher ? 'bg-surface border-2 border-[#008080] shadow-md hover:shadow-lg group cursor-pointer' : 'bg-gray-50 border border-gray-200 opacity-60 pointer-events-none') 
                    : 'bg-bg border border-border hover:bg-surface-hover/50 group cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-text-main font-bold">{s.subject_name}</span>
                      {role === 'teacher' && isAssignedTeacher && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-accent-primary/10 text-accent-primary px-2 py-0.5 rounded-md">
                          Your Assignment
                        </span>
                      )}
                    </div>
                    {!isExamOver && exam?.status === 'draft' && role !== 'teacher' && (
                      <button 
                        onClick={(e) => handleDeleteSubject(e, s.id, s.subject_name)} 
                        className="text-red-400 hover:text-red-600 transition-colors p-1.5 border border-transparent hover:border-red-200 rounded-lg hover:bg-red-50 bg-surface shadow-sm pointer-events-auto"
                        title="Delete Subject"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {added}/{needed} questions
                    </span>
                    {!isExamOver && exam?.status === 'draft' && editSubjectId !== s.id && role !== 'teacher' && (
                      <button onClick={(e) => { e.preventDefault(); setInlineEditSubjectCount(needed); setEditSubjectId(s.id); }} className="text-text-muted hover:text-accent-primary transition-colors p-1 rounded-md hover:bg-surface-hover pointer-events-auto">
                        <Edit2 size={14} />
                      </button>
                    )}
                    {editSubjectId === s.id && (
                      <div className="flex items-center gap-1 pointer-events-auto" onClick={e => e.preventDefault()}>
                        <input type="number" value={inlineEditSubjectCount} onChange={(e) => setInlineEditSubjectCount(Math.max(0, parseInt(e.target.value) || 0))} className="w-16 px-2 py-1 text-xs border border-[#008080] rounded outline-none font-bold text-text-main" min="0" />
                        <button onClick={() => handleSaveSubjectCount(s.id)} className="text-white bg-accent-primary hover:bg-accent-primary/80 p-1 rounded transition-colors"><Check size={14}/></button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {s.exam_subject_teachers?.map((est: any) => (
                      <span key={est.id} className="text-[10px] font-bold uppercase tracking-wider text-accent-primary bg-surface border border-border px-2 py-0.5 rounded-md">
                        {est.teachers?.full_name || 'Unknown'}
                      </span>
                    ))}
                    {!isExamOver && exam?.status === 'draft' && role !== 'teacher' && (
                      <button onClick={(e) => {
                        e.preventDefault();
                        setManageTeachersSubject(s);
                        setSelectedTeacherIds(s.exam_subject_teachers?.map((est: any) => est.teacher_id) || []);
                      }} className="text-text-muted hover:text-accent-primary bg-surface border border-dashed border-border p-0.5 px-1.5 rounded-md hover:bg-surface-hover transition-colors pointer-events-auto text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Plus size={10} /> Assign Teacher
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  {isAssignedTeacher && displayStatus !== 'completed' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border text-accent-primary text-[11px] font-bold rounded-lg group-hover:bg-surface-hover transition-colors shadow-sm whitespace-nowrap w-full justify-center">
                      <Plus size={14} />
                      Manage Questions
                    </span>
                  )}
                  {isAssignedTeacher && displayStatus === 'completed' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border text-text-muted text-[11px] font-bold rounded-lg group-hover:bg-bg transition-colors shadow-sm whitespace-nowrap w-full justify-center">
                      View Questions
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
          
          {/* Add Subject Card */}
          {!isExamOver && exam?.status === 'draft' && role !== 'teacher' && (
            <button 
              type="button" 
              onClick={() => setShowAddSubjectModal(true)}
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 text-accent-primary hover:bg-[#f0f7f7] hover:border-accent-primary transition-colors min-h-[140px] h-full"
            >
              <Plus size={24} />
              <span className="text-sm font-bold">Add Subject</span>
            </button>
          )}
        </div>
      </div>
      )}

{/* Assigned Students */}
      {(!exam || exam.status !== 'draft' || role === 'teacher' || currentStep === 3) && (
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-text-main">Students ({assignedStudents.length})</h3>
            <p className="text-text-muted text-sm font-medium mt-1">Students are specific to this exam</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isExamOver && role !== 'teacher' && (
              <>
                <button onClick={() => { setShowAddStudentModal(true); setAddMode('link'); setAddError(''); setAddSuccess(''); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-primary text-white text-sm font-semibold rounded-xl hover:bg-accent-primary/80 hover:shadow-lg hover:shadow-accent-primary/30 transition-all active:scale-95">
                  <Link2 size={16} />
                  Share Link
                </button>
                <button onClick={() => { setShowAddStudentModal(true); setAddMode('search'); setAddError(''); setAddSuccess(''); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface text-text-main text-sm font-semibold border border-border rounded-xl hover:border-accent-primary hover:text-accent-primary hover:bg-bg transition-all shadow-sm">
                  <Plus size={16} />
                  Add Student
                </button>
                <button onClick={() => { setShowAddStudentModal(true); setAddMode('csv'); setAddError(''); setAddSuccess(''); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface text-text-main text-sm font-semibold border border-border rounded-xl hover:border-accent-primary hover:text-accent-primary hover:bg-bg transition-all shadow-sm">
                  <Plus size={16} />
                  Import CSV
                </button>
              </>
            )}
          </div>
        </div>

        {addSuccess && <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-4 rounded-xl text-sm font-medium mb-6">{addSuccess}</div>}

        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Search assigned students..." value={assignedSearchQuery} onChange={(e) => setAssignedSearchQuery(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 bg-bg border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-sm font-medium" />
            
          <select 
            value={assignedCourseFilter} 
            onChange={(e) => setAssignedCourseFilter(e.target.value)}
            className="px-4 py-2 bg-bg border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-sm font-medium w-full sm:w-40 appearance-none"
          >
            <option value="">All Courses</option>
            {uniqueAssignedCourses.map((course: any) => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>

          <select 
            value={assignedBatchFilter} 
            onChange={(e) => setAssignedBatchFilter(e.target.value)}
            className="px-4 py-2 bg-bg border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-sm font-medium w-full sm:w-40 appearance-none"
          >
            <option value="">All Batches</option>
            {uniqueAssignedBatches.map((batch: any) => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>

          {isExamOver && (
            <button 
              onClick={downloadResultsPDF}
              disabled={generatingPDF}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-surface text-text-main text-sm font-semibold border border-border rounded-xl hover:border-accent-primary hover:text-accent-primary hover:bg-bg transition-all shadow-sm w-full sm:w-auto disabled:opacity-50 whitespace-nowrap"
            >
              {generatingPDF ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Download size={16} />}
              {generatingPDF ? 'Generating...' : 'Download PDF'}
            </button>
          )}
        </div>

        {assignedStudents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-bg/50">
            <Users size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-main text-base font-bold">No students added yet.</p>
            <p className="text-text-muted text-sm font-medium mt-1">Students are specific to this exam. Add them using the buttons above.</p>
          </div>
        ) : filteredAssignedStudents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-bg/50">
            <p className="text-text-muted text-sm font-medium mt-1">No students found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-bg border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Roll No.</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                    {isExamOver && <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Score</th>}
                    {!isExamOver && <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignedStudents.map((as: any) => (
                  <tr key={as.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-accent-primary bg-bg border border-border px-2 py-1 rounded-md text-xs font-bold">{as.students?.roll_number}</span>
                    </td>
                    <td className="px-4 py-3 text-text-main text-sm font-semibold">{as.students?.full_name}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        let colorClass = '';
                        let text = '';
                        if (isExamOver) {
                          if (as.status === 'assigned') {
                            colorClass = 'bg-red-50 text-red-600 border-red-200';
                            text = 'Absent';
                          } else {
                            colorClass = 'bg-accent-primary/10 text-accent-primary border-accent-primary/20';
                            text = '✓ Completed';
                          }
                        } else {
                          if (as.status === 'submitted') {
                            colorClass = 'bg-accent-primary/10 text-accent-primary border-accent-primary/20';
                            text = '✓ Submitted';
                          } else if (as.status === 'in_progress') {
                            colorClass = 'bg-amber-100 text-amber-700 border-amber-200';
                            text = '▶ In Progress';
                          } else {
                            colorClass = 'bg-gray-100 text-gray-600 border-gray-200';
                            text = 'Assigned';
                          }
                        }
                        return (
                          <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border ${colorClass}`}>
                            {text}
                          </span>
                        );
                      })()}
                    </td>
                    {isExamOver && (
                      <td className="px-4 py-3 text-text-main text-sm font-bold">
                        {as.result ? (
                          <span className="text-accent-primary">{as.result.total_marks}</span>
                        ) : (
                          <span className="text-gray-400 font-medium">{as.status === 'assigned' ? 'Absent' : 'N/A'}</span>
                        )}
                      </td>
                    )}
                    {!isExamOver && (
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                        {(as.status === 'in_progress' || as.status === 'submitted') && role !== 'teacher' && (
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
                        {as.status === 'assigned' && role !== 'teacher' && (
                          <button
                            onClick={() => handleRemoveStudent(as.id, as.student_id)}
                            className="text-red-500 hover:text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Super Admin Payment Override */}
      {role === 'super_admin' && (
        <div className="bg-bg border border-border rounded-2xl p-6 shadow-sm mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-main mb-1">Super Admin Override</h3>
            <p className="text-text-muted text-sm font-medium">Toggle the payment status of this exam without processing a transaction.</p>
          </div>
          <button 
            onClick={handleTogglePaid}
            disabled={publishing}
            className={`inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-colors shadow-sm
              ${exam.is_paid 
                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20'}
              ${publishing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {publishing ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <ShieldCheck size={16} />}
            {exam.is_paid ? 'Mark as Unpaid' : 'Mark as Paid'}
          </button>
        </div>
      )}

      

      {/* Editable Exam Details Form */}
      {role !== 'teacher' && !isExamOver && exam?.status === 'draft' && currentStep === 1 ? (
        <form onSubmit={handleSaveExamDetails} className="space-y-4 mb-6">


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Exam Details */}
            <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-sm order-1 h-full">
                <h3 className="text-sm font-bold text-text-main mb-3 border-b border-[#f0f7f7] pb-1.5">Exam Details</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Title *</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)} required
                      className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)} rows={2}
                      className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all resize-none text-xs font-medium" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Duration (minutes) *</label>
                    <input type="number" value={durationMinutes} onChange={(e) => {
                      const newDuration = parseInt(e.target.value) || 0;
                      setDurationMinutes(newDuration);
                      if (startTime && newDuration > 0) {
                        const end = new Date(new Date(startTime).getTime() + newDuration * 60000);
                        const endString = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                        setEndTime(endString);
                      }
                    }} onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)} min={1} required
                      className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium" />
                  </div>
                </div>
            </div>

            {/* Marking Scheme */}
            <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-sm order-2 h-full">
                <h3 className="text-sm font-bold text-text-main mb-3 border-b border-[#f0f7f7] pb-1.5">Marking Scheme</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">MCQ Correct</label>
                    <input type="number" step="any" value={mcqCorrect} onChange={(e) => setMcqCorrect(e.target.value)} onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                      className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">MCQ Wrong (-)</label>
                    <input type="number" step="any" value={mcqWrong} onChange={(e) => setMcqWrong(e.target.value)} onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                      className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">NAT Correct</label>
                    <input type="number" step="any" value={natCorrect} onChange={(e) => setNatCorrect(e.target.value)} onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                      className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-text-muted mb-1">NAT Wrong (-)</label>
                    <input type="number" step="any" value={natWrong} onChange={(e) => setNatWrong(e.target.value)} onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                      className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium" />
                  </div>
                </div>
            </div>

            {/* Subjects (Step 1 Position) */}
            <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-sm lg:col-span-2 order-3 h-full mb-4">
              <div className="mb-4 border-b border-[#f0f7f7] pb-1.5 flex justify-between items-center">
                <h3 className="text-sm font-bold text-text-main">Subjects</h3>
                <button 
                  type="button" 
                  onClick={(e) => { e.preventDefault(); setShowAddSubjectModal(true); }}
                  className="text-[11px] font-bold text-accent-primary hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add Subject
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((s) => {
                  const added = questionCounts[s.id] || 0;
                  const needed = s.question_count;
                  const complete = added >= needed;
                  return (
                    <div key={s.id} className="bg-bg border border-border rounded-xl p-3 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-text-main font-bold text-xs">{s.subject_name}</span>
                        <button 
                          type="button"
                          onClick={(e) => handleDeleteSubject(e, s.id, s.subject_name)} 
                          className="text-red-400 hover:text-red-600 transition-colors p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {added}/{needed} q&apos;s
                        </span>
                        {editSubjectId !== s.id && (
                          <button type="button" onClick={(e) => { e.preventDefault(); setInlineEditSubjectCount(needed); setEditSubjectId(s.id); }} className="text-text-muted hover:text-accent-primary transition-colors p-1">
                            <Edit2 size={12} />
                          </button>
                        )}
                        {editSubjectId === s.id && (
                          <div className="flex items-center gap-1">
                            <input type="number" value={inlineEditSubjectCount} onChange={(e) => setInlineEditSubjectCount(Math.max(0, parseInt(e.target.value) || 0))} className="w-12 px-1 py-0.5 text-[10px] border border-[#008080] rounded outline-none font-bold" min="0" />
                            <button type="button" onClick={() => handleSaveSubjectCount(s.id)} className="text-white bg-accent-primary p-0.5 rounded"><Check size={12}/></button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.exam_subject_teachers?.map((est: any) => (
                          <span key={est.id} className="text-[9px] font-bold uppercase tracking-wider text-accent-primary bg-surface border border-border px-1.5 py-0.5 rounded">
                            {est.teachers?.full_name || 'Teacher'}
                          </span>
                        ))}
                        <button type="button" onClick={(e) => { 
                          e.preventDefault(); 
                          setManageTeachersSubject(s); 
                          setSelectedTeacherIds(s.exam_subject_teachers?.map((est: any) => est.teacher_id) || []); 
                        }} className="text-text-muted hover:text-accent-primary text-[9px] font-bold uppercase tracking-wider border border-dashed border-border px-1.5 py-0.5 rounded flex items-center">
                          <Plus size={8} className="mr-0.5"/> Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exam Instructions */}
            <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-sm order-3 lg:col-span-2">
                <div className="flex items-center justify-between mb-3 border-b border-[#f0f7f7] pb-1.5">
                  <h3 className="text-sm font-bold text-text-main">Exam Instructions</h3>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => setShowInstructionPreview(true)}
                      className="inline-flex items-center gap-1.5 text-accent-primary text-xs font-bold hover:underline bg-[#f0f7f7] px-2 py-1 rounded-md transition-colors">
                      <BookOpen size={14} /> Preview
                    </button>
                    <button type="button" onClick={addInstructionItem}
                      className="inline-flex items-center gap-1 text-accent-primary text-[11px] font-bold hover:underline">
                      <Plus size={12} /> Add
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {instructionsList.map((inst, index) => (
                    <div key={index} className="flex items-center gap-2 w-full">
                      <span className="text-text-muted font-bold text-[11px] w-4 text-right flex-shrink-0">{index + 1}.</span>
                      <input type="text" value={inst} onChange={(e) => updateInstructionItem(index, e.target.value)} onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                        placeholder="e.g. Do not close browser..."
                        className="flex-1 min-w-0 px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium" />
                      {instructionsList.length > 1 && (
                        <button type="button" onClick={() => removeInstructionItem(index)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors flex-shrink-0">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <div className="text-xs font-semibold">
              {saveStatus === 'saving' && (
                <span className="text-accent-primary flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" /> Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" /> Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Error saving
                </span>
              )}
            </div>
            <button type="submit" disabled={saveStatus === 'saving'}
              className="px-6 py-2.5 bg-accent-primary text-white font-bold rounded-lg hover:bg-accent-primary/80 transition-all disabled:opacity-50 shadow-md shadow-accent-primary/20 text-xs">
              Save Details
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-bg border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center text-accent-primary">
              <Clock size={24} />
            </div>
            <div className="flex-1">
              <p className="text-text-muted text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                Duration
              </p>
              <p className="text-xl font-bold text-text-main mt-0.5">{exam?.duration_minutes || 0} min</p>
            </div>
          </div>
          <div className="bg-bg border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Questions</p>
              <p className="text-xl font-bold text-text-main mt-0.5">{totalQuestionsAdded} / {totalQuestionsNeeded}</p>
            </div>
          </div>
        </div>
      )}

        </div>

        {/* Right Column (Sidebar) */}
        {(!exam || exam.status !== 'draft' || role === 'teacher' || currentStep === 4 || currentStep === 5) && (
        <div className="xl:col-span-1">
          <div className="sticky top-6 flex flex-col gap-5">


            {/* Publish Button */}
      {exam.status === 'draft' && role !== 'teacher' && (
        <div className="bg-bg border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-text-main mb-2">{currentStep === 4 ? 'Schedule Exam' : 'Publish Exam'}</h3>
          <p className="text-text-muted text-sm font-medium mb-6">
            {currentStep === 4 
              ? 'Set the start and end times for the exam.' 
              : allQuestionsReady
                ? 'All questions are ready. You can now publish the exam.'
                : 'Some subjects still need more questions. Add all required questions before publishing.'}
          </p>
          {(currentStep === 4 || role === 'teacher' || exam.status !== 'draft') && (
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">Start Time (Auto-publish) *</label>
              <input type="datetime-local" value={startTime} onChange={(e) => {
                const newStart = e.target.value;
                setStartTime(newStart);
                if (newStart && durationMinutes > 0) {
                  const end = new Date(new Date(newStart).getTime() + durationMinutes * 60000);
                  const endString = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                  setEndTime(endString);
                }
              }} disabled={!allQuestionsReady || publishing}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all disabled:opacity-50 text-sm font-medium" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-main mb-1.5">End Time (Auto-end) *</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!allQuestionsReady || publishing}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all disabled:opacity-50 text-sm font-medium" />
            </div>
          </div>
          )}

          {(currentStep === 5 || role === 'teacher' || exam.status !== 'draft') && (
          <div className="flex items-center gap-4">
            {exam.is_paid ? (
              <button onClick={() => handlePublish(false)} disabled={!allQuestionsReady || publishing || !startTime || !endTime}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary hover:bg-accent-primary/80 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm">
                <Play size={16} />
                {publishing ? 'Publishing...' : 'Publish Exam'}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={handlePayment} disabled={!allQuestionsReady || publishing || !startTime || !endTime}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm">
                  <CreditCard size={16} />
                  Pay ₹{examFee} to Publish
                </button>
                <button onClick={() => handlePublish(true)} disabled={!allQuestionsReady || publishing || !startTime || !endTime}
                  className="inline-flex items-center gap-1.5 px-4 py-3 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                  title="Dev Tool: Skip payment entirely">
                  <Play size={14} /> Dev Publish
                </button>
              </div>
            )}
            
            {!exam.is_paid && (
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                Payment Required
              </span>
            )}
          </div>
          )}
        </div>
      )}

      
          </div>
        </div>
        )}
      </div>

      {/* Stepper Navigation */}
      {role !== 'teacher' && exam?.status === 'draft' && (
        <div className="flex items-center justify-between mt-8 border-t border-border pt-6 pb-12">
          <button 
            onClick={() => handleSetStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'bg-surface border border-border text-text-muted hover:bg-bg shadow-sm'}`}
          >
            Back
          </button>
          
          {currentStep < 5 && (
            <button 
              onClick={() => handleSetStep(Math.min(5, currentStep + 1))}
              disabled={!canProceedToNextStep(currentStep)}
              className="px-6 py-2.5 bg-accent-primary text-white rounded-xl font-semibold hover:bg-accent-primary/80 transition-all disabled:opacity-50 shadow-md shadow-accent-primary/20"
            >
              Next Step
            </button>
          )}
        </div>
      )}

      {/* Manage Teachers Modal */}
      {manageTeachersSubject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setManageTeachersSubject(null)}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-accent-primary px-6 py-4 flex items-center justify-between">
              <span className="text-white font-bold">Manage Teachers for {manageTeachersSubject.subject_name}</span>
              <button onClick={() => { setManageTeachersSubject(null); setShowAddTeacherMode(false); setAddTeacherError(''); }} className="text-white/70 hover:text-white transition-colors">✕</button>
            </div>
            
            {showAddTeacherMode ? (
              <form onSubmit={handleCreateAndAssignTeacher} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-text-main font-bold text-sm">Create New Teacher</h4>
                  <button type="button" onClick={() => { setShowAddTeacherMode(false); setAddTeacherError(''); }} className="text-accent-primary text-xs font-bold hover:underline">Back to List</button>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Full Name</label>
                    <input type="text" value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} required className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent-primary" placeholder="e.g. Dr. Sharma" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Email</label>
                    <input type="email" value={newTeacherEmail} onChange={e => setNewTeacherEmail(e.target.value)} required className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent-primary" placeholder="sharma@school.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Department</label>
                    <input type="text" value={newTeacherDepartment} onChange={e => setNewTeacherDepartment(e.target.value)} required className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent-primary" placeholder="e.g. Mathematics" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">Password</label>
                    <input type="password" value={newTeacherPassword} onChange={e => setNewTeacherPassword(e.target.value)} required minLength={6} className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent-primary" placeholder="Min 6 characters" />
                  </div>
                </div>

                {addTeacherError && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-medium mb-4">{addTeacherError}</div>}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowAddTeacherMode(false); setAddTeacherError(''); }} className="px-4 py-2 bg-surface border border-border text-text-muted rounded-xl hover:bg-bg text-sm font-semibold transition-colors">Cancel</button>
                  <button type="submit" disabled={addingTeacher} className="px-4 py-2 bg-accent-primary text-white rounded-xl hover:bg-accent-primary/80 text-sm font-semibold transition-colors shadow-sm disabled:opacity-50">
                    {addingTeacher ? 'Creating...' : 'Create & Select'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-text-muted">Select existing teachers:</span>
                  <button type="button" onClick={() => { setShowAddTeacherMode(true); setAddTeacherError(''); }} className="text-accent-primary text-xs font-bold hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add New Teacher
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto mb-4 border border-border rounded-lg custom-scrollbar">
                  {teachers.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-text-muted text-sm font-medium">No teachers available.</p>
                      <p className="text-text-muted text-xs mt-1">Please add a new teacher above.</p>
                    </div>
                  ) : (
                    teachers.map(t => (
                      <label key={t.id} className="flex items-center gap-3 p-3 hover:bg-bg cursor-pointer border-b border-border last:border-0 transition-colors">
                        <input type="checkbox" checked={selectedTeacherIds.includes(t.id)} 
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTeacherIds([...selectedTeacherIds, t.id]);
                            else setSelectedTeacherIds(selectedTeacherIds.filter(id => id !== t.id));
                          }} 
                          className="w-4 h-4 text-accent-primary rounded border-border focus:ring-accent-primary cursor-pointer" />
                        <span className="text-sm font-medium text-text-main">{t.full_name} <span className="text-xs text-text-muted">({t.department || 'No Dept'})</span></span>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setManageTeachersSubject(null)} className="px-4 py-2 bg-surface border border-border text-text-muted rounded-xl hover:bg-bg text-sm font-semibold transition-colors">Cancel</button>
                  <button type="button" onClick={handleSaveSubjectTeachers} className="px-4 py-2 bg-accent-primary text-white rounded-xl hover:bg-accent-primary/80 text-sm font-semibold transition-colors shadow-sm">Save Teachers</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instruction Preview Modal */}
      {showInstructionPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={() => setShowInstructionPreview(false)}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="bg-accent-primary px-6 py-4 flex items-center justify-between shrink-0">
              <span className="text-white font-bold">Exam Instructions Preview</span>
              <button onClick={() => setShowInstructionPreview(false)} className="text-white/70 hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-6 overflow-y-auto bg-[#F9FAFB]">
              <p className="text-sm text-text-muted mb-4 text-center font-medium">This is how the instructions will appear to the student in the exam app.</p>
              
              <div className="border border-[#E4E7EC] rounded-xl p-8 bg-surface shadow-sm max-w-2xl mx-auto">
                <div className="border-l-4 border-[#008080] pl-3 mb-4">
                  <h3 className="text-sm font-extrabold text-[#1D2939] uppercase tracking-wider">Important Instructions</h3>
                </div>
                <ul className="space-y-3">
                  {/* General Instructions */}
                  <li className="flex gap-3 text-sm text-[#667085] font-medium">
                    <span className="text-accent-primary font-bold mt-0.5">▸</span>
                    Do not refresh the page or close the application once the exam has started.
                  </li>
                  <li className="flex gap-3 text-sm text-[#667085] font-medium">
                    <span className="text-accent-primary font-bold mt-0.5">▸</span>
                    The timer will run continuously. If you get disconnected, your time will keep running on the server.
                  </li>
                  <li className="flex gap-3 text-sm text-[#667085] font-medium">
                    <span className="text-accent-primary font-bold mt-0.5">▸</span>
                    Your answers are automatically saved as you select them.
                  </li>
                  <li className="flex gap-3 text-sm text-[#667085] font-medium">
                    <span className="text-accent-primary font-bold mt-0.5">▸</span>
                    Once the exam end time is reached, it will be automatically submitted regardless of your progress.
                  </li>

                  {/* Custom Exam-Specific Instructions */}
                  {instructionsList.filter(i => i.trim() !== '').map((inst, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-[#667085] font-medium bg-emerald-50/50 p-2 -mx-2 rounded border border-dashed border-emerald-100">
                      <span className="text-accent-primary font-bold mt-0.5">▸</span>
                      {inst}
                      <span className="ml-auto text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded tracking-wider self-start shrink-0">Your Addition</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
              <button type="button" onClick={() => setShowInstructionPreview(false)} className="px-6 py-2.5 bg-accent-primary text-white font-semibold rounded-xl hover:bg-accent-primary/80 text-sm transition-colors shadow-sm">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowAddStudentModal(false); setAddError(''); setAddSuccess(''); setAddMode('link'); setLinkCopied(false); setSearchQuery(''); }}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-accent-primary px-6 py-4 flex items-center justify-between">
              <span className="text-white font-bold">Add Students to Exam</span>
              <button onClick={() => { setShowAddStudentModal(false); setAddError(''); setAddSuccess(''); setAddMode('link'); setLinkCopied(false); setSearchQuery(''); }} className="text-white/70 hover:text-white transition-colors">✕</button>
            </div>

            <div className="p-6 h-[550px] flex flex-col">
              {/* Tabs */}
              <div className="flex bg-bg rounded-xl p-1 mb-6 border border-border shrink-0">
                <button
                  onClick={() => { setAddMode('link'); setAddError(''); setAddSuccess(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMode === 'link' ? 'bg-surface text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                  Share Link
                </button>
                <button
                  onClick={() => { setAddMode('search'); setAddError(''); setAddSuccess(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMode === 'search' || addMode === 'create' ? 'bg-surface text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                  Search & Add
                </button>
                <button
                  onClick={() => { setAddMode('csv'); setAddError(''); setAddSuccess(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMode === 'csv' ? 'bg-surface text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                >
                  Import CSV
                </button>
              </div>

              {addSuccess && <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-600 text-sm font-medium mb-6">{addSuccess}</div>}
              {addError && <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-sm font-medium mb-6 flex items-center gap-2"><AlertCircle size={16}/> {addError}</div>}

              {addMode === 'link' ? (
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                  <div className="bg-surface border border-border rounded-xl p-6">
                    <Globe size={32} className="mx-auto text-accent-primary mb-3" />
                    <p className="text-text-main text-base font-bold text-center mb-2">Public Registration Link</p>
                    <p className="text-text-muted text-sm font-medium text-center mb-5">Share this link with students. They will be automatically added to this exam upon completing the form.</p>
                    
                    <div className="bg-bg border border-border p-4 rounded-xl mb-5 space-y-3">
                      <p className="text-xs font-bold text-accent-primary uppercase tracking-wider mb-2">Optional: Pre-fill Student Details</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Course</label>
                          <CustomCombobox 
                            value={linkCourse} 
                            onChange={setLinkCourse} 
                            options={uniqueCourses as string[]} 
                            placeholder="e.g. NEET"
                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-main text-xs focus:outline-none focus:border-accent-primary" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Batch</label>
                          <CustomCombobox 
                            value={linkBatch} 
                            onChange={setLinkBatch} 
                            options={uniqueBatches as string[]} 
                            placeholder="e.g. Morning"
                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-main text-xs focus:outline-none focus:border-accent-primary" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Session</label>
                          <CustomCombobox 
                            value={linkSession} 
                            onChange={setLinkSession} 
                            options={uniqueSessions as string[]} 
                            placeholder="e.g. 2024-25"
                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-main text-xs focus:outline-none focus:border-accent-primary" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register/${params.id}${linkCourse || linkBatch || linkSession ? `?p=${btoa(JSON.stringify({ c: linkCourse || undefined, b: linkBatch || undefined, s: linkSession || undefined }))}` : ''}`}
                        className="flex-1 px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text-muted font-mono focus:outline-none truncate" 
                      />
                      <button 
                        onClick={() => {
                          const url = `${window.location.origin}/register/${params.id}${linkCourse || linkBatch || linkSession ? `?p=${btoa(JSON.stringify({ c: linkCourse || undefined, b: linkBatch || undefined, s: linkSession || undefined }))}` : ''}`;
                          navigator.clipboard.writeText(url);
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }}
                        className="px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
                      >
                        <CopyIcon size={16}/>
                        {linkCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2 mt-auto">
                    <button type="button" onClick={() => { setShowAddStudentModal(false); setAddError(''); setSearchQuery(''); }} className="flex-1 py-2.5 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-bg text-sm transition-colors">
                      Close
                    </button>
                  </div>
                </div>
              ) : addMode === 'search' ? (
                <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                  <div className="flex flex-col gap-3 shrink-0">
                    <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      placeholder="Search by name or roll number..."
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all"
                    />
                    <div className="flex gap-2">
                      <select
                        value={filterCourse}
                        onChange={e => setFilterCourse(e.target.value)}
                        className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary"
                      >
                        <option value="">All Courses</option>
                        {uniqueCourses.map((c: any) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select
                        value={filterBatch}
                        onChange={e => setFilterBatch(e.target.value)}
                        className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary"
                      >
                        <option value="">All Batches</option>
                        {uniqueBatches.map((b: any) => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <select
                        value={filterSession}
                        onChange={e => setFilterSession(e.target.value)}
                        className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary"
                      >
                        <option value="">All Sessions</option>
                        {uniqueSessions.map((s: any) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {filteredStudents.length > 0 && (
                    <div className="flex justify-between items-center px-1 shrink-0">
                      <div className="text-xs font-semibold text-text-muted">
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
                          className="text-accent-primary text-xs font-bold hover:underline"
                        >
                          {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto border border-border rounded-xl divide-y divide-[#e0f2f2] custom-scrollbar">
                    {filteredStudents.map(student => (
                      <div key={student.id} className="p-3 flex justify-between items-center hover:bg-bg transition-colors cursor-pointer" onClick={() => {
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
                            className="w-4 h-4 text-accent-primary border-border rounded focus:ring-accent-primary cursor-pointer"
                          />
                          <div>
                            <p className="font-semibold text-text-main text-sm">{student.full_name}</p>
                            <p className="text-xs font-mono text-accent-primary mt-0.5">Roll: {student.roll_number} <span className="text-text-muted px-1">•</span> <span className="text-gray-500 font-sans">{student.course} ({student.batch})</span></p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAssignExisting(student.id); }} 
                          className="px-4 py-2 bg-surface-hover text-accent-primary hover:bg-accent-primary hover:text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                    {filteredStudents.length === 0 && (
                      <div className="p-6 text-center">
                        <p className="text-sm font-medium text-text-muted">No available students found.</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedStudents.length > 0 && (
                    <button 
                      onClick={handleBulkAssign}
                      disabled={bulkAssigning}
                      className="w-full py-3 mt-2 shrink-0 bg-accent-primary hover:bg-accent-primary/80 text-white font-bold rounded-xl shadow-lg shadow-accent-primary/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {bulkAssigning ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        `Assign ${selectedStudents.length} Selected Student${selectedStudents.length !== 1 ? 's' : ''}`
                      )}
                    </button>
                  )}

                  <div className="pt-2 text-center shrink-0">
                    <p className="text-sm font-medium text-text-muted">Can't find the student?</p>
                    <button 
                      type="button" 
                      onClick={() => { setAddMode('create'); setAddError(''); setAddSuccess(''); }} 
                      className="mt-2 text-accent-primary font-bold text-sm hover:underline"
                    >
                      Create New Student
                    </button>
                  </div>
                </div>
              ) : addMode === 'create' ? (
                <form onSubmit={handleAddStudent} className="space-y-4 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-text-main font-bold text-sm">Create New Student</h4>
                    <button 
                      type="button" 
                      onClick={() => { setAddMode('search'); setAddError(''); setAddSuccess(''); }} 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg text-accent-primary hover:bg-surface-hover hover:text-[#006666] rounded-lg text-xs font-bold transition-colors border border-border"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5">Full Name</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required
                      placeholder="Aarav Patel"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5">Roll Number</label>
                    <input type="text" value={newRoll} onChange={e => setNewRoll(e.target.value)} required
                      placeholder="2024001"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5">Date of Birth <span className="text-text-muted font-normal">(password = DDMMYYYY)</span></label>
                    <input type="date" value={newDob} onChange={e => setNewDob(e.target.value)} required
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5">Course</label>
                      <CustomCombobox 
                        value={newCourse} 
                        onChange={setNewCourse} 
                        options={uniqueCourses as string[]} 
                        placeholder="e.g. NEET"
                        className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5">Batch</label>
                      <CustomCombobox 
                        value={newBatch} 
                        onChange={setNewBatch} 
                        options={uniqueBatches as string[]} 
                        placeholder="e.g. Morning"
                        className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5">Session</label>
                      <CustomCombobox 
                        value={newSession} 
                        onChange={setNewSession} 
                        options={uniqueSessions as string[]} 
                        placeholder="e.g. 2024-25"
                        className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all" 
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={addingStudent}
                      className="flex-1 py-3 bg-accent-primary hover:bg-accent-primary/80 text-white font-semibold rounded-xl disabled:opacity-50 text-sm transition-colors shadow-sm shadow-accent-primary/20">
                      {addingStudent ? 'Creating...' : 'Create & Assign'}
                    </button>
                    <button type="button" onClick={() => { setShowAddStudentModal(false); setAddError(''); setSearchQuery(''); }}
                      className="px-6 py-3 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-bg text-sm transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCsvImport} className="space-y-4">
                  <div className="bg-bg border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-text-main text-sm font-bold">CSV Format:</p>
                      <button type="button" onClick={handleDownloadCsvTemplate} className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-primary hover:underline bg-surface px-2 py-1 rounded border border-accent-primary/20 shadow-sm hover:bg-surface-hover transition-colors">
                        <Download size={12} /> Download Template
                      </button>
                    </div>
                    <code className="text-xs text-accent-primary bg-surface px-4 py-3 block border border-border rounded-lg font-mono overflow-x-auto whitespace-nowrap">
                      name, roll_number, dob, course, batch, session<br />
                      Aarav Patel, 2024001, 15/06/2005, NEET, Morning, 2024-25<br />
                      Priya Singh, 2024002, 22/03/2005, JEE, Evening, 2024-25
                    </code>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5">Select CSV File</label>
                    <input type="file" accept=".csv,.txt" required onChange={e => setCsvFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-lg file:bg-accent-primary/10 file:text-accent-primary file:font-semibold hover:file:bg-accent-primary/20 transition-all text-sm" />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={addingStudent || !csvFile}
                      className="flex-1 py-3 bg-accent-primary hover:bg-accent-primary/80 text-white font-semibold rounded-xl disabled:opacity-50 text-sm transition-colors shadow-sm shadow-accent-primary/20">
                      {addingStudent ? 'Importing...' : 'Import CSV'}
                    </button>
                    <button type="button" onClick={() => { setShowAddStudentModal(false); setAddError(''); }}
                      className="px-6 py-3 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-bg text-sm transition-colors">
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
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">{confirmDialog.title}</h3>
              <p className="text-text-muted text-sm font-medium mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-bg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  className={`flex-1 py-3 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm ${
                    confirmDialog.confirmColor.includes('red') ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 
                    confirmDialog.confirmColor.includes('orange') ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 
                    confirmDialog.confirmColor.includes('amber') ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 
                    'bg-accent-primary hover:bg-accent-primary/80 shadow-accent-primary/20'
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
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-accent-primary px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold">Add Subject</h3>
              <button onClick={() => setShowAddSubjectModal(false)} className="text-white/70 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddSubject} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">Subject Name</label>
                  <input type="text" value={newSubject.name} onChange={(e) => setNewSubject({...newSubject, name: e.target.value})} required
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all text-sm font-medium"
                    placeholder="e.g. Physics" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">No. of Questions</label>
                  <input type="number" value={newSubject.questionCount} onChange={(e) => setNewSubject({...newSubject, questionCount: Math.max(0, parseInt(e.target.value) || 0)})} min="0" required
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all text-sm font-medium" />
                </div>
              </div>
              <div className="mb-6 max-h-48 overflow-y-auto custom-scrollbar border border-border rounded-lg p-3 bg-bg">
                <label className="block text-xs font-semibold text-text-muted mb-2">Assign Teachers</label>
                {teachers.length === 0 ? (
                  <p className="text-text-muted text-xs font-medium">No teachers available.</p>
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
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">{dep}</p>
                        <div className="flex flex-wrap gap-2">
                          {depTeachers.map((t: any) => (
                            <button key={t.id} type="button" onClick={() => toggleNewSubjectTeacher(t.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                newSubject.teacherIds.includes(t.id)
                                  ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                                  : 'bg-surface border-border text-text-muted hover:border-border hover:text-text-muted'
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
                  className="px-5 py-2.5 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-bg text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2.5 bg-accent-primary text-white font-semibold rounded-xl hover:bg-accent-primary/80 text-sm transition-colors shadow-sm">
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
