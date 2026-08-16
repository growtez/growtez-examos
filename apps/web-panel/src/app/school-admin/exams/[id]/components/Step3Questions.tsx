import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Edit2, Trash2, Search, AlertCircle, Sigma, Plus, ArrowUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import FormulaToolbar from '@/components/FormulaToolbar';
import MathRenderer from '@/components/MathRenderer';
import { parseQuestionImages } from '../hooks/useExamDetailPage';

interface Step3QuestionsProps {
  role: string;
  userId: string;
  isExamOver: boolean;
  exam: any;
  subjects: any[];
  questionCounts: Record<string, number>;
  drawerSubjectId: string | null;
  drawerView: 'list' | 'editor';
  setDrawerView: (val: 'list' | 'editor') => void;
  drawerQuestions: any[];
  drawerLoading: boolean;
  drawerFormLoading: boolean;
  drawerError: string;
  editingQuestionId: string | null;
  msqEnabled?: boolean;
  qType: 'mcq' | 'msq' | 'nat';
  setQType: (val: 'mcq' | 'msq' | 'nat') => void;
  qText: string;
  setQText: (val: string) => void;
  qImage: string | null;
  setQImage: (val: string | null) => void;
  qExplanation?: string;
  setQExplanation?: (val: string) => void;
  qExplanationImg?: string | null;
  setQExplanationImg?: (val: string | null) => void;
  optA: string;
  setOptA: (val: string) => void;
  optAImg: string | null;
  setOptAImg: (val: string | null) => void;
  optB: string;
  setOptB: (val: string) => void;
  optBImg: string | null;
  setOptBImg: (val: string | null) => void;
  optC: string;
  setOptC: (val: string) => void;
  optCImg: string | null;
  setOptCImg: (val: string | null) => void;
  optD: string;
  setOptD: (val: string) => void;
  optDImg: string | null;
  setOptDImg: (val: string | null) => void;
  correctAnswer: string;
  setCorrectAnswer: (val: string) => void;
  natAnswer: string;
  setNatAnswer: (val: string) => void;

  openManageQuestions: (subjectId: string) => void;
  handleDrawerNewQuestion: () => void;
  handleDrawerCancel: () => void;
  doSaveQuestion: (e: any, addAnother: boolean) => any;
  handleDrawerEditQuestion: (q: any) => void;
  handleDrawerDeleteQuestion: (qId: string) => void;
  handleDrawerImageUpload: (e: React.ChangeEvent<HTMLInputElement>, target: 'question' | 'A' | 'B' | 'C' | 'D' | 'explanation') => void;

  setShowAddSubjectModal: (val: boolean) => void;
  setNewSubjectTeacherSearch: (val: string) => void;
  editSubjectId: string | null;
  setEditSubjectId: (val: string | null) => void;
  inlineEditSubjectCount: number;
  setInlineEditSubjectCount: (val: number) => void;
  handleSaveSubjectCount: (subjectId: string) => void;
  handleDeleteSubject: (e: any, id: string, name: string) => void;
  setManageTeachersSubject: (subject: any) => void;
  setSelectedTeacherIds: (ids: string[]) => void;
  setTeacherSearchQuery: (query: string) => void;
  searchQuery: string;
  typeFilter: string;
  onClearForm?: () => void;
  setConfirmDialog?: (val: any) => void;
}

export default function Step3Questions({
  role,
  userId,
  isExamOver,
  exam,
  subjects,
  questionCounts,
  drawerSubjectId,
  drawerView,
  setDrawerView,
  drawerQuestions,
  drawerLoading,
  drawerFormLoading,
  drawerError,
  editingQuestionId,
  msqEnabled,
  qType,
  setQType,
  qText,
  setQText,
  qImage,
  setQImage,
  qExplanation = '',
  setQExplanation = () => { },
  qExplanationImg = null,
  setQExplanationImg = () => { },
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
  openManageQuestions,
  handleDrawerNewQuestion,
  handleDrawerCancel,
  doSaveQuestion,
  handleDrawerEditQuestion,
  handleDrawerDeleteQuestion,
  handleDrawerImageUpload,
  setShowAddSubjectModal,
  setNewSubjectTeacherSearch,
  editSubjectId,
  setEditSubjectId,
  inlineEditSubjectCount,
  setInlineEditSubjectCount,
  handleSaveSubjectCount,
  handleDeleteSubject,
  setManageTeachersSubject,
  setSelectedTeacherIds,
  setTeacherSearchQuery,
  searchQuery,
  typeFilter,
  onClearForm,
  setConfirmDialog,
}: Step3QuestionsProps) {

  const isDraftStepperMode = role !== 'teacher' && exam?.status === 'draft';
  const [showQuestionPreview, setShowQuestionPreview] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const mainEl = document.querySelector("main");
      const mainScroll = mainEl ? mainEl.scrollTop : 0;
      setShowTopBtn(scrollY > 150 || mainScroll > 150);
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  // Refs for each textarea to support cursor-position formula insertion
  const qTextRef = useRef<HTMLTextAreaElement>(null);
  const optRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const natRef = useRef<HTMLTextAreaElement>(null);
  const explRef = useRef<HTMLTextAreaElement>(null);

  /** Inserts latex at the cursor position in a textarea and calls the setter */
  const insertAtCursor = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    setter: (val: string) => void,
    current: string,
    latex: string
  ) => {
    const el = ref.current;
    if (!el) {
      setter(current + latex);
      return;
    }
    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const newVal = current.slice(0, start) + latex + current.slice(end);
    setter(newVal);
    // Restore cursor after the inserted text
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + latex.length;
      autoGrow(el);
    });
  };

  const [toast, setToast] = useState<{ msg: string; show: boolean; key: number }>({ msg: '', show: false, key: 0 });
  useEffect(() => {
    if (drawerError) {
      setToast((prev) => ({ msg: drawerError, show: true, key: prev.key + 1 }));
      const hideTimer = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
      return () => clearTimeout(hideTimer);
    }
  }, [drawerError]);

  const [showQFormula, setShowQFormula] = useState(false);
  const [showNatFormula, setShowNatFormula] = useState(false);
  const [showExplFormula, setShowExplFormula] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showOptFormula, setShowOptFormula] = useState<Record<string, boolean>>({
    A: false,
    B: false,
    C: false,
    D: false,
  });

  const [editingQText, setEditingQText] = useState(false);
  const [editingNat, setEditingNat] = useState(false);
  const [editingOpt, setEditingOpt] = useState<Record<string, boolean>>({
    A: false,
    B: false,
    C: false,
    D: false,
  });

  const draftNewQuestionRef = useRef<{
    qType: 'mcq' | 'msq' | 'nat';
    qText: string;
    qImage: string | null;
    qExplanation: string;
    optA: string;
    optAImg: string | null;
    optB: string;
    optBImg: string | null;
    optC: string;
    optCImg: string | null;
    optD: string;
    optDImg: string | null;
    correctAnswer: string;
    natAnswer: string;
  } | null>(null);

  const handleNavPrevQuestion = () => {
    const currentQIndex = editingQuestionId ? drawerQuestions.findIndex(q => q.id === editingQuestionId) : -1;
    if (currentQIndex === -1 && drawerQuestions.length > 0) {
      draftNewQuestionRef.current = {
        qType, qText, qImage, qExplanation: qExplanation || '',
        optA, optAImg, optB, optBImg, optC, optCImg, optD, optDImg,
        correctAnswer, natAnswer
      };
      handleDrawerEditQuestion(drawerQuestions[drawerQuestions.length - 1]);
    } else if (currentQIndex > 0) {
      handleDrawerEditQuestion(drawerQuestions[currentQIndex - 1]);
    }
  };

  const handleNavNextQuestion = () => {
    const currentQIndex = editingQuestionId ? drawerQuestions.findIndex(q => q.id === editingQuestionId) : -1;
    if (currentQIndex >= 0 && currentQIndex < drawerQuestions.length - 1) {
      handleDrawerEditQuestion(drawerQuestions[currentQIndex + 1]);
    } else if (currentQIndex === drawerQuestions.length - 1) {
      if (draftNewQuestionRef.current) {
        const d = draftNewQuestionRef.current;
        handleDrawerNewQuestion();
        setQType(d.qType);
        setQText(d.qText);
        setQImage(d.qImage);
        if (setQExplanation) setQExplanation(d.qExplanation);
        setOptA(d.optA);
        setOptAImg(d.optAImg);
        setOptB(d.optB);
        setOptBImg(d.optBImg);
        setOptC(d.optC);
        setOptCImg(d.optCImg);
        setOptD(d.optD);
        setOptDImg(d.optDImg);
        setCorrectAnswer(d.correctAnswer);
        setNatAnswer(d.natAnswer);
      } else {
        handleDrawerNewQuestion();
      }
    }
  };

  useEffect(() => {
    if (drawerView !== 'editor') {
      setShowQFormula(false);
      setShowNatFormula(false);
      setShowOptFormula({ A: false, B: false, C: false, D: false });
      setEditingQText(false);
      setEditingNat(false);
      setEditingOpt({ A: false, B: false, C: false, D: false });
    }
  }, [drawerView]);

  return (
    <div className="flex flex-col gap-4 mb-4">
      {/* Toast for missing/invalid fields */}
      <div
        key={toast.key}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1200] transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}`}
      >
        <div className="flex items-start gap-2.5 bg-surface border border-red-200 shadow-lg rounded-xl px-4 py-3 max-w-sm">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-text-main leading-snug">{toast.msg}</p>
        </div>
      </div>

      {!isDraftStepperMode && (
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
          {subjects
            .filter((s) => {
              // Teachers only see their assigned subjects
              if (role === 'teacher') {
                return s.exam_subject_teachers?.some((est: any) => est.teacher_id === userId);
              }
              return true;
            })
            .map((s) => {
              const added = questionCounts[s.id] || 0;
              const needed = s.question_count;
              const exact = added === needed;
              const over = added > needed;
              const under = added < needed;
              const isSelected = drawerSubjectId === s.id;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openManageQuestions(s.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${isSelected
                    ? 'bg-accent-primary text-white border-accent-primary shadow-sm'
                    : over
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-surface border-border text-text-main hover:border-accent-primary/50'
                    }`}
                >
                  {s.subject_name}
                  <span className={isSelected ? 'text-white/80' : exact ? 'text-emerald-600' : over ? 'text-amber-600' : 'text-red-500'}>
                    {added}/{needed}{over ? ' ⚠' : ''}
                  </span>
                </button>
              );
            })}
        </div>
      )}

      {/* Subject Header & Add Question for non-stepper mode (teacher view) */}
      {!isDraftStepperMode && drawerSubjectId && (() => {
        const activeSubject = subjects.find(s => s.id === drawerSubjectId);
        const needed = activeSubject?.question_count ?? 0;
        const added = drawerQuestions.length;
        const isExact = added === needed;
        const isOver = added > needed;
        const isExamDraft = exam?.status === 'draft';

        return (
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-text-main">
                  {activeSubject?.subject_name}
                </h3>
                <span className={`text-sm font-semibold px-2.5 py-1 rounded-md ${isExact
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : isOver
                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                    : 'bg-red-50 text-red-500 border border-red-200'
                  }`}>
                  {added}/{needed} Added
                </span>
              </div>

              <div>
                {isOver ? (
                  <span className="text-[13px] font-semibold text-amber-600 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 select-none whitespace-nowrap">
                    ⚠ {added - needed} extra question{added - needed > 1 ? 's' : ''} added
                  </span>
                ) : isExact ? (
                  <span className="text-[13px] font-semibold text-emerald-600 flex items-center gap-1.5 px-3 py-2 rounded-lg select-none whitespace-nowrap">
                    ✓ All questions added
                  </span>
                ) : isExamDraft ? (
                  <button
                    type="button"
                    onClick={handleDrawerNewQuestion}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-accent-primary text-white hover:bg-accent-primary/90 transition-all text-sm font-bold shadow-sm cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <Plus size={16} /> Add Question
                  </button>
                ) : null}
              </div>
            </div>

            {/* Over-quota warning banner */}
            {isOver && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-700">
                    {added - needed} extra question{added - needed > 1 ? 's' : ''} added — target is {needed}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    You can still proceed. The exam will include all {added} questions. To match the target, delete {added - needed} question{added - needed > 1 ? 's' : ''} or go back to Step 1 to update the target count.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })()}


      {/* Questions Area — outer card border/background removed */}
      <div className="flex-1 flex flex-col min-h-[550px]">
        {/* Content Area */}
        {drawerSubjectId ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            <div className="space-y-3">
              {drawerLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-4 bg-surface border border-border rounded-xl shadow-sm animate-pulse">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-5 h-5 rounded bg-border/60" />
                        <span className="h-4 w-14 rounded-full bg-border/60" />
                        <span className="h-3 w-10 rounded bg-border/40" />
                      </div>
                      <div className="h-3 w-4/5 rounded bg-border/50 mb-2" />
                      <div className="h-3 w-3/5 rounded bg-border/40 mb-3" />
                      <div className="flex flex-col gap-2">
                        <div className="h-9 rounded-lg bg-border/30" />
                        <div className="h-9 rounded-lg bg-border/30" />
                        <div className="h-9 rounded-lg bg-border/30" />
                        <div className="h-9 rounded-lg bg-border/30" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : drawerQuestions.length === 0 ? (
                <div className="text-center py-12 bg-surface md:bg-transparent border md:border-0 border-border rounded-xl md:rounded-none shadow-sm md:shadow-none">
                  <BookOpen size={32} className="mx-auto mb-3 text-border" />
                  <p className="text-text-muted font-medium">No questions added yet.</p>
                </div>
              ) : (
                (() => {
                  const filtered = drawerQuestions.filter((q, originalIdx) => {
                    const qNumber = (originalIdx + 1).toString();
                    const matchesSearch = q.question_text?.toLowerCase().includes(searchQuery.toLowerCase()) || qNumber.includes(searchQuery.trim());
                    const matchesType = typeFilter === 'all' || q.question_type === typeFilter;
                    return matchesSearch && matchesType;
                  });
                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 bg-surface border border-border rounded-xl shadow-sm">
                        <Search size={32} className="mx-auto mb-3 text-border animate-pulse" />
                        <p className="text-text-muted font-medium">No questions match your search/filters.</p>
                      </div>
                    );
                  }
                  return filtered.map((q) => {
                    const originalNumber = drawerQuestions.indexOf(q) + 1;
                    return (
                      <div key={q.id} className="p-4 bg-surface border border-border rounded-xl shadow-sm group relative overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <span className="min-w-7 h-7 px-1.5 rounded bg-surface border border-border flex items-center justify-center text-xs text-text-main font-bold shrink-0">{originalNumber}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0 ${q.question_type === 'mcq' ? 'bg-blue-50 text-blue-600 border-blue-200' : q.question_type === 'msq' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                              {q.question_type}
                            </span>
                            <span className="text-[10px] font-bold text-text-muted shrink-0">+{q.positive_marks} / {q.negative_marks}</span>
                          </div>
                          {exam?.status === 'draft' && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => handleDrawerEditQuestion(q)} className="text-accent-primary hover:bg-accent-primary/10 p-1 rounded transition-colors"><Edit2 size={13} /></button>
                              <button onClick={() => handleDrawerDeleteQuestion(q.id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"><Trash2 size={13} /></button>
                            </div>
                          )}
                        </div>
                        <div className="text-text-main text-xs font-semibold mb-1.5 break-words [overflow-wrap:anywhere]">
                          <MathRenderer text={q.question_text ?? ''} />
                        </div>
                        {q.image_url && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {parseQuestionImages(q.image_url).map((url, idx) => (
                              <img key={idx} src={url} alt={`Question ${idx + 1}`} className="max-w-full max-h-[150px] object-contain rounded-lg border border-border" />
                            ))}
                          </div>
                        )}
                        {(q.question_type === 'mcq' || q.question_type === 'msq') && q.options && (
                          <div className="flex flex-col gap-2 mt-2">
                            {['A', 'B', 'C', 'D'].map(opt => {
                              const isCorrect = q.question_type === 'msq'
                                ? (q.correct_option || '').split(',').includes(opt)
                                : q.correct_option === opt;
                              return (
                                <div key={opt} className={`p-3 rounded-lg text-xs border transition-colors flex items-start min-w-0 ${isCorrect ? 'bg-accent-primary/5 border-accent-primary text-accent-primary font-bold' : 'bg-surface text-text-muted border-border font-medium'}`}>
                                  <span className="mr-2 shrink-0">{opt}.</span>
                                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                                    {q.options[opt] && (
                                      <span className="break-words [overflow-wrap:anywhere] inline-block align-middle">
                                        <MathRenderer text={q.options[opt]} inline />
                                      </span>
                                    )}
                                    {q.options[`${opt}_image`] && (
                                      <div className="flex flex-wrap gap-2">
                                        {parseQuestionImages(q.options[`${opt}_image`]).map((url, idx) => (
                                          <img key={idx} src={url} alt={`${opt} ${idx + 1}`} className="max-w-[200px] max-h-[120px] object-contain rounded border border-border" />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {q.question_type === 'nat' && (
                          <div className="inline-flex max-w-full px-3 py-1.5 bg-accent-primary/5 border border-accent-primary rounded-lg text-xs text-accent-primary font-bold mt-2 break-words [overflow-wrap:anywhere]">
                            Answer: <MathRenderer text={q.correct_option ?? ''} className="ml-1" />
                          </div>
                        )}
                        {(q.explanation || q.explanation_image_url) && (
                          <details className="group mt-3 bg-surface border border-border rounded-lg text-xs">
                            <summary className="px-3 py-2 font-bold text-text-main cursor-pointer flex items-center justify-between select-none hover:bg-surface-hover transition-colors [&::-webkit-details-marker]:hidden list-none">
                              <span>Explanation / Solution</span>
                              <ChevronDown size={14} className="transition-transform group-open:rotate-180 text-text-muted shrink-0" />
                            </summary>
                            <div className="px-3 pb-3 pt-1 border-t border-border flex flex-col gap-2">
                              {q.explanation && (
                                <MathRenderer text={q.explanation} className="text-text-main" />
                              )}
                              {q.explanation_image_url && (
                                <div className="flex flex-col gap-2">
                                  {parseQuestionImages(q.explanation_image_url).map((url, idx) => (
                                    <img key={idx} src={url} alt={`Explanation ${idx + 1}`} className="max-w-full max-h-[200px] object-contain rounded border border-border bg-white" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </details>
                        )}
                      </div>
                    )
                  });
                })()
              )}
            </div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-start pt-16 text-text-muted p-4">
            <BookOpen size={36} className="mb-3 text-border" />
            <p className="text-sm font-bold text-text-main mb-1">No Subjects Yet</p>
            <p className="text-xs text-center max-w-sm mb-4">
              Add a subject to start creating questions for this exam.
            </p>
            {exam?.status === 'draft' && (
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-primary text-white font-semibold text-sm rounded-lg hover:bg-accent-primary/90 transition-colors shadow-sm"
              >
                + Add Subject
              </button>
            )}
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-text-muted p-4 bg-surface border border-border rounded-xl shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
              <AlertCircle size={24} className="text-amber-500" />
            </div>
            <p className="text-sm font-bold text-text-main mb-1">No Subjects Added Yet</p>
            <p className="text-xs text-text-muted max-w-sm mb-4">
              Please add at least one subject to this exam first before managing or adding questions.
            </p>
            {setShowAddSubjectModal && (
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-primary text-white text-xs font-bold hover:bg-accent-primary/90 transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <Plus size={14} /> Add Subject Now
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-start pt-16 text-text-muted p-4">
            <BookOpen size={36} className="mb-3 text-border" />
            <p className="text-sm font-bold text-text-main mb-1">Manage Questions</p>
            <p className="text-xs text-center max-w-sm">
              Select a subject from the navigation pills above to view questions.
            </p>
          </div>
        )}
      </div>

      {drawerSubjectId && (
        <>
          <div
            className={`fixed inset-0 bg-bg z-[1000] flex flex-col w-full h-[100dvh] transition-opacity duration-300 ${drawerView === 'editor' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setDrawerView('list');
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full h-full bg-bg flex flex-col transition-all duration-300 ease-out transform ${drawerView === 'editor' ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
              {/* Drawer Header - pinned */}
              <div className="relative px-5 py-3 border-b border-border flex justify-between items-center bg-surface shrink-0">
                <div className="flex items-center gap-3">

                  <div>
                    <h3 className="text-sm font-bold m-0 text-text-main leading-tight">
                      {editingQuestionId ? 'Edit Question' : 'Add New Question'}
                    </h3>
                    <p className="text-[11px] text-text-muted font-medium m-0">
                      {subjects.find(s => s.id === drawerSubjectId)?.subject_name}
                    </p>
                  </div>
                </div>

                {/* Question type toggle - centered horizontally */}
                <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-bg rounded-xl p-1 border border-border shadow-sm">
                  <button type="button" onClick={() => setQType('mcq')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${qType === 'mcq' ? 'bg-accent-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
                    MCQ
                  </button>
                  {msqEnabled && (
                    <button type="button" onClick={() => setQType('msq')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${qType === 'msq' ? 'bg-accent-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
                      MSQ
                    </button>
                  )}
                  <button type="button" onClick={() => setQType('nat')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${qType === 'nat' ? 'bg-accent-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
                    NAT
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Mobile toggle */}
                  <div className="flex sm:hidden bg-bg rounded-xl p-1 border border-border shadow-sm">
                    <button type="button" onClick={() => setQType('mcq')} className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${qType === 'mcq' ? 'bg-accent-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
                      MCQ
                    </button>
                    {msqEnabled && (
                      <button type="button" onClick={() => setQType('msq')} className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${qType === 'msq' ? 'bg-accent-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
                        MSQ
                      </button>
                    )}
                    <button type="button" onClick={() => setQType('nat')} className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${qType === 'nat' ? 'bg-accent-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
                      NAT
                    </button>
                  </div>

                  <button
                    className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted transition-all hover:bg-red-50 hover:border-red-200 hover:text-red-500 cursor-pointer text-sm shrink-0"
                    onClick={handleDrawerCancel}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Drawer Body - scrollable */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 bg-surface">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto items-start">

                  {/* Left Column: Form Fields */}
                  <form id="drawer-question-form" onSubmit={(e) => doSaveQuestion(e, false)} className="space-y-6">
                    {/* Question text + image section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                          <label className="text-[11px] font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">
                            Question <span className="text-accent-primary font-extrabold bg-accent-primary/10 px-1.5 py-0.5 rounded text-[11px]">#{editingQuestionId ? drawerQuestions.findIndex(q => q.id === editingQuestionId) + 1 : drawerQuestions.length + 1}</span>
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="file" accept="image/*" onChange={(e) => handleDrawerImageUpload(e, 'question')} className="hidden" id="q-img" />
                          <label htmlFor="q-img" className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 bg-bg border border-border text-accent-primary font-bold text-[11px] rounded-lg hover:bg-accent-primary/5 hover:border-accent-primary/40 transition-colors">
                            + Image
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowQFormula(!showQFormula)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${showQFormula
                              ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                              : 'bg-bg border-border text-text-muted hover:text-text-main hover:border-accent-primary/30'
                              }`}
                          >
                            <Sigma size={11} />
                            {showQFormula ? 'Hide Formula' : 'Formula'}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {showQFormula && (
                          <FormulaToolbar
                            onInsert={(latex) =>
                              insertAtCursor(qTextRef, setQText, qText, latex)
                            }
                          />
                        )}
                        <textarea
                          ref={(el) => {
                            (qTextRef as any).current = el;
                            autoGrow(el);
                          }}
                          value={qText}
                          onChange={(e) => { setQText(e.target.value); autoGrow(e.target); }}
                          rows={3}
                          className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-text-main placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-accent-primary/15 outline-none resize-y min-h-[90px] text-sm font-medium transition-shadow whitespace-pre-wrap break-words"
                          placeholder="Enter question text... Use \frac{a}{b} for fractions, \sqrt{x} for roots, $\sin(x)$ for math"
                        />
                        {qText && (
                          <div className="lg:hidden px-3 py-2 bg-bg border border-dashed border-border rounded-lg mt-2">
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Live Formula Preview</p>
                            <MathRenderer text={qText} className="text-sm text-text-main" />
                          </div>
                        )}
                      </div>

                      {/* Image Preview List if present */}
                      {(() => {
                        const images = qImage ? parseQuestionImages(qImage) : [];
                        if (images.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-2 items-center pt-1">
                            {images.map((url, idx) => (
                              <div key={idx} className="relative group">
                                <img src={url} alt={`Preview ${idx + 1}`} className="h-14 rounded-lg border border-border object-contain bg-white" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = images.filter((_, i) => i !== idx);
                                    setQImage(updated.length > 0 ? JSON.stringify(updated) : null);
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm cursor-pointer hover:bg-red-600 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {(qType === 'mcq' || qType === 'msq') ? (
                      <>
                        {/* Options section */}
                        <div className="space-y-3 pt-2 border-t border-border">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                            <label className="text-[11px] font-bold text-text-main uppercase tracking-wider">Options</label>
                          </div>
                          <div className="flex flex-col gap-3">
                            {[
                              { label: 'Option A', val: optA, setVal: setOptA, img: optAImg, setImg: setOptAImg, id: 'A' },
                              { label: 'Option B', val: optB, setVal: setOptB, img: optBImg, setImg: setOptBImg, id: 'B' },
                              { label: 'Option C', val: optC, setVal: setOptC, img: optCImg, setImg: setOptCImg, id: 'C' },
                              { label: 'Option D', val: optD, setVal: setOptD, img: optDImg, setImg: setOptDImg, id: 'D' }
                            ].map((opt) => {
                              const isSelectedCorrect = qType === 'msq'
                                ? correctAnswer.split(',').includes(opt.id)
                                : correctAnswer === opt.id;

                              return (
                                <div
                                  key={opt.label}
                                  className={`rounded-lg border transition-colors overflow-hidden flex flex-col ${isSelectedCorrect ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-border'}`}
                                >
                                  <div className="bg-bg px-3 py-1.5 border-b border-border flex items-center justify-between">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-text-muted">
                                      {opt.label}
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <input type="file" accept="image/*" onChange={(e) => handleDrawerImageUpload(e, opt.id as any)} className="hidden" id={`img-${opt.id}`} />
                                      <label htmlFor={`img-${opt.id}`} className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 bg-surface border border-border text-accent-primary font-bold text-[10px] rounded hover:bg-accent-primary/5 hover:border-accent-primary/40 transition-colors">
                                        + Image
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowOptFormula((prev) => ({ ...prev, [opt.id]: !prev[opt.id] }));
                                        }}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded border transition-all cursor-pointer ${showOptFormula[opt.id]
                                          ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                                          : 'bg-surface border-border text-text-muted hover:text-text-main hover:border-accent-primary/30'
                                          }`}
                                      >
                                        <Sigma size={10} />
                                        {showOptFormula[opt.id] ? 'Hide Formula' : 'Formula'}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="bg-surface p-2.5 flex flex-col space-y-2">
                                    {showOptFormula[opt.id] && (
                                      <FormulaToolbar
                                        compact
                                        onInsert={(latex) =>
                                          insertAtCursor(
                                            { current: optRefs.current[opt.id] } as any,
                                            opt.setVal,
                                            opt.val,
                                            latex
                                          )
                                        }
                                      />
                                    )}
                                    <textarea
                                      ref={(el) => { optRefs.current[opt.id] = el; autoGrow(el); }}
                                      rows={2}
                                      value={opt.val}
                                      onChange={(e) => { opt.setVal(e.target.value); autoGrow(e.target); }}
                                      className="w-full bg-bg px-3 py-2 rounded border border-border text-xs text-text-main outline-none focus:border-accent-primary resize-y min-h-[50px] whitespace-pre-wrap break-words placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                                      placeholder={`Type ${opt.label} text or formula...`}
                                    />
                                    {opt.val && (
                                      <div className="lg:hidden pt-2 border-t border-border/50 text-[13px] text-text-main">
                                        <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Live Formula Preview</p>
                                        <MathRenderer text={opt.val} />
                                      </div>
                                    )}

                                    {/* Option Image Preview */}
                                    {(() => {
                                      const images = opt.img ? parseQuestionImages(opt.img) : [];
                                      if (images.length === 0) return null;
                                      return (
                                        <div className="flex flex-wrap gap-2 items-center pt-1">
                                          {images.map((url, idx) => (
                                            <div key={idx} className="relative group">
                                              <img src={url} alt={`Preview ${idx + 1}`} className="h-12 rounded border border-border object-contain bg-white" />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const updated = images.filter((_, i) => i !== idx);
                                                  opt.setImg(updated.length > 0 ? JSON.stringify(updated) : null);
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm cursor-pointer hover:bg-red-600 transition-colors"
                                              >✕</button>
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Correct answer section */}
                        <div className="space-y-2 pt-2 border-t border-border">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                            <label className="text-[11px] font-bold text-text-main uppercase tracking-wider">
                              {qType === 'msq' ? 'Correct Answers (select multiple)' : 'Correct Answer'}
                            </label>
                          </div>
                          <div className="flex gap-2">
                            {['A', 'B', 'C', 'D'].map((opt) => {
                              const isSelected = qType === 'msq'
                                ? correctAnswer.split(',').includes(opt)
                                : correctAnswer === opt;
                              return (
                                <button key={opt} type="button" onClick={() => {
                                  if (qType === 'msq') {
                                    const selected = correctAnswer ? correctAnswer.split(',') : [];
                                    if (selected.includes(opt)) {
                                      setCorrectAnswer(selected.filter(s => s !== opt).join(','));
                                    } else {
                                      setCorrectAnswer([...selected, opt].sort().join(','));
                                    }
                                  } else {
                                    setCorrectAnswer(opt);
                                  }
                                }}
                                  className={`flex-1 h-10 rounded-lg text-sm font-bold border-2 transition-all ${isSelected ? 'bg-accent-primary border-accent-primary text-white shadow-sm' : 'bg-bg border-border text-text-muted hover:border-accent-primary/50 hover:text-accent-primary'}`}>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3 pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                            <label className="text-[11px] font-bold text-text-main uppercase tracking-wider">Correct Numerical Answer</label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={natAnswer}
                            onChange={(e) => {
                              const val = e.target.value;
                              // Allow digits, decimal point, and leading minus
                              if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
                                setNatAnswer(val);
                              }
                            }}
                            onBlur={(e) => setNatAnswer(e.target.value.trim())}
                            required
                            className="w-full px-3 py-2.5 bg-bg border border-accent-primary rounded-lg outline-none focus:ring-2 focus:ring-accent-primary/15 text-sm font-medium transition-shadow placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                            placeholder="e.g. 42.5 or -3"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-text-main uppercase tracking-wider">
                          Explanation / Solution <span className="text-text-muted font-normal lowercase">(optional)</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="file"
                            accept="image/*"
                            id="expl-img-upload"
                            className="hidden"
                            onChange={(e) => handleDrawerImageUpload(e, 'explanation')}
                          />
                          <label
                            htmlFor="expl-img-upload"
                            className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 bg-bg border border-border text-accent-primary font-bold text-[11px] rounded-lg hover:bg-accent-primary/5 hover:border-accent-primary/40 transition-colors"
                          >
                            + Image
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowExplFormula(!showExplFormula)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                              showExplFormula
                                ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                                : 'bg-bg border-border text-text-muted hover:text-text-main hover:border-accent-primary/30'
                            }`}
                          >
                            <Sigma size={11} />
                            Formula
                          </button>
                        </div>
                      </div>
                      {showExplFormula && (
                        <FormulaToolbar
                          onInsert={(latex) =>
                            insertAtCursor(
                              explRef as React.RefObject<HTMLTextAreaElement | null>,
                              (val) => { if (setQExplanation) setQExplanation(val); },
                              qExplanation || '',
                              latex
                            )
                          }
                        />
                      )}
                      <textarea
                        ref={explRef}
                        rows={5}
                        value={qExplanation}
                        onChange={(e) => setQExplanation(e.target.value)}
                        className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all text-xs font-medium resize-y min-h-[150px] placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                        placeholder="Enter explanation or step-by-step solution for students..."
                      />
                      {qExplanation && (
                        <div className="lg:hidden px-3 py-2 bg-bg border border-dashed border-border rounded-lg mt-2">
                          <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Explanation Preview</p>
                          <MathRenderer text={qExplanation} className="text-xs text-text-main" />
                        </div>
                      )}
                      
                      {/* Explanation Image Preview List */}
                      {(() => {
                        const images = qExplanationImg ? parseQuestionImages(qExplanationImg) : [];
                        if (images.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-2 items-center pt-2">
                            {images.map((url, idx) => (
                              <div key={idx} className="relative group">
                                <img src={url} alt={`Explanation Preview ${idx + 1}`} className="h-14 rounded-lg border border-border object-contain bg-white" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = images.filter((_, i) => i !== idx);
                                    if (setQExplanationImg) setQExplanationImg(updated.length > 0 ? JSON.stringify(updated) : null);
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm cursor-pointer hover:bg-red-600 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {drawerError && (
                      <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        {drawerError}
                      </div>
                    )}
                  </form>

                  {/* Right Column: Dedicated Live Preview Panel (Desktop only - Read Only) */}
                  <div className="hidden lg:block lg:sticky lg:top-0 bg-bg/60 border border-border/80 rounded-2xl p-5 shadow-xs space-y-4 pointer-events-none select-none opacity-85">
                    <div className="flex items-center justify-between border-b border-border/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shrink-0" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">Live Question Preview</h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted/70 bg-surface px-2 py-0.5 rounded border border-border/60">
                          Read-Only
                        </span>
                        <span className="text-[10px] font-bold uppercase text-accent-primary bg-accent-primary/10 px-2.5 py-0.5 rounded-full border border-accent-primary/20">
                          {qType.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-text-main leading-relaxed break-words [overflow-wrap:anywhere] min-h-[40px]">
                        {qText ? (
                          <MathRenderer text={qText} />
                        ) : (
                          <span className="text-text-muted/60 italic text-xs">Question text preview will appear here live...</span>
                        )}
                      </div>

                      {/* Question Images */}
                      {(() => {
                        const images = qImage ? parseQuestionImages(qImage) : [];
                        if (images.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {images.map((url, idx) => (
                              <img key={idx} src={url} alt={`Question preview ${idx + 1}`} className="h-24 rounded-lg border border-border object-contain bg-white" />
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Options (MCQ / MSQ) */}
                    {(qType === 'mcq' || qType === 'msq') && (
                      <div className="space-y-2 pt-3 border-t border-border">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Options</p>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { id: 'A', val: optA, img: optAImg },
                            { id: 'B', val: optB, img: optBImg },
                            { id: 'C', val: optC, img: optCImg },
                            { id: 'D', val: optD, img: optDImg },
                          ].map((opt) => {
                            const isCorrect = qType === 'msq'
                              ? correctAnswer.split(',').includes(opt.id)
                              : correctAnswer === opt.id;
                            const optImages = opt.img ? parseQuestionImages(opt.img) : [];

                            return (
                              <div
                                key={opt.id}
                                className={`p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${isCorrect
                                  ? 'bg-emerald-500/15 border-2 border-emerald-500 text-text-main'
                                  : 'bg-surface border-border text-text-main opacity-75'
                                  }`}
                              >
                                <div className="flex items-start gap-2.5 text-xs font-medium">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${isCorrect ? 'bg-emerald-600 text-white shadow-xs' : 'bg-bg border border-border text-text-muted'
                                    }`}>
                                    {opt.id}
                                  </span>
                                  <div className="flex-1 break-words [overflow-wrap:anywhere] font-semibold">
                                    {opt.val ? (
                                      <MathRenderer text={opt.val} />
                                    ) : (
                                      <span className="text-text-muted/60 italic text-xs">Option {opt.id}...</span>
                                    )}
                                  </div>
                                  {isCorrect && (
                                    <span className="text-[10px] font-bold text-white bg-emerald-600 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                      ✓ Correct
                                    </span>
                                  )}
                                </div>
                                {optImages.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pl-7 pt-1">
                                    {optImages.map((url, idx) => (
                                      <img key={idx} src={url} alt={`Opt ${opt.id} preview ${idx + 1}`} className="h-16 rounded border border-border object-contain bg-white" />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* NAT Answer */}
                    {qType === 'nat' && (
                      <div className="pt-3 border-t border-border">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/30 rounded-lg text-xs font-bold text-accent-primary">
                          <span>Correct Answer:</span>
                          <span>{natAnswer || '—'}</span>
                        </div>
                      </div>
                    )}

                    {/* Explanation Preview */}
                    {(qExplanation || qExplanationImg) && (
                      <div className="pt-3 border-t border-border/60">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Explanation / Solution</p>
                        <div className="mt-1">
                          {qExplanation ? (
                            <MathRenderer text={qExplanation} className="text-text-main" />
                          ) : null}
                          
                          {(() => {
                            const images = qExplanationImg ? parseQuestionImages(qExplanationImg) : [];
                            if (images.length === 0) return null;
                            return (
                              <div className="flex flex-col gap-2 mt-2">
                                {images.map((url, idx) => (
                                  <img key={idx} src={url} alt={`Explanation ${idx + 1}`} className="max-w-full rounded border border-border bg-white" />
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer - pinned at bottom */}
              {(() => {
                const currentQIndex = editingQuestionId ? drawerQuestions.findIndex(q => q.id === editingQuestionId) : -1;
                const hasPrevQuestion = currentQIndex > 0 || (currentQIndex === -1 && drawerQuestions.length > 0);
                const hasNextQuestion = currentQIndex >= 0;

                return (
                  <div className="px-5 py-3 border-t border-border bg-surface shrink-0 flex flex-wrap items-center justify-between gap-3">
                    {/* Left side: Previous Question and Next Question */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!hasPrevQuestion}
                        onClick={handleNavPrevQuestion}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-bg border border-border text-text-main font-semibold rounded-lg text-xs hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <ChevronLeft size={15} />
                        Previous Question
                      </button>
                      <button
                        type="button"
                        disabled={!hasNextQuestion}
                        onClick={handleNavNextQuestion}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-bg border border-border text-text-main font-semibold rounded-lg text-xs hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        Next Question
                        <ChevronRight size={15} />
                      </button>
                    </div>

                    {/* Center: Clear Form */}
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        title="Clear all form fields"
                        onClick={() => {
                          if (setConfirmDialog) {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Clear Form',
                              message: 'Are you sure you want to clear all form fields?',
                              confirmText: 'Clear Form',
                              confirmColor: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
                              onConfirm: () => {
                                setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
                                if (onClearForm) onClearForm();
                              }
                            });
                          } else if (onClearForm) {
                            onClearForm();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-bg border border-border text-text-muted text-xs font-semibold hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all cursor-pointer"
                      >
                        Clear Form
                      </button>
                    </div>

                    {/* Right side: Save & Add Next and Save */}
                    <div className="flex items-center gap-2">
                      {!editingQuestionId && drawerQuestions.length < (subjects.find(s => s.id === drawerSubjectId)?.question_count ?? 0) - 1 && (
                        <button
                          type="button"
                          onClick={(e) => doSaveQuestion(e, true)}
                          disabled={drawerFormLoading}
                          className="px-4 py-2 bg-accent-primary/10 text-accent-primary font-semibold rounded-lg text-xs border border-accent-primary/20 hover:bg-accent-primary/20 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          Save & Add Next
                        </button>
                      )}
                      <button
                        type="submit"
                        form="drawer-question-form"
                        disabled={drawerFormLoading}
                        className="px-5 py-2 bg-accent-primary text-white font-semibold rounded-lg text-xs hover:bg-accent-primary/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                      >
                        {drawerFormLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* Question Preview Modal */}
      {showQuestionPreview && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowQuestionPreview(false);
          }}
        >
          <div className="bg-bg rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface shrink-0">
              <h3 className="text-base font-bold text-text-main flex items-center gap-2 m-0 leading-tight">
                <BookOpen size={18} className="text-accent-primary" />
                Question Preview
              </h3>
              <button
                type="button"
                onClick={() => setShowQuestionPreview(false)}
                className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-bg space-y-6">
              <div className="p-4 bg-surface border border-border rounded-xl shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="w-5 h-5 rounded bg-surface border border-border flex items-center justify-center text-[10px] text-text-main font-bold shrink-0">P</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border shrink-0 ${qType === 'mcq' ? 'bg-blue-50 text-blue-600 border-blue-200' : qType === 'msq' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                      {qType}
                    </span>
                    <span className="text-[10px] font-bold text-text-muted shrink-0 ml-1">Preview</span>
                  </div>
                </div>
                <div className="text-text-main text-xs font-semibold mb-1.5 break-words [overflow-wrap:anywhere]">
                  <MathRenderer text={qText || 'No question text provided'} />
                </div>
                {qImage && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <img src={qImage} alt="Question" className="max-w-full max-h-[150px] object-contain rounded-lg border border-border" />
                  </div>
                )}
                {(qType === 'mcq' || qType === 'msq') && (
                  <div className="flex flex-col gap-2 mt-2">
                    {['A', 'B', 'C', 'D'].map(opt => {
                      const text = opt === 'A' ? optA : opt === 'B' ? optB : opt === 'C' ? optC : optD;
                      const img = opt === 'A' ? optAImg : opt === 'B' ? optBImg : opt === 'C' ? optCImg : optDImg;
                      if (!text && !img) return null;
                      const isCorrect = qType === 'msq' ? correctAnswer.split(',').includes(opt) : correctAnswer === opt;
                      return (
                        <div key={opt} className={`p-3 rounded-lg text-xs border transition-colors flex items-start min-w-0 ${isCorrect ? 'bg-accent-primary/5 border-accent-primary text-accent-primary font-bold' : 'bg-surface text-text-muted border-border font-medium'}`}>
                          <span className="mr-2 shrink-0">{opt}.</span>
                          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                            {text && (
                              <span className="break-words [overflow-wrap:anywhere]">
                                <MathRenderer text={text} />
                              </span>
                            )}
                            {img && (
                              <div className="flex flex-wrap gap-2">
                                {parseQuestionImages(img).map((url, idx) => (
                                  <img key={idx} src={url} alt={`${opt} ${idx + 1}`} className="max-w-[200px] max-h-[120px] object-contain rounded border border-border" />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {qType === 'nat' && (
                  <div className="inline-flex max-w-full px-3 py-1.5 bg-accent-primary/5 border border-accent-primary rounded-lg text-xs text-accent-primary font-bold mt-2 break-words [overflow-wrap:anywhere]">
                    Answer: <MathRenderer text={natAnswer || 'No answer provided'} className="ml-1" />
                  </div>
                )}
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-border bg-surface flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowQuestionPreview(false)}
                className="px-6 py-2 bg-bg border border-border text-text-muted font-semibold rounded-lg text-sm hover:bg-surface-hover hover:text-text-main transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Go to Top Button */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-accent-primary text-white rounded-full shadow-lg hover:bg-accent-primary/90 transition-all hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-5 duration-300"
          title="Go to Top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}