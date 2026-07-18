'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function QuestionsPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const activeSubjectId = searchParams.get('subject');
  const supabase = createClient();

  const [exam, setExam] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(activeSubjectId);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmColor: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
    onConfirm: () => {}
  });

  // Question form
  const [questionType, setQuestionType] = useState<'mcq' | 'nat'>('mcq');
  const [questionText, setQuestionText] = useState('');
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  
  // Crop states
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'question' | 'A' | 'B' | 'C' | 'D' | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<any>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  
  const [optionA, setOptionA] = useState('');
  const [optionAImage, setOptionAImage] = useState<string | null>(null);
  const [optionB, setOptionB] = useState('');
  const [optionBImage, setOptionBImage] = useState<string | null>(null);
  const [optionC, setOptionC] = useState('');
  const [optionCImage, setOptionCImage] = useState<string | null>(null);
  const [optionD, setOptionD] = useState('');
  const [optionDImage, setOptionDImage] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [natAnswer, setNatAnswer] = useState('');

  useEffect(() => { init(); }, []);
  useEffect(() => { if (selectedSubject) fetchQuestions(); }, [selectedSubject]);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    let currentRole = user.user_metadata?.role;
    if (!currentRole) {
       const { data: teacherProfile } = await supabase.from('teachers').select('id').eq('id', user.id).single();
       if (teacherProfile) currentRole = 'teacher';
       else currentRole = 'school_admin';
    }

    const { data: examData } = await supabase.from('exams').select('*').eq('id', params.id).single();
    setExam(examData);

    const { data: subjectsData } = await supabase
      .from('exam_subjects')
      .select('*, exam_subject_teachers(teacher_id)')
      .eq('exam_id', params.id)
      .order('sort_order');
      
    let allowedSubjects = subjectsData || [];
    if (currentRole === 'teacher') {
       allowedSubjects = allowedSubjects.filter(s => s.exam_subject_teachers?.some((est: any) => est.teacher_id === user.id));
    }
    
    setUserRole(currentRole);
    setSubjects(allowedSubjects);

    if (!selectedSubject && allowedSubjects.length > 0) {
      setSelectedSubject(allowedSubjects[0].id);
    } else if (selectedSubject && !allowedSubjects.some(s => s.id === selectedSubject)) {
      setSelectedSubject(allowedSubjects.length > 0 ? allowedSubjects[0].id : null);
    }
    setLoading(false);
  };

  const fetchQuestions = async () => {
    if (!selectedSubject) return;
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_subject_id', selectedSubject)
      .order('question_number', { ascending: true });
    setQuestions(data || []);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      if (!exam || !selectedSubject) throw new Error('Missing exam or subject');
      if (!questionText.trim() && !questionImage) throw new Error('Please provide question text or an image.');
      
      const subjectDef = subjects.find(s => s.id === selectedSubject);
      if (!editingQuestionId && subjectDef && questions.length >= subjectDef.question_count) {
        throw new Error(`Maximum question limit (${subjectDef.question_count}) reached for this subject.`);
      }

      const questionNumber = questions.length + 1;
      const markingScheme = exam.marking_scheme || {};

      const questionData: any = {
        exam_id: params.id,
        school_id: exam.school_id,
        exam_subject_id: selectedSubject,
        question_type: questionType,
        question_text: questionText,
        question_number: questionNumber,
        image_url: questionImage,
        marks: questionType === 'mcq' ? (markingScheme.mcq_correct || 4) : (markingScheme.nat_correct || 4),
        positive_marks: questionType === 'mcq' ? (markingScheme.mcq_correct || 4) : (markingScheme.nat_correct || 4),
        negative_marks: questionType === 'mcq' ? (markingScheme.mcq_wrong || -1) : (markingScheme.nat_wrong || 0),
      };

      if (questionType === 'mcq') {
        questionData.options = { 
          A: optionA, A_image: optionAImage,
          B: optionB, B_image: optionBImage,
          C: optionC, C_image: optionCImage,
          D: optionD, D_image: optionDImage 
        };
        questionData.correct_option = correctAnswer;
      } else {
        questionData.options = {};
        questionData.correct_option = natAnswer;
      }

      if (editingQuestionId) {
        // Update existing question
        const { error: updateError } = await supabase.from('questions').update(questionData).eq('id', editingQuestionId);
        if (updateError) throw updateError;
      } else {
        // Insert new question
        const { error: insertError } = await supabase.from('questions').insert(questionData);
        if (insertError) throw insertError;
      }

      // Reset form
      setQuestionText(''); setQuestionImage(null); 
      setOptionA(''); setOptionAImage(null);
      setOptionB(''); setOptionBImage(null);
      setOptionC(''); setOptionCImage(null);
      setOptionD(''); setOptionDImage(null);
      setCorrectAnswer('A'); setNatAnswer(''); setShowForm(false); setEditingQuestionId(null);
      fetchQuestions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'question' | 'A' | 'B' | 'C' | 'D') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCropTarget(target);
      setRawImageToCrop(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleCropAndSave = () => {
    if (!completedCrop || !imageRef || !completedCrop.width || !completedCrop.height) {
      // If no crop was drawn, just take the whole image
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

    // Apply max width 800px constraint
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
      ctx.drawImage(
        imageRef,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        cropWidth,
        cropHeight,
        0,
        0,
        finalWidth,
        finalHeight
      );
      // Compress to JPEG with 0.6 quality
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      if (cropTarget === 'question') setQuestionImage(dataUrl);
      else if (cropTarget === 'A') setOptionAImage(dataUrl);
      else if (cropTarget === 'B') setOptionBImage(dataUrl);
      else if (cropTarget === 'C') setOptionCImage(dataUrl);
      else if (cropTarget === 'D') setOptionDImage(dataUrl);
    }
    setRawImageToCrop(null);
    setCropTarget(null);
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const handleDeleteQuestion = async (qId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question? This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        await supabase.from('questions').delete().eq('id', qId);
        fetchQuestions();
      }
    });
  };

  const handleEditQuestion = (q: any) => {
    setEditingQuestionId(q.id);
    setQuestionType(q.question_type);
    setQuestionText(q.question_text || '');
    setQuestionImage(q.image_url || null);
    if (q.question_type === 'mcq') {
      setOptionA(q.options?.A || '');
      setOptionAImage(q.options?.A_image || null);
      setOptionB(q.options?.B || '');
      setOptionBImage(q.options?.B_image || null);
      setOptionC(q.options?.C || '');
      setOptionCImage(q.options?.C_image || null);
      setOptionD(q.options?.D || '');
      setOptionDImage(q.options?.D_image || null);
      setCorrectAnswer(q.correct_option || 'A');
      setNatAnswer('');
    } else {
      setNatAnswer(q.correct_option || '');
    }
    setShowForm(true);
  };

  const currentSubject = subjects.find(s => s.id === selectedSubject);

  if (loading) return (
    <div className="animate-pulse max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="w-24 h-4 bg-surface-hover rounded mb-4"></div>
        <div className="w-64 h-8 bg-border rounded"></div>
      </div>
      <div className="flex gap-2 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-24 h-10 bg-surface-hover rounded-xl"></div>
        ))}
      </div>
      <div className="bg-bg border border-border rounded-xl p-4 mb-6 flex justify-between items-center">
        <div className="w-48 h-5 bg-border rounded"></div>
        <div className="w-32 h-9 bg-surface-hover rounded-xl"></div>
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between mb-4">
              <div className="w-32 h-6 bg-surface-hover rounded"></div>
              <div className="w-12 h-4 bg-surface-hover rounded"></div>
            </div>
            <div className="w-full h-4 bg-border rounded mb-2"></div>
            <div className="w-3/4 h-4 bg-border rounded mb-4"></div>
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-10 bg-surface-hover rounded-lg"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <Link href={userRole === 'teacher' ? '/exams' : `/exams/${params.id}?step=2`} className="inline-flex items-center gap-1.5 text-text-muted hover:text-accent-primary text-sm font-bold uppercase tracking-wider transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          {userRole === 'teacher' ? 'Back to Dashboard' : 'Back to Exam'}
        </Link>
        <h2 className="text-2xl font-bold text-text-main">{exam?.title} — Questions</h2>
      </div>

      {/* Subject Tabs */}
      {userRole !== 'teacher' && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
          {subjects.map((s) => (
            <button key={s.id} onClick={() => setSelectedSubject(s.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                selectedSubject === s.id
                  ? 'bg-accent-primary text-white border-transparent'
                  : 'bg-surface text-text-muted border border-border hover:border-accent-primary hover:text-accent-primary'
              }`}>
              {s.subject_name}
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      {currentSubject && (
        <div className="bg-bg border border-border rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-text-main font-bold text-lg">{currentSubject.subject_name}</span>
            <span className={`ml-3 inline-flex px-2.5 py-1 text-xs font-bold rounded-full border ${questions.length >= currentSubject.question_count ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
              {questions.length} / {currentSubject.question_count} questions
            </span>
          </div>
          {exam?.status === 'draft' && questions.length < currentSubject.question_count && (
            <button onClick={() => { 
              setEditingQuestionId(null); setQuestionText(''); setQuestionImage(null); 
              setOptionA(''); setOptionAImage(null);
              setOptionB(''); setOptionBImage(null);
              setOptionC(''); setOptionCImage(null);
              setOptionD(''); setOptionDImage(null);
              setCorrectAnswer('A'); setNatAnswer(''); setShowForm(true); 
            }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-accent-primary text-white font-semibold rounded-xl text-sm hover:bg-accent-primary/80 transition-all shadow-sm active:scale-95">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add Question
            </button>
          )}
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4 mb-8">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-surface border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-bg border border-border flex items-center justify-center text-sm text-accent-primary font-bold">{idx + 1}</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${q.question_type === 'mcq' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                  {q.question_type}
                </span>
                <span className="text-[10px] font-bold text-text-muted border border-border px-2.5 py-1 rounded-full bg-bg">+{q.positive_marks} / {q.negative_marks}</span>
              </div>
              {exam?.status === 'draft' && (
                <div className="flex items-center gap-3">
                  <button onClick={() => handleEditQuestion(q)} className="text-accent-primary hover:text-accent-primary/80 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors">Edit</button>
                  <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Delete</button>
                </div>
              )}
            </div>
            {q.question_text && <p className="text-text-main font-medium mb-4">{q.question_text}</p>}
             {(() => {
              if (!q.image_url) return null;
              const parseQuestionImages = (urlStr: string | null): string[] => {
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
              const images = parseQuestionImages(q.image_url);
              if (images.length === 0) return null;
              return (
                <div className="mb-5 flex flex-wrap gap-3">
                  {images.map((url, idx) => (
                    <img key={idx} src={url} alt={`Question ${idx + 1}`} className="max-w-full max-h-40 object-contain rounded-lg border border-border" />
                  ))}
                </div>
              );
            })()}
            {q.question_type === 'mcq' && q.options && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div key={opt} className={`p-4 rounded-xl text-sm border-2 transition-colors ${q.correct_option === opt ? 'bg-accent-primary/5 border-accent-primary text-accent-primary font-bold' : 'bg-bg text-text-muted border-border font-medium'}`}>
                    <div className="flex items-start">
                      <span className={`mr-2 mt-0.5 ${q.correct_option === opt ? 'text-accent-primary' : 'text-text-muted font-bold'}`}>{opt}.</span>
                      <div className="flex flex-col gap-3">
                        {q.options[opt] && <span>{q.options[opt]}</span>}
                        {q.options[`${opt}_image`] && (
                          <img src={q.options[`${opt}_image`]} alt={`Option ${opt}`} className="max-w-[150px] max-h-[150px] object-contain rounded-lg border border-border" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {q.question_type === 'nat' && (
              <div className="inline-flex px-4 py-2 bg-accent-primary/5 border border-accent-primary rounded-xl text-sm text-accent-primary font-bold mt-2">Answer: {q.correct_option}</div>
            )}
          </div>
        ))}
      </div>

      {/* Completion CTA */}
      {currentSubject && questions.length >= currentSubject.question_count && (
        <div className="flex justify-center mt-8 mb-12">
          <Link href={userRole === 'teacher' ? '/exams' : `/exams/${params.id}?step=2`} className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-white font-bold rounded-xl shadow-lg shadow-accent-primary/30 hover:bg-accent-primary/80 hover:-translate-y-0.5 transition-all text-sm">
            <CheckCircle2 size={18} />
            Submit Questions
          </Link>
        </div>
      )}

      {/* Add/Edit Question Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-accent-primary px-6 py-4 flex items-center justify-between">
              <span className="text-white font-bold">{editingQuestionId ? 'Edit Question' : 'Add Question'} — {currentSubject?.subject_name}</span>
              <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <form onSubmit={handleAddQuestion} className="space-y-6">
                {/* Question Type */}
                <div className="flex bg-bg rounded-xl p-1 border border-border">
                  <button type="button" onClick={() => setQuestionType('mcq')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${questionType === 'mcq' ? 'bg-surface text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
                    MCQ (Multiple Choice)
                  </button>
                  <button type="button" onClick={() => setQuestionType('nat')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${questionType === 'nat' ? 'bg-surface text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
                    NAT (Numerical)
                  </button>
                </div>

                {/* Question Text and Image */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-main mb-1.5 uppercase tracking-wider">Question Text (Optional if image provided)</label>
                    <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3}
                      className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all resize-none text-sm font-medium"
                      placeholder="Enter question text..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-main mb-1.5 uppercase tracking-wider">Add Image (Optional)</label>
                    <div className="flex items-center gap-4">
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'question')} className="hidden" id="image-upload" />
                      <label htmlFor="image-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-bg border border-border text-accent-primary font-semibold text-sm rounded-xl hover:bg-surface-hover transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Upload Image
                      </label>
                      {questionImage && (
                        <div className="relative group">
                          <img src={questionImage} alt="Preview" className="h-16 rounded border border-border object-contain" />
                          <button type="button" onClick={() => setQuestionImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">✕</button>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-text-muted mt-1 font-medium">Image will be automatically resized and compressed to save space.</p>
                  </div>
                </div>

                {/* Cropping Modal Overlay inside Form */}
                {rawImageToCrop && (
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-[60] p-4 animate-in fade-in">
                    <div className="bg-surface rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                      <div className="bg-accent-primary px-6 py-4 flex items-center justify-between">
                        <span className="text-white font-bold">Crop Image</span>
                        <button type="button" onClick={() => setRawImageToCrop(null)} className="text-white/70 hover:text-white transition-colors">✕</button>
                      </div>
                      <div className="p-6 flex-1 overflow-auto bg-bg flex justify-center items-center">
                        <ReactCrop
                          crop={crop}
                          onChange={(c) => setCrop(c)}
                          onComplete={(c) => setCompletedCrop(c)}
                          className="max-h-full"
                        >
                          <img
                            src={rawImageToCrop}
                            onLoad={(e) => setImageRef(e.currentTarget)}
                            alt="Crop preview"
                            className="max-h-[60vh] object-contain"
                          />
                        </ReactCrop>
                      </div>
                      <div className="p-6 border-t border-border bg-surface flex justify-end gap-3">
                        <button type="button" onClick={() => setRawImageToCrop(null)}
                          className="px-5 py-2.5 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-surface-hover text-sm transition-colors">
                          Cancel
                        </button>
                        <button type="button" onClick={handleCropAndSave}
                          className="px-5 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm">
                          Crop & Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {questionType === 'mcq' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Option A', val: optionA, setVal: setOptionA, img: optionAImage, setImg: setOptionAImage, id: 'A' }, 
                        { label: 'Option B', val: optionB, setVal: setOptionB, img: optionBImage, setImg: setOptionBImage, id: 'B' }, 
                        { label: 'Option C', val: optionC, setVal: setOptionC, img: optionCImage, setImg: setOptionCImage, id: 'C' }, 
                        { label: 'Option D', val: optionD, setVal: setOptionD, img: optionDImage, setImg: setOptionDImage, id: 'D' }
                      ].map((opt) => (
                        <div key={opt.label} className="bg-bg p-4 rounded-xl border border-border">
                          <label className="block text-xs font-semibold text-text-muted mb-2">{opt.label}</label>
                          <input type="text" value={opt.val} onChange={(e) => opt.setVal(e.target.value)} placeholder="Option text (optional if image)"
                            className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all text-sm font-medium mb-3" />
                          
                          <div className="flex items-center gap-3">
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, opt.id as any)} className="hidden" id={`image-upload-${opt.id}`} />
                            <label htmlFor={`image-upload-${opt.id}`} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border text-accent-primary font-semibold text-xs rounded-lg hover:bg-surface-hover transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              Add Image
                            </label>
                            {opt.img && (
                              <div className="relative group">
                                <img src={opt.img} alt="Preview" className="h-8 rounded border border-border object-contain" />
                                <button type="button" onClick={() => opt.setImg(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">✕</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-main mb-2 uppercase tracking-wider">Correct Answer</label>
                      <div className="flex gap-3">
                        {['A', 'B', 'C', 'D'].map((opt) => (
                          <button key={opt} type="button" onClick={() => setCorrectAnswer(opt)}
                            className={`w-12 h-12 rounded-xl text-sm font-bold border-2 transition-all ${correctAnswer === opt ? 'bg-accent-primary border-accent-primary text-white shadow-md' : 'bg-bg border-border text-text-muted hover:border-accent-primary hover:text-accent-primary'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-text-main mb-1.5 uppercase tracking-wider">Correct Numerical Answer</label>
                    <input type="text" value={natAnswer} onChange={(e) => setNatAnswer(e.target.value)} required
                      className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all text-sm font-medium"
                      placeholder="e.g. 42.5" />
                  </div>
                )}

                {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 rounded-xl p-3 text-red-600 text-sm font-semibold">{error}</div>}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-3 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-surface-hover text-sm transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={formLoading}
                    className="flex-1 py-3 bg-accent-primary hover:bg-accent-primary/80 text-white font-semibold rounded-xl disabled:opacity-50 text-sm transition-colors shadow-sm">
                    {formLoading ? 'Saving...' : (editingQuestionId ? 'Update Question' : 'Add Question')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">{confirmDialog.title}</h3>
              <p className="text-text-muted text-sm font-medium mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-surface-hover text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  className={`flex-1 py-3 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm ${confirmDialog.confirmColor}`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
