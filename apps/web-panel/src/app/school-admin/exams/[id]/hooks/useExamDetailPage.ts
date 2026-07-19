import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { openRazorpayCheckout } from '@/components/RazorpayCheckout';
import { type Crop } from 'react-image-crop';

export const parseQuestionImages = (urlStr: string | null): string[] => {
  if (!urlStr) return [];
  const trimmed = urlStr.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      return [trimmed];
    }
  }
  return [trimmed];
};

export function useExamDetailPage(paramsId: string) {
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
  const [examFee, setExamFee] = useState<number | null>(null);

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
  const [linkGenerated, setLinkGenerated] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [bulkAssigning, setBulkAssigning] = useState(false);

  const [teachers, setTeachers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectTeacherSearch, setNewSubjectTeacherSearch] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

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
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');

  const [showInstructionPreview, setShowInstructionPreview] = useState(false);

  // Instructions Editing State & Helpers
  const [instructionsList, setInstructionsList] = useState<string[]>([]);
  const [editInstructionsMode, setEditInstructionsMode] = useState(false);

  // ---- Questions Step 3 States ----
  const [drawerSubjectId, setDrawerSubjectId] = useState<string | null>(null);
  const [drawerView, setDrawerView] = useState<'list' | 'editor'>('list');
  const [drawerQuestions, setDrawerQuestions] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerFormLoading, setDrawerFormLoading] = useState(false);
  const [drawerError, setDrawerError] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [qType, setQType] = useState<'mcq' | 'nat'>('mcq');
  const [qText, setQText] = useState('');
  const [qImage, setQImage] = useState<string | null>(null);

  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'question' | 'A' | 'B' | 'C' | 'D' | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<any>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  const [optA, setOptA] = useState('');
  const [optAImg, setOptAImg] = useState<string | null>(null);
  const [optB, setOptB] = useState('');
  const [optBImg, setOptBImg] = useState<string | null>(null);
  const [optC, setOptC] = useState('');
  const [optCImg, setOptCImg] = useState<string | null>(null);
  const [optD, setOptD] = useState('');
  const [optDImg, setOptDImg] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [natAnswer, setNatAnswer] = useState('');

  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', questionCount: 10, teacherIds: [] as string[] });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmColor: 'bg-accent-primary hover:bg-accent-primary/80 border-[#004d4d]',
    onConfirm: () => { }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const step = searchParams.get('step');
      let parsedStep = step ? parseInt(step) : NaN;

      if (isNaN(parsedStep) || parsedStep < 1 || parsedStep > 5) {
        const savedStep = window.localStorage.getItem(`exam-step-${paramsId}`);
        parsedStep = savedStep ? parseInt(savedStep) : NaN;
      }

      if (!isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 5) {
        setCurrentStep(parsedStep);
        window.history.replaceState(null, '', `?step=${parsedStep}`);
      }
    }
  }, [paramsId]);

  const handleSetStep = (step: number) => {
    setCurrentStep(step);
    window.history.replaceState(null, '', `?step=${step}`);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`exam-step-${paramsId}`, String(step));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openManageQuestions = async (subjectId: string) => {
    setDrawerSubjectId(subjectId);
    setDrawerView('list');
    setEditingQuestionId(null);

    // Load draft from localStorage if one exists
    if (typeof window !== 'undefined') {
      const key = `exam-question-draft-${paramsId}-${subjectId}`;
      const saved = window.localStorage.getItem(key);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setQType(draft.qType || 'mcq');
          setQText(draft.qText || '');
          setQImage(draft.qImage || null);
          setOptA(draft.optA || '');
          setOptAImg(draft.optAImg || null);
          setOptB(draft.optB || '');
          setOptBImg(draft.optBImg || null);
          setOptC(draft.optC || '');
          setOptCImg(draft.optCImg || null);
          setOptD(draft.optD || '');
          setOptDImg(draft.optDImg || null);
          setCorrectAnswer(draft.correctAnswer || 'A');
          setNatAnswer(draft.natAnswer || '');
          setDrawerError('');
        } catch (e) {
          console.error('Failed to parse draft', e);
          clearDraft();
        }
      } else {
        clearDraft();
      }
    } else {
      clearDraft();
    }

    setDrawerLoading(true);
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_subject_id', subjectId)
      .order('question_number', { ascending: true });
    setDrawerQuestions(data || []);
    setDrawerLoading(false);
  };

  const fetchDrawerQuestions = async () => {
    if (!drawerSubjectId) return;
    const { data } = await supabase.from('questions').select('*').eq('exam_subject_id', drawerSubjectId).order('question_number', { ascending: true });
    setDrawerQuestions(data || []);
    setQuestionCounts(prev => ({ ...prev, [drawerSubjectId]: data?.length || 0 }));
  };

  const clearDraft = () => {
    setEditingQuestionId(null);
    setQType('mcq'); setQText(''); setQImage(null);
    setOptA(''); setOptAImg(null); setOptB(''); setOptBImg(null);
    setOptC(''); setOptCImg(null); setOptD(''); setOptDImg(null);
    setCorrectAnswer('A'); setNatAnswer(''); setDrawerError('');
    if (typeof window !== 'undefined' && drawerSubjectId) {
      window.localStorage.removeItem(`exam-question-draft-${paramsId}-${drawerSubjectId}`);
    }
  };

  const handleDrawerCancel = () => {
    // Closing/cancelling should NOT delete the autosaved draft.
    // If we were editing an existing question, the form fields currently hold
    // that question's data (not the "new question" draft), so restore whatever
    // the real new-question draft was before leaving editingQuestionId mode —
    // otherwise the autosave effect below would overwrite the draft with the
    // edited question's data.
    if (editingQuestionId) {
      let restored = false;
      if (typeof window !== 'undefined' && drawerSubjectId) {
        const key = `exam-question-draft-${paramsId}-${drawerSubjectId}`;
        const saved = window.localStorage.getItem(key);
        if (saved) {
          try {
            const draft = JSON.parse(saved);
            setQType(draft.qType || 'mcq');
            setQText(draft.qText || '');
            setQImage(draft.qImage || null);
            setOptA(draft.optA || ''); setOptAImg(draft.optAImg || null);
            setOptB(draft.optB || ''); setOptBImg(draft.optBImg || null);
            setOptC(draft.optC || ''); setOptCImg(draft.optCImg || null);
            setOptD(draft.optD || ''); setOptDImg(draft.optDImg || null);
            setCorrectAnswer(draft.correctAnswer || 'A');
            setNatAnswer(draft.natAnswer || '');
            restored = true;
          } catch (e) {
            console.error('Failed to parse draft on cancel', e);
          }
        }
      }
      if (!restored) {
        setQType('mcq'); setQText(''); setQImage(null);
        setOptA(''); setOptAImg(null); setOptB(''); setOptBImg(null);
        setOptC(''); setOptCImg(null); setOptD(''); setOptDImg(null);
        setCorrectAnswer('A'); setNatAnswer('');
      }
      setEditingQuestionId(null);
    }
    setDrawerError('');
    setDrawerView('list');
  };

  const handleDrawerNewQuestion = () => {
    setEditingQuestionId(null);
    setDrawerView('editor');

    // Load draft if one exists
    if (typeof window !== 'undefined' && drawerSubjectId) {
      const key = `exam-question-draft-${paramsId}-${drawerSubjectId}`;
      const saved = window.localStorage.getItem(key);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setQType(draft.qType || 'mcq');
          setQText(draft.qText || '');
          setQImage(draft.qImage || null);
          setOptA(draft.optA || '');
          setOptAImg(draft.optAImg || null);
          setOptB(draft.optB || '');
          setOptBImg(draft.optBImg || null);
          setOptC(draft.optC || '');
          setOptCImg(draft.optCImg || null);
          setOptD(draft.optD || '');
          setOptDImg(draft.optDImg || null);
          setCorrectAnswer(draft.correctAnswer || 'A');
          setNatAnswer(draft.natAnswer || '');
          setDrawerError('');
          return;
        } catch (e) {
          console.error('Failed to parse draft on new question', e);
        }
      }
    }
    clearDraft();
  };

  // Auto-save draft to localStorage whenever fields change
  useEffect(() => {
    if (typeof window === 'undefined' || !paramsId || !drawerSubjectId) return;

    // Only save draft if we are adding a question (not editing an existing one)
    if (editingQuestionId === null) {
      const draftData = {
        qType,
        qText,
        qImage,
        optA,
        optAImg,
        optB,
        optBImg,
        optC,
        optCImg,
        optD,
        optDImg,
        correctAnswer,
        natAnswer,
      };

      const isDefault = qType === 'mcq' && qText === '' && qImage === null &&
        optA === '' && optAImg === null && optB === '' && optBImg === null &&
        optC === '' && optCImg === null && optD === '' && optDImg === null &&
        correctAnswer === 'A' && natAnswer === '';

      const key = `exam-question-draft-${paramsId}-${drawerSubjectId}`;
      if (isDefault) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(draftData));
      }
    }
  }, [
    paramsId,
    drawerSubjectId,
    editingQuestionId,
    qType,
    qText,
    qImage,
    optA,
    optAImg,
    optB,
    optBImg,
    optC,
    optCImg,
    optD,
    optDImg,
    correctAnswer,
    natAnswer
  ]);

  const doSaveQuestion = async (e: any, addAnother: boolean) => {
    e.preventDefault();
    setDrawerError('');
    setDrawerFormLoading(true);
    try {
      if (!qText.trim() && !qImage) throw new Error('Please provide question text or an image.');

      const missingFields: string[] = [];
      if (qType === 'mcq') {
        if (!optA.trim() && !optAImg) missingFields.push('Option A');
        if (!optB.trim() && !optBImg) missingFields.push('Option B');
        if (!optC.trim() && !optCImg) missingFields.push('Option C');
        if (!optD.trim() && !optDImg) missingFields.push('Option D');
        if (!correctAnswer) missingFields.push('Correct answer');
      } else {
        if (!natAnswer.trim()) missingFields.push('Correct numerical answer');
      }
      if (missingFields.length > 0) {
        throw new Error(`Please fill in the missing field${missingFields.length > 1 ? 's' : ''}: ${missingFields.join(', ')}`);
      }

      const subjectDef = subjects.find(s => s.id === drawerSubjectId);
      if (!editingQuestionId && subjectDef && drawerQuestions.length >= subjectDef.question_count) {
        throw new Error(`Maximum question limit (${subjectDef.question_count}) reached.`);
      }

      const markingScheme = exam?.marking_scheme || {};
      const questionData: any = {
        exam_id: paramsId,
        school_id: exam?.school_id,
        exam_subject_id: drawerSubjectId,
        question_type: qType,
        question_text: qText,
        question_number: editingQuestionId ? undefined : drawerQuestions.length + 1,
        image_url: qImage,
        marks: qType === 'mcq' ? (markingScheme.mcq_correct || 4) : (markingScheme.nat_correct || 4),
        positive_marks: qType === 'mcq' ? (markingScheme.mcq_correct || 4) : (markingScheme.nat_correct || 4),
        negative_marks: qType === 'mcq' ? (markingScheme.mcq_wrong || -1) : (markingScheme.nat_wrong || 0),
      };

      if (qType === 'mcq') {
        questionData.options = { A: optA, A_image: optAImg, B: optB, B_image: optBImg, C: optC, C_image: optCImg, D: optD, D_image: optDImg };
        questionData.correct_option = correctAnswer;
      } else {
        questionData.options = {};
        questionData.correct_option = natAnswer;
      }

      if (editingQuestionId) {
        const { error } = await supabase.from('questions').update(questionData).eq('id', editingQuestionId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('questions').insert(questionData);
        if (error) throw error;
      }

      await fetchDrawerQuestions();
      clearDraft();

      if (addAnother) {
        setDrawerView('editor');
      } else {
        setDrawerView('list');
      }
    } catch (err: any) {
      setDrawerError(err.message);
    } finally {
      setDrawerFormLoading(false);
    }
  };

  const handleDrawerEditQuestion = (q: any) => {
    setEditingQuestionId(q.id);
    setQType(q.question_type);
    setQText(q.question_text || '');
    setQImage(q.image_url || null);
    if (q.question_type === 'mcq') {
      setOptA(q.options?.A || ''); setOptAImg(q.options?.A_image || null);
      setOptB(q.options?.B || ''); setOptBImg(q.options?.B_image || null);
      setOptC(q.options?.C || ''); setOptCImg(q.options?.C_image || null);
      setOptD(q.options?.D || ''); setOptDImg(q.options?.D_image || null);
      setCorrectAnswer(q.correct_option || 'A'); setNatAnswer('');
    } else {
      setNatAnswer(q.correct_option || '');
    }
    setDrawerView('editor');
  };

  const handleDrawerDeleteQuestion = async (qId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question?',
      confirmText: 'Delete',
      confirmColor: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
      onConfirm: async () => {
        setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
        await supabase.from('questions').delete().eq('id', qId);
        fetchDrawerQuestions();
      }
    });
  };

  const handleDrawerImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'question' | 'A' | 'B' | 'C' | 'D') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCropTarget(target);
      setRawImageToCrop(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropAndSave = () => {
    if (!completedCrop || !imageRef || !completedCrop.width || !completedCrop.height) {
      if (imageRef) {
        setCrop({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
        setCompletedCrop({ width: imageRef.naturalWidth, height: imageRef.naturalHeight, x: 0, y: 0, unit: 'px' });
      }
      return;
    }
    const canvas = document.createElement('canvas');
    const scaleX = imageRef.naturalWidth / imageRef.width;
    const scaleY = imageRef.naturalHeight / imageRef.height;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    const MAX_WIDTH = 800;
    let finalWidth = cropWidth;
    let finalHeight = cropHeight;
    if (finalWidth > MAX_WIDTH) {
      finalHeight = Math.round((finalHeight * MAX_WIDTH) / finalWidth);
      finalWidth = MAX_WIDTH;
    }
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
      ctx.drawImage(imageRef, completedCrop.x * scaleX, completedCrop.y * scaleY, cropWidth, cropHeight, 0, 0, finalWidth, finalHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      if (cropTarget === 'question') {
        const existing = qImage ? parseQuestionImages(qImage) : [];
        setQImage(JSON.stringify([...existing, dataUrl]));
      }
      else if (cropTarget === 'A') setOptAImg(dataUrl);
      else if (cropTarget === 'B') setOptBImg(dataUrl);
      else if (cropTarget === 'C') setOptCImg(dataUrl);
      else if (cropTarget === 'D') setOptDImg(dataUrl);
    }
    setRawImageToCrop(null);
    setCropTarget(null);
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const canProceedToNextStep = (step: number) => {
    if (step === 1) {
      return (
        title.trim() !== '' &&
        description.trim() !== '' &&
        durationMinutes > 0 &&
        String(mcqCorrect).trim() !== '' &&
        String(mcqWrong).trim() !== '' &&
        String(natCorrect).trim() !== '' &&
        String(natWrong).trim() !== '' &&
        subjects.length > 0
      );
    }
    if (step === 2) {
      return assignedStudents.length > 0;
    }
    if (step === 3) {
      return subjects.length > 0 && subjects.every(s => (questionCounts[s.id] || 0) >= s.question_count);
    }
    if (step === 4) {
      return startTime !== '' && endTime !== '';
    }
    if (step === 5) {
      return !!exam?.is_paid;
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
    window.dispatchEvent(new CustomEvent('save-status-update', { detail: { status: 'saving' } }));
    try {
      const filteredInstructions = currentInstructions.filter(inst => inst.trim() !== '');
      const updateData: any = {
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
      };

      if (startTime && currentDuration > 0) {
        const end = new Date(new Date(startTime).getTime() + currentDuration * 60000);
        updateData.end_time = end.toISOString();
      }

      const { error } = await supabase.from('exams').update(updateData).eq('id', paramsId);

      if (error) throw error;
      setExam((prev: any) => prev ? { ...prev, title: currentTitle, description: currentDesc, duration_minutes: currentDuration, exam_instructions: filteredInstructions, ...(updateData.end_time ? { end_time: updateData.end_time } : {}) } : null);
      setSaveStatus('saved');
      window.dispatchEvent(new CustomEvent('save-status-update', { detail: { status: 'saved' } }));
      setTimeout(() => {
        setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus('error');
      window.dispatchEvent(new CustomEvent('save-status-update', { detail: { status: 'error' } }));
    }
  };

  const handleSaveExamDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList);
  };

  const autoSaveSchedule = async (
    currentStartTime = startTime,
    currentEndTime = endTime
  ) => {
    setSaveStatus('saving');
    window.dispatchEvent(new CustomEvent('save-status-update', { detail: { status: 'saving' } }));

    try {
      let calculatedDuration: number | undefined = undefined;
      if (currentStartTime && currentEndTime) {
        const gap = Math.round((new Date(currentEndTime).getTime() - new Date(currentStartTime).getTime()) / 60000);
        if (gap > 0) {
          calculatedDuration = gap;
        }
      }

      const updates: any = {
        start_time: currentStartTime ? new Date(currentStartTime).toISOString() : null,
        end_time: currentEndTime ? new Date(currentEndTime).toISOString() : null,
        ...(calculatedDuration !== undefined ? { duration_minutes: calculatedDuration } : {})
      };

      const { error } = await supabase.from('exams').update(updates).eq('id', paramsId);
      if (error) throw error;

      setExam((prev: any) => prev ? { ...prev, ...updates } : null);
      if (calculatedDuration !== undefined) {
        setDurationMinutes(calculatedDuration);
      }
      setSaveStatus('saved');
      window.dispatchEvent(new CustomEvent('save-status-update', { detail: { status: 'saved' } }));
      setTimeout(() => {
        setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setSaveStatus('error');
      window.dispatchEvent(new CustomEvent('save-status-update', { detail: { status: 'error' } }));
    }
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

      if (template.exam_template_subjects?.length > 0) {
        subjectsPromise = (async () => {
          await supabase.from('exam_subjects').delete().eq('exam_id', paramsId);

          const subjectsToInsert = template.exam_template_subjects.map((s: any, i: number) => ({
            exam_id: paramsId,
            subject_name: s.subject_name,
            question_count: s.question_count,
            sort_order: i,
          }));
          await supabase.from('exam_subjects').insert(subjectsToInsert);

          const { data: subjectsData } = await supabase
            .from('exam_subjects')
            .select('*, exam_subject_teachers(*, teachers:teacher_id(full_name))')
            .eq('exam_id', paramsId)
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

  const downloadQuestionPaper = async () => {
    try {
      setGeneratingPDF(true);

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
          qIndex = 1;
        }

        html += `
          <div class="question-block" style="margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid;">
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px;">Q${qIndex}. ${q.question_text || 'Image Question'}</div>
        `;

        if (q.image_url) {
          const images = parseQuestionImages(q.image_url);
          images.forEach((imgUrl: string) => {
            html += `<img src="${imgUrl}" style="max-width: 400px; max-height: 300px; display: block; margin-bottom: 15px; border-radius: 8px; border: 1px solid #e0f2f2;" />`;
          });
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

  const formatForInput = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const fetchExamData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user) {
      setUserId(user.id);
      setRole(user.user_metadata?.role || 'school_admin');
    }

    // Fetch templates independently so it doesn't block the rest of the page
    supabase
      .from('exam_templates')
      .select('*, exam_template_subjects(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTemplates(data || []);
        setTemplatesLoading(false);
      });

    const { data: examData } = await supabase.from('exams').select('*').eq('id', paramsId).single();
    setExam(examData);
    if (examData) {
      window.dispatchEvent(new CustomEvent('exam-status-update', { detail: { status: examData.status } }));
    }
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

    const { data: subjectsData } = await supabase
      .from('exam_subjects')
      .select('*, exam_subject_teachers(*, teachers:teacher_id(full_name))')
      .eq('exam_id', paramsId)
      .order('sort_order');
    setSubjects(subjectsData || []);

    const counts: Record<string, number> = {};
    for (const s of (subjectsData || [])) {
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('exam_subject_id', s.id);
      counts[s.id] = count ?? 0;
    }
    setQuestionCounts(counts);

    const { data: examStudents } = await supabase
      .from('exam_students')
      .select('*')
      .eq('exam_id', paramsId)
      .order('created_at');

    const { data: examResults } = await supabase
      .from('results')
      .select('student_id, total_marks, answers, time_taken_seconds')
      .eq('exam_id', paramsId);

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

    const { data: allStudents } = await supabase
      .from('students')
      .select('id, full_name, roll_number, date_of_birth, course, batch, session')
      .eq('school_id', examData.school_id)
      .order('full_name');
    setSchoolStudents(allStudents || []);

    const { data: allTeachers } = await supabase
      .from('teachers')
      .select('*')
      .eq('school_id', examData.school_id)
      .order('department', { ascending: true })
      .order('full_name', { ascending: true });
    setTeachers(allTeachers || []);

    const { data: schoolData } = await supabase
      .from('schools')
      .select('exam_credits')
      .eq('id', examData.school_id)
      .single();
    if (schoolData) {
      setExamFee(schoolData.exam_credits || 0); // Reusing examFee state as examCredits for now, or I'll change the state name
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchExamData();
  }, [paramsId]);

  useEffect(() => {
    if (currentStep === 3 && !loading && subjects.length > 0) {
      const isCurrentSubjectValid = subjects.some(s => s.id === drawerSubjectId);
      if (!isCurrentSubjectValid) {
        const allowedSubject = subjects.find(s =>
          role !== 'teacher' ||
          s.exam_subject_teachers?.some((est: any) => est.teacher_id === userId)
        );
        if (allowedSubject) {
          openManageQuestions(allowedSubject.id);
        }
      }
    }
  }, [currentStep, loading, subjects, drawerSubjectId, role, userId]);

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
        // Call the publish API to deduct credit
        const res = await fetch('/api/exams/publish-with-credit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examId: exam.id, schoolId: exam.school_id })
        });
        
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 402) {
            alert('Insufficient exam credits. Please purchase more credits.');
          } else {
            alert(data.error || 'Failed to publish exam');
          }
          setPublishing(false);
          return;
        }
      }

      const updates: any = {
        status: 'published',
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        is_paid: true
      };

      await supabase.from('exams').update(updates).eq('id', paramsId);
      setExam({ ...exam, ...updates });
      fetchExamData(); // Refresh to update credits locally
      window.dispatchEvent(new CustomEvent('exam-status-update', { detail: { status: 'published' } }));
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred while publishing.');
    } finally {
      setPublishing(false);
    }
  };

  const handlePayment = async () => {
    // Legacy function, replaced by credit system
  };

  const handleTogglePaid = async () => {
    const newStatus = !exam.is_paid;
    try {
      setPublishing(true);
      setExam((prev: any) => prev ? { ...prev, is_paid: newStatus } : null);
      const { error } = await supabase.from('exams').update({ is_paid: newStatus }).eq('id', exam.id);
      if (error) throw error;
      alert(`Exam payment status set to: ${newStatus ? 'Paid' : 'Unpaid'}`);
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
      setExam((prev: any) => prev ? { ...prev, is_paid: !newStatus } : null);
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
    setDurationMinutes(inlineEditDuration);
    setExam((prev: any) => prev ? { ...prev, duration_minutes: inlineEditDuration } : null);
    await supabase.from('exams').update({ duration_minutes: inlineEditDuration }).eq('id', paramsId);
  };

  const handleSaveSubjectCount = async (subjectId: string) => {
    if (inlineEditSubjectCount < 1) {
      alert('Question count must be at least 1');
      return;
    }
    setEditSubjectId(null);
    setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, question_count: inlineEditSubjectCount } : s));
    await supabase.from('exam_subjects').update({ question_count: inlineEditSubjectCount }).eq('id', subjectId);
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
        setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
        setSubjects(prev => prev.filter(s => s.id !== subjectId));
        setQuestionCounts(prev => {
          const newCounts = { ...prev };
          delete newCounts[subjectId];
          return newCounts;
        });
        await supabase.from('exam_subjects').delete().eq('id', subjectId);
      }
    });
  };

  const handleSaveSubjectTeachers = async () => {
    if (!manageTeachersSubject) return;

    const teacherObjects = teachers.filter(t => selectedTeacherIds.includes(t.id));
    setSubjects(prev => prev.map(s =>
      s.id === manageTeachersSubject.id
        ? { ...s, exam_subject_teachers: teacherObjects.map(t => ({ teacher_id: t.id, teachers: t })) }
        : s
    ));
    setManageTeachersSubject(null);

    await supabase.from('exam_subject_teachers').delete().eq('exam_subject_id', manageTeachersSubject.id);
    if (selectedTeacherIds.length > 0) {
      const inserts = selectedTeacherIds.map(tId => ({
        exam_subject_id: manageTeachersSubject.id,
        teacher_id: tId
      }));
      await supabase.from('exam_subject_teachers').insert(inserts);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim()) {
      alert('Subject name is required');
      return;
    }

    const sortOrder = subjects.length;
    const { data: subjectRow, error: subjectError } = await supabase.from('exam_subjects').insert({
      exam_id: paramsId,
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

    const teacherObjects = teachers.filter(t => newSubject.teacherIds.includes(t.id));
    setSubjects(prev => [...prev, {
      ...subjectRow,
      exam_subject_teachers: teacherObjects.map(t => ({ teacher_id: t.id, teachers: t }))
    }]);
    setQuestionCounts(prev => ({ ...prev, [subjectRow.id]: 0 }));

    setShowAddSubjectModal(false);
    setNewSubject({ name: '', questionCount: 10, teacherIds: [] });
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
      exam_id: paramsId,
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
      const student = schoolStudents.find(s => s.id === studentId);
      if (student) {
        setAssignedStudents(prev => [...prev, { id: crypto.randomUUID(), exam_id: paramsId, student_id: studentId, status: 'assigned', students: student, result: null }]);
      }
    }
  };

  const handleBulkAssign = async () => {
    if (selectedStudents.length === 0) return;
    setAddError('');
    setAddSuccess('');
    setBulkAssigning(true);

    const { error } = await supabase.rpc('assign_students', {
      p_exam_id: paramsId,
      p_student_ids: selectedStudents
    });

    if (error) {
      setAddError(error.message);
    } else {
      setAddSuccess(`${selectedStudents.length} students assigned successfully!`);
      const newAssignments = selectedStudents.map(studentId => {
        const student = schoolStudents.find(s => s.id === studentId);
        return { id: crypto.randomUUID(), exam_id: paramsId, student_id: studentId, status: 'assigned', students: student || null, result: null };
      });
      setAssignedStudents(prev => [...prev, ...newAssignments]);
      setSelectedStudents([]);
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
          exam_id: paramsId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add student');
      setAddSuccess(`Student "${newName}" added successfully!`);
      if (data.student) {
        setAssignedStudents(prev => [...prev, { id: crypto.randomUUID(), exam_id: paramsId, student_id: data.student.id, status: 'assigned', students: data.student, result: null }]);
        setSchoolStudents(prev => [...prev, data.student]);
      }
      setNewName(''); setNewRoll(''); setNewDob('');
      setNewCourse(''); setNewBatch(''); setNewSession('');
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
      const newStudents: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 3) continue;
        const [studentName, studentRoll, studentDob, csvCourse = '', csvBatch = '', csvSession = ''] = cols;
        let formattedDob = studentDob;
        if (studentDob.includes('/')) {
          const [d, m, y] = studentDob.split('/');
          formattedDob = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
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
              exam_id: paramsId
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.student) {
              newStudents.push(data.student);
            }
            imported++;
          } else {
            const d = await res.json();
            errors.push(`${studentRoll}: ${d.error || 'Failed'}`);
          }
        } catch { errors.push(`${studentRoll}: Failed`); }
      }
      setAddSuccess(`Imported ${imported} students${errors.length ? `. ${errors.length} failed.` : '.'}`);
      setCsvFile(null);
      const newAssignments = newStudents.map(s => ({ id: crypto.randomUUID(), exam_id: paramsId, student_id: s.id, status: 'assigned', students: s, result: null }));
      setAssignedStudents(prev => [...prev, ...newAssignments]);
      setSchoolStudents(prev => [...prev, ...newStudents]);
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddingStudent(false);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = "name,roll_number,dob,course,batch,session\\nAarav Patel,2024001,15/06/2005,NEET,Morning,2024-25\\nPriya Singh,2024002,22/03/2005,JEE,Evening,2024-25";
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
        setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
        setAssignedStudents(prev => prev.filter(as => as.student_id !== studentId));
        setSchoolStudents(prev => prev.filter(s => s.id !== studentId));
        await supabase.from('exam_students').delete().eq('id', examStudentId);
        await fetch('/api/students/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId }),
        });
      }
    });
  };

  const handleDuplicate = async () => {
    const newTitle = prompt('Enter a title for the duplicated exam:', `${exam.title} (Copy)`);
    if (!newTitle) return;

    setLoading(true);
    try {
      // 1. Insert new exam
      const { data: newExam, error: examError } = await supabase
        .from('exams')
        .insert({
          school_id: exam.school_id,
          title: newTitle,
          description: exam.description,
          duration_minutes: exam.duration_minutes,
          status: 'draft',
          marking_scheme: exam.marking_scheme,
          total_marks: exam.total_marks,
          is_paid: false,
          exam_instructions: exam.exam_instructions,
          created_by: exam.created_by
        })
        .select()
        .single();

      if (examError || !newExam) throw examError || new Error('Failed to create new exam');

      // 2. Fetch old subjects
      const { data: oldSubjects, error: subjectsError } = await supabase
        .from('exam_subjects')
        .select('*')
        .eq('exam_id', paramsId);
      
      if (subjectsError) throw subjectsError;

      // 3. Create new subjects and build a mapping
      const oldToNewSubjectMap: Record<string, string> = {};
      if (oldSubjects && oldSubjects.length > 0) {
        for (const subj of oldSubjects) {
          const { data: newSubj, error: subjInsertError } = await supabase
            .from('exam_subjects')
            .insert({
              exam_id: newExam.id,
              subject_name: subj.subject_name,
              question_count: subj.question_count,
              sort_order: subj.sort_order
            })
            .select()
            .single();
          
          if (subjInsertError || !newSubj) throw subjInsertError || new Error('Failed to copy subject');
          oldToNewSubjectMap[subj.id] = newSubj.id;
        }
      }

      // 4. Fetch old questions
      const { data: oldQuestions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', paramsId);

      if (questionsError) throw questionsError;

      // 5. Insert new questions
      if (oldQuestions && oldQuestions.length > 0) {
        const questionsToInsert = oldQuestions.map(q => ({
          exam_id: newExam.id,
          school_id: exam.school_id,
          exam_subject_id: q.exam_subject_id ? oldToNewSubjectMap[q.exam_subject_id] : null,
          question_text: q.question_text,
          image_url: q.image_url,
          question_type: q.question_type,
          options: q.options,
          correct_option: q.correct_option,
          positive_marks: q.positive_marks,
          negative_marks: q.negative_marks,
          question_number: q.question_number,
          marks: q.marks
        }));

        const { error: batchInsertError } = await supabase
          .from('questions')
          .insert(questionsToInsert);
        
        if (batchInsertError) throw batchInsertError;
      }

      // Redirect to the new exam page
      window.location.href = `/exams/${newExam.id}`;

    } catch (err: any) {
      alert('Failed to duplicate exam: ' + err.message);
      console.error(err);
      setLoading(false);
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

      if (data.teacher) {
        setTeachers(prev => [...prev, data.teacher].sort((a, b) => a.full_name.localeCompare(b.full_name)));
        setSelectedTeacherIds(prev => [...prev, data.teacher.id]);
      }

      if (data.teacher && manageTeachersSubject) {
        const { data: insertedAssignment, error: assignError } = await supabase
          .from('exam_subject_teachers')
          .insert({
            exam_subject_id: manageTeachersSubject.id,
            teacher_id: data.teacher.id
          })
          .select()
          .single();

        if (assignError) throw new Error(assignError.message || 'Teacher was created, but failed to assign to this subject.');

        setSubjects(prev => prev.map(s =>
          s.id === manageTeachersSubject.id
            ? { ...s, exam_subject_teachers: [...(s.exam_subject_teachers || []), { id: insertedAssignment.id, teacher_id: data.teacher.id, teachers: data.teacher }] }
            : s
        ));
      }

      setManageTeachersSubject(null);
      setShowAddTeacherMode(false);
      setNewTeacherName('');
      setNewTeacherEmail('');
      setNewTeacherPassword('');
      setNewTeacherDepartment('');
      setAddTeacherError('');

      const { data: updatedTeachers } = await supabase
        .from('teachers')
        .select('*')
        .eq('school_id', schoolIdToUse)
        .order('full_name', { ascending: true });
      if (updatedTeachers) {
        setTeachers(updatedTeachers);
      }
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
        setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
        setPublishing(true);
        const updates = { status: 'draft', start_time: null, end_time: null };
        const { error } = await supabase.from('exams').update(updates).eq('id', paramsId);
        if (!error) {
          setExam({ ...exam, ...updates });
          window.dispatchEvent(new CustomEvent('exam-status-update', { detail: { status: 'draft' } }));
        }
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
        setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
        const { error } = await supabase.from('exams').update({ is_trashed: true }).eq('id', paramsId);
        if (!error) window.location.href = '/exams';
        else alert('Failed to move exam to trash.');
      }
    });
  };

  const totalQuestionsNeeded = subjects.reduce((acc, s) => acc + s.question_count, 0);
  const totalQuestionsAdded = Object.values(questionCounts).reduce((a, b) => a + b, 0);
  const allQuestionsReady = subjects.every(s => (questionCounts[s.id] || 0) >= s.question_count);
  const stepsBeforeScheduleComplete = canProceedToNextStep(1) && canProceedToNextStep(2) && canProceedToNextStep(3);
  const allStepsComplete = canProceedToNextStep(1) && canProceedToNextStep(2) && canProceedToNextStep(3) && canProceedToNextStep(4);
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

      const { data: qs } = await supabase.from('questions').select('positive_marks').eq('exam_id', paramsId);
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
        const isExamOver = exam?.end_time && exam?.status !== 'draft' ? new Date(exam.end_time) < new Date() : false;
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

  return {
    supabase,
    exam,
    setExam,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    subjects,
    setSubjects,
    questionCounts,
    setQuestionCounts,
    assignedStudents,
    setAssignedStudents,
    loading,
    setLoading,
    publishing,
    setPublishing,
    savingExam,
    setSavingExam,
    saveStatus,
    setSaveStatus,
    currentStep,
    setCurrentStep,
    examFee,
    setExamFee,
    title,
    setTitle,
    description,
    setDescription,
    durationMinutes,
    setDurationMinutes,
    mcqCorrect,
    setMcqCorrect,
    mcqWrong,
    setMcqWrong,
    natCorrect,
    setNatCorrect,
    natWrong,
    setNatWrong,
    role,
    setRole,
    userId,
    setUserId,
    editDurationMode,
    setEditDurationMode,
    inlineEditDuration,
    setInlineEditDuration,
    editSubjectId,
    setEditSubjectId,
    inlineEditSubjectCount,
    setInlineEditSubjectCount,
    assignedSearchQuery,
    setAssignedSearchQuery,
    showAddStudentModal,
    setShowAddStudentModal,
    addingStudent,
    setAddingStudent,
    addError,
    setAddError,
    addSuccess,
    setAddSuccess,
    newName,
    setNewName,
    newRoll,
    setNewRoll,
    newDob,
    setNewDob,
    newCourse,
    setNewCourse,
    newBatch,
    setNewBatch,
    newSession,
    setNewSession,
    linkCourse,
    setLinkCourse,
    linkBatch,
    setLinkBatch,
    linkSession,
    setLinkSession,
    schoolStudents,
    setSchoolStudents,
    searchQuery,
    setSearchQuery,
    addMode,
    setAddMode,
    csvFile,
    setCsvFile,
    linkCopied,
    setLinkCopied,
    filterCourse,
    setFilterCourse,
    filterBatch,
    setFilterBatch,
    filterSession,
    setFilterSession,
    assignedBatchFilter,
    setAssignedBatchFilter,
    assignedCourseFilter,
    setAssignedCourseFilter,
    selectedStudents,
    setSelectedStudents,
    bulkAssigning,
    setBulkAssigning,
    teachers,
    setTeachers,
    templates,
    setTemplates,
    templatesLoading,
    setTemplatesLoading,
    applyingTemplate,
    setApplyingTemplate,
    showAddSubjectModal,
    setShowAddSubjectModal,
    newSubjectTeacherSearch,
    setNewSubjectTeacherSearch,
    showMoreMenu,
    setShowMoreMenu,
    moreMenuRef,
    manageTeachersSubject,
    setManageTeachersSubject,
    selectedTeacherIds,
    setSelectedTeacherIds,
    showAddTeacherMode,
    setShowAddTeacherMode,
    newTeacherName,
    setNewTeacherName,
    newTeacherEmail,
    setNewTeacherEmail,
    newTeacherPassword,
    setNewTeacherPassword,
    newTeacherDepartment,
    setNewTeacherDepartment,
    addingTeacher,
    setAddingTeacher,
    addTeacherError,
    setAddTeacherError,
    teacherSearchQuery,
    setTeacherSearchQuery,
    showInstructionPreview,
    setShowInstructionPreview,
    instructionsList,
    setInstructionsList,
    editInstructionsMode,
    setEditInstructionsMode,
    drawerSubjectId,
    setDrawerSubjectId,
    drawerView,
    setDrawerView,
    drawerQuestions,
    setDrawerQuestions,
    drawerLoading,
    setDrawerLoading,
    drawerFormLoading,
    setDrawerFormLoading,
    drawerError,
    setDrawerError,
    editingQuestionId,
    setEditingQuestionId,
    qType,
    setQType,
    qText,
    setQText,
    qImage,
    setQImage,
    rawImageToCrop,
    setRawImageToCrop,
    cropTarget,
    setCropTarget,
    crop,
    setCrop,
    completedCrop,
    setCompletedCrop,
    imageRef,
    setImageRef,
    optA,
    setOptA,
    optAImg,
    setOptAImg,
    optB,
    setOptB,
    optBImg,
    setOptBImg,
    optC,
    setOptC,
    optCImg,
    setOptCImg,
    optD,
    setOptD,
    optDImg,
    setOptDImg,
    correctAnswer,
    setCorrectAnswer,
    natAnswer,
    setNatAnswer,
    generatingPDF,
    setGeneratingPDF,
    newSubject,
    setNewSubject,
    confirmDialog,
    setConfirmDialog,
    handleSetStep,
    openManageQuestions,
    fetchDrawerQuestions,
    handleDrawerNewQuestion,
    handleDrawerCancel,
    doSaveQuestion,
    handleDrawerEditQuestion,
    handleDrawerDeleteQuestion,
    handleDrawerImageUpload,
    handleCropAndSave,
    canProceedToNextStep,
    autoSaveExamDetails,
    autoSaveSchedule,
    handleSaveExamDetails,
    handleTemplateApply,
    addInstructionItem,
    removeInstructionItem,
    updateInstructionItem,
    downloadQuestionPaper,
    fetchExamData,
    handlePublish,
    handlePayment,
    handleTogglePaid,
    formatDobPassword,
    handleSaveDuration,
    handleSaveSubjectCount,
    handleDeleteSubject,
    handleSaveSubjectTeachers,
    handleAddSubject,
    toggleNewSubjectTeacher,
    handleAssignExisting,
    handleBulkAssign,
    handleAddStudent,
    handleCsvImport,
    handleDownloadCsvTemplate,
    handleRemoveStudent,
    handleDuplicate,
    handleCreateAndAssignTeacher,
    handleUnpublish,
    handleTrash,
    totalQuestionsNeeded,
    totalQuestionsAdded,
    allQuestionsReady,
    stepsBeforeScheduleComplete,
    allStepsComplete,
    availableStudents,
    uniqueCourses,
    uniqueBatches,
    uniqueSessions,
    filteredStudents,
    uniqueAssignedBatches,
    uniqueAssignedCourses,
    filteredAssignedStudents,
    downloadResultsPDF,
    linkGenerated,
    setLinkGenerated,
  };
}