import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';
import Calculator from './Calculator';
import Numpad from './Numpad';
import MathRenderer from './MathRenderer';
import parikshaLogo from '../../public/ParikshaOS_logo.png';

// A simple, fast deterministic random number generator
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Simple string hash to generate a numeric seed
function generateSeed(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Parses image_url / option image fields which may be stored as JSON arrays or plain URLs/data-URIs
const parseQuestionImages = (urlStr: string | null | undefined): string[] => {
  if (!urlStr) return [];
  const trimmed = urlStr.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // fall through to single-value return
    }
  }
  return [trimmed];
};

export interface ExamScheme {
  msq_correct?: number;
  msq_wrong?: number;
  msq_partial_enabled?: boolean;
  msq_partial?: number;
}

export function evaluateQuestion(q: any, studentAns: string | undefined | null, examScheme?: ExamScheme): { marksAwarded: number, isCorrect: boolean, isPartialMatch: boolean, hasWrong: boolean } {
  const correctAns = q.correct_option;
  const isAttempted = studentAns !== undefined && studentAns !== null && String(studentAns).trim() !== '';

  let marksAwarded = 0;
  let isPartialMatch = false;
  let isCorrect = false;
  let hasWrong = false;

  const selectedOpts = isAttempted ? String(studentAns).split(',').filter(Boolean).map(s => s.trim().toUpperCase()).sort() : [];
  const correctOpts = (correctAns !== undefined && correctAns !== null && String(correctAns).trim() !== '')
    ? String(correctAns).split(',').filter(Boolean).map(s => s.trim().toUpperCase()).sort()
    : [];

  const maxMarks = q.positive_marks ?? q.marks ?? 1;
  const negMarks = (q.negative_marks !== undefined && q.negative_marks !== null) 
    ? -Math.abs(Number(q.negative_marks)) 
    : (q.question_type === 'mcq' ? -1 : 0);

  if (isAttempted) {
    const isMsq = q.question_type === 'msq' || (correctAns && String(correctAns).includes(','));

    if (isMsq) {
      let correctCount = 0;
      selectedOpts.forEach(opt => {
        if (correctOpts.includes(opt)) correctCount++;
        else hasWrong = true;
      });

      const msqCorrect = (examScheme?.msq_correct !== undefined && examScheme?.msq_correct !== null) 
        ? Number(examScheme.msq_correct) 
        : (maxMarks > 1 ? maxMarks : 4);
      const msqWrong = (examScheme?.msq_wrong !== undefined && examScheme?.msq_wrong !== null)
        ? -Math.abs(Number(examScheme.msq_wrong))
        : ((q.negative_marks !== undefined && q.negative_marks !== null) ? -Math.abs(Number(q.negative_marks)) : 0);
      const msqPartialEnabled = examScheme?.msq_partial_enabled ?? false;
      const configuredPartial = examScheme?.msq_partial;
      const msqPartialVal = (configuredPartial !== undefined && configuredPartial !== null && Number(configuredPartial) > 0)
        ? Number(configuredPartial)
        : (correctOpts.length > 0 ? Math.max(1, msqCorrect / correctOpts.length) : 1);

      if (hasWrong) {
        marksAwarded = msqWrong;
      } else if (correctCount === correctOpts.length) {
        marksAwarded = msqCorrect;
        isCorrect = true;
      } else if (correctCount > 0) {
        isPartialMatch = true;
        marksAwarded = msqPartialEnabled ? Number((correctCount * msqPartialVal).toFixed(2)) : msqWrong;
      } else {
        marksAwarded = msqWrong;
      }
    } else {
      if (q.question_type === 'nat') {
        if (String(studentAns).trim() === String(correctAns).trim()) {
          marksAwarded = maxMarks;
          isCorrect = true;
        } else {
          marksAwarded = negMarks;
        }
      } else {
        if (selectedOpts.length === 1 && correctOpts.includes(selectedOpts[0])) {
          marksAwarded = maxMarks;
          isCorrect = true;
        } else {
          marksAwarded = negMarks;
        }
      }
    }
  }

  return { marksAwarded, isCorrect, isPartialMatch, hasWrong };
}

interface ExamInterfaceProps {
  studentProfile: any;
  exam: any;
  onExamSubmitted: () => void;
  serverTimeOffset?: number;
}

export default function ExamInterface({ studentProfile, exam, onExamSubmitted, serverTimeOffset = 0 }: ExamInterfaceProps) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string | null; marked: boolean; visited: boolean; saved: boolean }>>({});
  const savingRef = useRef(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [school, setSchool] = useState<{ name: string; logo_url: string | null } | null>(null);
  
  // Calculate time remaining based on server time, student start time, and duration or exam end_time
  const getInitialTimeLeft = () => {
    if (!exam.end_time) {
      if (exam.student_started_at) {
        const now = new Date(Date.now() + serverTimeOffset).getTime();
        const startedAt = new Date(exam.student_started_at).getTime();
        const elapsedSeconds = Math.floor((now - startedAt) / 1000);
        return Math.max(0, (exam.duration_minutes * 60) - elapsedSeconds);
      }
      return exam.duration_minutes * 60;
    }
    const now = new Date(Date.now() + serverTimeOffset).getTime();
    const endTime = new Date(exam.end_time).getTime();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
    return remaining;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [headerOpen, setHeaderOpen] = useState(true);
  // Prevent double auto-submit
  const autoSubmittedRef = useRef(false);
  const questionContentRef = useRef<HTMLDivElement>(null);

  // True when the student is re-entering an exam that was already in-progress
  const [isResuming] = useState(!!exam.student_started_at);
  // Controls the amber "Resuming" banner shown at the top of the exam UI
  const [showResumeBanner, setShowResumeBanner] = useState(!!exam.student_started_at);

  const scrollToTop = () => {
    questionContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (questionContentRef.current) {
      questionContentRef.current.scrollTo({
        top: questionContentRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (questionContentRef.current) {
      questionContentRef.current.scrollTop = 0;
    }
  }, [currentQuestionIndex, currentSubjectIndex]);

  useEffect(() => {
    const fetchSchoolData = async () => {
      const schoolId = exam?.school_id || studentProfile?.school_id;
      if (!schoolId) {
        return;
      }
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('name, logo_url')
          .eq('id', schoolId)
          .single();
        if (error) throw error;
        if (data) {
          setSchool({ name: data.name, logo_url: data.logo_url });
        }
      } catch (err) {
        console.error('Failed to fetch school details:', err);
      }
    };
    fetchSchoolData();
  }, [exam?.school_id, studentProfile?.school_id]);

  useEffect(() => {
    const fetchExamData = async () => {
      try {        const { data: subjectsData, error: subErr } = await supabase
          .from('exam_subjects')
          .select('*')
          .eq('exam_id', exam.id)
          .order('sort_order');
        if (subErr) throw subErr;

        const { data: questionsData, error: qErr } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', exam.id)
          .order('question_number');
        if (qErr) throw qErr;

        const loadedSubjects = subjectsData || [];
        const loadedQuestions = questionsData || [];

        if (loadedSubjects.length === 0 || loadedQuestions.length === 0) {
          console.warn('No subjects or questions found for this exam.');
        }

        // Deterministic shuffle if not disabled
        if (exam.shuffle_questions !== false) {
          const seedStr = `${studentProfile?.id || 'unknown'}-${exam.id}`;
          const seed = generateSeed(seedStr);
          const random = mulberry32(seed);
          
          // 1. Shuffle completely
          for (let i = loadedQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [loadedQuestions[i], loadedQuestions[j]] = [loadedQuestions[j], loadedQuestions[i]];
          }

          // 2. Group by subject and then by question type
          const typeOrder: Record<string, number> = { mcq: 1, msq: 2, nat: 3 };
          loadedQuestions.sort((a, b) => {
            const subA = loadedSubjects.findIndex(s => s.id === a.exam_subject_id);
            const subB = loadedSubjects.findIndex(s => s.id === b.exam_subject_id);
            if (subA !== subB) return subA - subB;
            
            const tA = typeOrder[a.question_type] || 99;
            const tB = typeOrder[b.question_type] || 99;
            return tA - tB;
          });
        }

        setSubjects(loadedSubjects);
        setQuestions(loadedQuestions);

        // Build the blank answer slate first so the UI can render
        const blankAnswers = initializeAnswers(loadedQuestions);

        // ── Resume: restore previously saved answers from DB ────────────────
        // When student_started_at is set the student is re-entering an exam
        // that was interrupted (app closed, crash, etc.). We load whatever
        // answers were already persisted so they are NOT lost.
        if (exam.student_started_at && studentProfile?.id) {
          try {
            // Answers are stored as a JSONB blob in results.answers, keyed by question_id.
            // The submit_exam RPC upserts into results on every draft save, so this is
            // the authoritative source for in-progress answers.
            const { data: resultRow, error: saErr } = await supabase
              .from('results')
              .select('answers')
              .eq('exam_id', exam.id)
              .eq('student_id', studentProfile.id)
              .maybeSingle();

            if (!saErr && resultRow?.answers && Object.keys(resultRow.answers).length > 0) {
              // resultRow.answers is { [question_id]: { answer, marked_for_review, ... } }
              const restored = { ...blankAnswers };
              Object.entries(resultRow.answers as Record<string, any>).forEach(([qId, sa]) => {
                if (restored[qId] !== undefined) {
                  restored[qId] = {
                    answer: sa.answer ?? null,
                    marked: sa.marked_for_review ?? false,
                    visited: true,
                    saved: true,
                  };
                }
              });
              setAnswers(restored);
            } else {
              setAnswers(blankAnswers);
            }
          } catch (err) {
            console.warn('[Resume] Failed to restore saved answers, continuing with blank slate:', err);
            setAnswers(blankAnswers);
          }
        } else {
          setAnswers(blankAnswers);
        }
        // ───────────────────────────────────────────────────────────────────
      } catch (err) {
        console.error('Failed to fetch exam data:', err);
      } finally {
        setLoading(false);
      }
    };

    // Returns the initialised blank-slate answer map (and also calls setAnswers
    // as a fallback; the resume block above will overwrite it when needed).
    const initializeAnswers = (loadedQuestions: any[]) => {
      const initialAnswers: Record<string, { answer: string | null; marked: boolean; visited: boolean; saved: boolean }> = {};
      loadedQuestions.forEach((q) => {
        initialAnswers[q.id] = { answer: null, marked: false, visited: false, saved: false };
      });
      if (loadedQuestions.length > 0) {
        initialAnswers[loadedQuestions[0].id].visited = true;
      }
      return initialAnswers;
    };

    fetchExamData();
  }, [exam.id]);

  // Timer — re-syncs every second; auto-submits when time hits 0
  useEffect(() => {
    if (loading) return; // Don't start timer until exam data is loaded

    if (timeLeft <= 0) {
      // ── Safety re-verification before auto-submitting ──────────────────
      // On exam resumption the initial timeLeft is computed client-side
      // before the serverTimeOffset handshake fully settles. Re-derive the
      // true remaining seconds directly from the authoritative timestamps
      // to prevent a false auto-submit when the student still has time left.
      const verifiedTimeLeft = (() => {
        if (!exam.end_time) {
          if (exam.student_started_at) {
            const now = new Date(Date.now() + serverTimeOffset).getTime();
            const startedAt = new Date(exam.student_started_at).getTime();
            const elapsedSeconds = Math.floor((now - startedAt) / 1000);
            return Math.max(0, (exam.duration_minutes * 60) - elapsedSeconds);
          }
          return 0;
        }
        const now = new Date(Date.now() + serverTimeOffset).getTime();
        const endTime = new Date(exam.end_time).getTime();
        return Math.max(0, Math.floor((endTime - now) / 1000));
      })();

      if (verifiedTimeLeft > 0) {
        // Clock drift or stale state — correct timeLeft and keep going
        console.info(`[Timer] Corrected stale timeLeft (was 0, verified: ${verifiedTimeLeft}s). Resuming timer.`);
        setTimeLeft(verifiedTimeLeft);
        return;
      }
      // ──────────────────────────────────────────────────────────────────

      // Auto-submit only once
      if (!autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        handleAutoSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(() => {
        if (!exam.end_time) {
          return Math.max(0, timeLeft - 1);
        }
        const now = new Date(Date.now() + serverTimeOffset).getTime();
        const endTime = new Date(exam.end_time).getTime();
        return Math.max(0, Math.floor((endTime - now) / 1000));
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, loading]);


  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getFilteredQuestions = () => {
    if (subjects.length === 0) return [];
    return questions.filter(q => q.exam_subject_id === subjects[currentSubjectIndex].id);
  };

  const currentQuestions = getFilteredQuestions();
  const currentQuestion = currentQuestions[currentQuestionIndex];

  const currentOptionsOrder = useMemo(() => {
    const baseOptions = ['A', 'B', 'C', 'D'];
    if (!currentQuestion) return baseOptions;
    
    if (exam?.shuffle_questions !== false && studentProfile?.id) {
      const seedStr = `${studentProfile.id}-${exam.id}-${currentQuestion.id}-options`;
      const seed = generateSeed(seedStr);
      const random = mulberry32(seed);
      
      const shuffled = [...baseOptions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return baseOptions;
  }, [currentQuestion, exam?.shuffle_questions, exam?.id, studentProfile?.id]);

  const handleSelectOption = (qId: string, option: string) => {
    const isMsq = questions.find(q => q.id === qId)?.question_type === 'msq';
    setAnswers(prev => {
      if (!isMsq) {
        return { ...prev, [qId]: { ...prev[qId], answer: option } };
      }
      const currentAns = prev[qId]?.answer || '';
      let selected = currentAns ? currentAns.split(',') : [];
      if (selected.includes(option)) {
        selected = selected.filter(o => o !== option);
      } else {
        selected.push(option);
      }
      selected.sort();
      return { ...prev, [qId]: { ...prev[qId], answer: selected.join(',') } };
    });
  };

  const handleNatChange = (qId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], answer: val } }));
  };

  // Upserts all currently-saved answers to the DB as a draft (fire-and-forget during exam)
  const upsertAnswersToDB = async (updatedAnswers: Record<string, { answer: string | null; marked: boolean; visited: boolean; saved: boolean }>) => {
    if (!exam.id || savingRef.current) return;
    savingRef.current = true;
    try {
      // Only send answers that were explicitly saved (Save & Next / Save & Mark for Review)
      const savedAnswers: Record<string, any> = {};
      Object.keys(updatedAnswers).forEach(qId => {
        const a = updatedAnswers[qId];
        if (a.saved) {
          savedAnswers[qId] = {
            question_id: qId,
            answer: a.answer,
            marked_for_review: a.marked,
            time_spent_seconds: 0,
          };
        }
      });

      if (Object.keys(savedAnswers).length === 0) return;

      // Use save_exam_draft (not submit_exam) so that students.status stays
      // 'in_progress' — allowing re-entry if the app closes mid-exam.
      // submit_exam is reserved for the final manual/timer submission only.
      const actualSchoolId = exam.school_id || studentProfile?.school_id || (questions.length > 0 ? questions[0].school_id : undefined);
      
      await supabase.rpc('save_exam_draft', {
        p_exam_id: exam.id,
        p_school_id: actualSchoolId,
        p_answers: savedAnswers,
        p_total_marks: null,
        p_section_scores: null,
      });
    } catch (err) {
      console.error('Failed to save answer to DB:', err);
    } finally {
      savingRef.current = false;
    }
  };

  const handleSaveAndNext = () => {
    if (!currentQuestion) return;
    const updatedAnswers = { ...answers, [currentQuestion.id]: { ...answers[currentQuestion.id], marked: false, visited: true, saved: true } };
    setAnswers(updatedAnswers);
    upsertAnswersToDB(updatedAnswers);
    moveToNext();
  };

  const handleSaveAndMarkForReview = () => {
    if (!currentQuestion) return;
    const updatedAnswers = { ...answers, [currentQuestion.id]: { ...answers[currentQuestion.id], marked: true, visited: true, saved: true } };
    setAnswers(updatedAnswers);
    upsertAnswersToDB(updatedAnswers);
    moveToNext();
  };

  const handleMarkForReviewAndNext = () => {
    if (!currentQuestion) return;
    // Preserve the selected answer locally but do NOT save to DB
    // The marked: true flag keeps it categorized as 'review' in the palette
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: { ...prev[currentQuestion.id], marked: true, visited: true, saved: false } }));
    moveToNext();
  };

  const moveToNext = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      const nextQ = currentQuestions[currentQuestionIndex + 1];
      setAnswers(prev => ({ ...prev, [nextQ.id]: { ...prev[nextQ.id], visited: true } }));
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSubjectIndex < subjects.length - 1) {
      const nextSub = subjects[currentSubjectIndex + 1];
      const nextSubQs = questions.filter(q => q.exam_subject_id === nextSub.id);
      if (nextSubQs.length > 0) {
        setAnswers(prev => ({ ...prev, [nextSubQs[0].id]: { ...prev[nextSubQs[0].id], visited: true } }));
      }
      setCurrentSubjectIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const handleBack = () => {
    if (!currentQuestion) return;
    if (currentQuestionIndex > 0) {
      const prevQ = currentQuestions[currentQuestionIndex - 1];
      setAnswers(prev => ({ ...prev, [prevQ.id]: { ...prev[prevQ.id], visited: true } }));
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentSubjectIndex > 0) {
      const prevSubIdx = currentSubjectIndex - 1;
      const prevSubQs = questions.filter(q => q.exam_subject_id === subjects[prevSubIdx].id);
      if (prevSubQs.length > 0) {
        const lastQ = prevSubQs[prevSubQs.length - 1];
        setAnswers(prev => ({ ...prev, [lastQ.id]: { ...prev[lastQ.id], visited: true } }));
      }
      setCurrentSubjectIndex(prevSubIdx);
      setCurrentQuestionIndex(prevSubQs.length - 1);
    }
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: { ...prev[currentQuestion.id], answer: null, marked: false } }));
  };

  const handlePaletteClick = (idx: number) => {
    const q = currentQuestions[idx];
    setAnswers(prev => ({ ...prev, [q.id]: { ...prev[q.id], visited: true } }));
    setCurrentQuestionIndex(idx);
  };

  const getQuestionStatus = (qId: string) => {
    const state = answers[qId];
    if (!state) return 'not_visited';
    // Answered & marked for review (Save & Mark for Review)
    if (state.saved && state.marked && state.answer !== null && state.answer !== '') return 'answered_review';
    // Marked for review only — answer may exist locally but was not confirmed (Mark for Review & Next)
    if (state.marked) return 'review';
    // Confirmed answer (Save & Next)
    if (state.saved && state.answer !== null && state.answer !== '') return 'answered';
    // Answer selected but not confirmed via any button (navigated with Next >>) → Not Answered
    if (state.visited) return 'not_answered';
    return 'not_visited';
  };

  const getExamSummary = () => {
    let answered = 0, review = 0, answered_review = 0, not_answered = 0, not_visited = 0;
    questions.forEach((q) => {
      const s = getQuestionStatus(q.id);
      if (s === 'answered') answered++;
      else if (s === 'review') review++;
      else if (s === 'answered_review') answered_review++;
      else if (s === 'not_answered') not_answered++;
      else not_visited++;
    });
    return { answered, review, answered_review, not_answered, not_visited };
  };

  // Silent auto-submit called when timer reaches 0
  const handleAutoSubmit = async () => {
    setSubmitting(true);
    try {
      let finalScore = 0;
      const sectionScores: any[] = subjects.map(sub => ({ subject_name: sub.subject_name, correct: 0, wrong: 0, unanswered: 0, marks: 0 }));

      // Only include answers that were explicitly saved (Save & Next / Save & Mark for Review)
      // Exclude answers that were only "Mark for Review & Next" (saved: false)
      const formattedAnswers: Record<string, any> = {};
      questions.forEach((q) => {
        const a = answers[q.id];
        if (!a?.saved) return; // Skip mark-for-review-only answers

        const studentAns = a.answer;
        const subIdx = subjects.findIndex(s => s.id === q.exam_subject_id);
        const section = sectionScores[subIdx];

        formattedAnswers[q.id] = { question_id: q.id, answer: studentAns, marked_for_review: a.marked, time_spent_seconds: 0 };

        if (studentAns === null || studentAns === '' || studentAns === undefined) {
          section.unanswered++;
        } else {
          const evalResult = evaluateQuestion(q, studentAns, exam?.marking_scheme);
          if (evalResult.isCorrect) section.correct++;
          else if (evalResult.isPartialMatch && !evalResult.hasWrong) {
            section.partial = (section.partial || 0) + 1;
          } else {
            section.wrong++;
          }
          section.marks += evalResult.marksAwarded;
          finalScore += evalResult.marksAwarded;
        }
      });

      const actualSchoolId = exam.school_id || studentProfile?.school_id || (questions.length > 0 ? questions[0].school_id : undefined);

      if (exam.id) {
        await supabase.rpc('submit_exam', {
          p_exam_id: exam.id,
          p_school_id: actualSchoolId,
          p_answers: formattedAnswers,
          p_total_marks: finalScore,
          p_section_scores: sectionScores,
          p_time_taken_seconds: exam.duration_minutes * 60,
        });
      }
      
      try {
        // Release the single-session lock before signing out (auto-submit success)
        if (studentProfile?.id) {
          await supabase.rpc('clear_student_session', {
            p_student_id: studentProfile.id,
            p_device_id: getDeviceId(),
          });
        }
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.warn('Signout failed or not authenticated:', signOutErr);
      }
      onExamSubmitted();
    } catch (err) {
      console.error('Auto-submit failed:', err);
      try {
        // Release the single-session lock before signing out (auto-submit error)
        if (studentProfile?.id) {
          await supabase.rpc('clear_student_session', {
            p_student_id: studentProfile.id,
            p_device_id: getDeviceId(),
          });
        }
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.warn('Signout failed or not authenticated:', signOutErr);
      }
      onExamSubmitted();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitExam = async () => {
    setSubmitting(true);
    try {
      // Only include answers that were explicitly saved (Save & Next / Save & Mark for Review)
      // Exclude answers that were only "Mark for Review & Next" (saved: false)
      const formattedAnswers: Record<string, any> = {};
      questions.forEach((q) => {
        const a = answers[q.id];
        if (!a?.saved) return; // Skip mark-for-review-only answers

        formattedAnswers[q.id] = {
          question_id: q.id,
          answer: a.answer,
          marked_for_review: a.marked,
          time_spent_seconds: 0
        };
      });

      const actualSchoolId = exam.school_id || studentProfile?.school_id || (questions.length > 0 ? questions[0].school_id : undefined);

      if (exam.id) {
        const { error } = await supabase.rpc('submit_exam', {
          p_exam_id: exam.id,
          p_school_id: actualSchoolId,
          p_answers: formattedAnswers,
          p_total_marks: null,
          p_section_scores: null,
          p_time_taken_seconds: (exam.duration_minutes * 60) - timeLeft
        });

        if (error) {
          console.error('RPC Submit Error:', error);
          throw error;
        }
      }

      try {
        // Release the single-session lock before signing out (manual submit)
        if (studentProfile?.id) {
          await supabase.rpc('clear_student_session', {
            p_student_id: studentProfile.id,
            p_device_id: getDeviceId(),
          });
        }
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.warn('Signout failed or not authenticated:', signOutErr);
      }
      onExamSubmitted();
    } catch (error) {
      console.error(error);
      alert('Failed to submit exam. Error: ' + ((error as any)?.message || JSON.stringify(error) || String(error)));
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) return <div className="p-12 text-center text-[#667085] font-semibold">Loading exam...</div>;

  const summary = getExamSummary();

  const getTimerClass = () => {
    if (timeLeft <= 60) {
      return 'bg-[#F04438]';
    } else if (timeLeft <= 300) {
      return 'bg-[#F79009]';
    } else {
      return 'bg-[#008080]';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FFFFFF] text-[#1D2939] font-sans text-[15px] select-none overflow-hidden">

      {/* Top Header - White */}
      <header className={`border-b border-[#008080] flex items-center justify-between bg-white px-6 transition-all duration-300 ease-in-out ${headerOpen ? 'h-[90px]' : 'h-[45px]'}`}>
        {headerOpen ? (
          <>
            <div className="flex items-center gap-3">
              <img src={school?.logo_url || parikshaLogo} alt={`${school?.name || 'ParikshaOS'} Logo`} className="w-14 h-14 rounded-full object-cover" />
              <div>
                <h1 className="text-[#008080] text-[20px] font-extrabold tracking-widest m-0 leading-tight uppercase">{school?.name || 'ParikshaOS'}</h1>
                <p className="text-[9px] text-[#667085] uppercase tracking-wider font-semibold">ParikshaOS by Growtez</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="w-14 h-14 border border-[#E4E7EC] bg-[#F9FAFB] flex items-center justify-center rounded-none shadow-sm">
                <svg className="w-10 h-10 text-[#667085]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
              </div>
              <div className="flex flex-col text-right">
                <div className="text-[#1D2939] text-xs font-medium"><span className="text-[#667085]">Candidate Name :</span> <span className="text-[#1D2939] font-bold">[{studentProfile.full_name}]</span></div>
                <div className="text-[#1D2939] text-xs font-medium mt-0.5"><span className="text-[#667085]">Candidate Roll No. :</span> <span className="text-[#1D2939] font-bold">[{studentProfile.roll_number || 'N/A'}]</span></div>
                <div className="text-[#1D2939] text-xs font-medium mt-1 flex items-center justify-end gap-2">
                  <span className="text-[#667085]">Remaining Time :</span>
                  <span className={`px-3 py-1 font-bold text-xl text-white rounded-none leading-none ${getTimerClass()}`}>{formatTime(timeLeft)}</span>
                </div>
              </div>
              <button
                onClick={() => setHeaderOpen(false)}
                className="text-[#667085] hover:text-[#008080] hover:bg-gray-100 p-1.5 rounded-none transition-colors ml-1"
                title="Collapse Header"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <img src={school?.logo_url || parikshaLogo} alt={`${school?.name || 'ParikshaOS'} Logo`} className="w-6 h-6 rounded-full object-cover" />
              <h1 className="text-[#008080] text-[15px] font-extrabold tracking-wider m-0 uppercase">{school?.name || 'ParikshaOS'}</h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-[#667085] font-semibold">Remaining Time:</span>
              <span className={`px-4 py-1.5 font-bold text-xl text-white rounded-none leading-none ${getTimerClass()}`}>{formatTime(timeLeft)}</span>
              <button
                onClick={() => setHeaderOpen(true)}
                className="text-[#667085] hover:text-[#008080] hover:bg-gray-100 p-1.5 rounded-none transition-colors"
                title="Expand Header"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          </>
        )}
      </header>

      {/* Low Time Warning Banner */}
      {/* {timeLeft <= 300 && timeLeft > 0 && (
        <div className={`text-white text-center text-xs font-bold py-1.5 uppercase tracking-widest ${timeLeft <= 60 ? 'bg-[#F04438] animate-pulse' : 'bg-[#F79009]'}`}>
          ⚠ Less than {Math.ceil(timeLeft / 60)} minute{timeLeft > 60 ? 's' : ''} remaining — Exam will auto-submit when time runs out!
        </div>
      )} */}

      {/* Secondary Bar - Premium Teal */}
      <div className="bg-[#008080] h-[50px] flex items-center justify-between px-6 text-white font-bold uppercase shadow-sm">
        <div className="flex items-center gap-8 h-full">
          <span className="text-xs tracking-wider font-semibold text-white/80">{exam.title?.toUpperCase() || 'EXAMINATION'}</span>
          <div className="flex gap-2 items-center h-full">
            {subjects.map((sub, idx) => (
              <button
                key={sub.id}
                onClick={() => { setCurrentSubjectIndex(idx); setCurrentQuestionIndex(0); }}
                className={`px-4 py-3 rounded-none transition-all text-s font-bold ${
                  currentSubjectIndex === idx ? 'bg-[#004d4d] text-white shadow-sm' : 'text-white hover:bg-[#006666]'
                }`}
              >
                {sub.subject_name}
              </button>
            ))}
          </div>
        </div>

        {/* Calculator Trigger Button */}
        {exam.allow_calculator && (
          <button
            onClick={() => setShowCalculator(prev => !prev)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-none bg-[#195e5e] hover:bg-[#003333] active:bg-[#002222] text-white transition-all text-s font-bold shadow-sm"
            title="Toggle Calculator"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Calculator
          </button>
        )}
      </div>

      {/* Resume Banner — shown when student re-enters a mid-exam session */}
      {isResuming && showResumeBanner && (
        <div className="bg-[#F59E0B] text-white text-center text-xs font-bold py-2.5 uppercase tracking-widest flex items-center justify-center gap-2 shrink-0">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Resuming your exam — your previously saved answers have been restored.
          <button
            onClick={() => setShowResumeBanner(false)}
            className="ml-3 text-white/80 hover:text-white font-extrabold text-base leading-none focus:outline-none cursor-pointer"
            aria-label="Dismiss resume banner"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Area - Question Panel */}
        <div className="flex-1 flex flex-col bg-[#FFFFFF] border-r border-[#E4E7EC] overflow-hidden relative">

          <div ref={questionContentRef} className="flex-1 overflow-y-auto p-8">
            {currentQuestion ? (
              <div className="font-serif" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-3 mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-[#1D2939]">Question {currentQuestionIndex + 1}:</h2>
                  </div>
                  {currentQuestion.question_type && (
                    <span className="font-sans text-s font-bold text-[#008080] bg-[#EAF2F2] border border-[#008080] px-3 py-1 uppercase tracking-wider shadow-sm">
                      {currentQuestion.question_type.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="text-[16px] text-[#1D2939] leading-relaxed max-w-4xl font-serif">
                  {currentQuestion.question_text && (
                    <div className="mb-4 font-medium leading-relaxed">
                      <MathRenderer text={currentQuestion.question_text} />
                    </div>
                  )}
                  {(() => {
                    const images = parseQuestionImages(currentQuestion.image_url);
                    if (images.length === 0) return null;
                    return (
                      <div className="mb-6 flex flex-wrap gap-4">
                        {images.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Question image ${idx + 1}`}
                            className="max-w-full max-h-80 object-contain rounded-none border border-[#E4E7EC] shadow-sm"
                          />
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {(currentQuestion.question_type === 'mcq' || currentQuestion.question_type === 'msq') && currentQuestion.options ? (
                  <div className="space-y-3 max-w-2xl mt-8">
                    {currentOptionsOrder.map((opt, index) => {
                      const isMsq = currentQuestion.question_type === 'msq';
                      const currentAns = answers[currentQuestion.id]?.answer || '';
                      const selected = isMsq ? currentAns.split(',').includes(opt) : currentAns === opt;
                      return (
                        <label
                          key={opt}
                          className={`flex items-start gap-4 px-4 py-3.5 rounded-none border cursor-pointer transition-all ${
                            selected
                              ? 'bg-[#008080]/5 border-[#008080] text-[#008080] font-semibold shadow-sm'
                              : 'bg-white border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939]'
                          }`}
                        >
                          <input
                            type={isMsq ? "checkbox" : "radio"}
                            name={`q_${currentQuestion.id}`}
                            checked={selected}
                            onChange={() => handleSelectOption(currentQuestion.id, opt)}
                            className={`w-4 h-4 text-[#008080] border-[#E4E7EC] focus:ring-[#008080] cursor-pointer mt-1 ${isMsq ? 'rounded' : ''}`}
                          />
                          <span className="flex items-start gap-3 font-serif text-[14px] w-full">
                            <span className="font-bold shrink-0 mt-0.5">({String.fromCharCode(65 + index)})</span>
                            <span className="flex flex-col gap-2 flex-1 min-w-0">
                              {currentQuestion.options[opt] && (
                                <span className="inline-block align-middle">
                                  <MathRenderer text={currentQuestion.options[opt]} inline />
                                </span>
                              )}
                              {parseQuestionImages(currentQuestion.options[`${opt}_image`]).map((imgUrl, imgIdx) => (
                                <img
                                  key={imgIdx}
                                  src={imgUrl}
                                  alt={`Option ${opt} image ${imgIdx + 1}`}
                                  className="max-w-[200px] max-h-[200px] object-contain rounded-none border border-[#E4E7EC]"
                                />
                              ))}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-8 max-w-sm font-sans">
                    <label className="block text-xs font-bold text-[#667085] uppercase tracking-wider mb-2">Numeric Answer:</label>
                    {/* Read-only display — input only accepted via the on-screen Numpad below */}
                    <div
                      className="border border-[#E4E7EC] rounded-none px-4 py-2.5 w-full font-mono text-sm bg-[#F9FAFB] text-[#1D2939] shadow-sm min-h-[42px] select-none cursor-default flex items-center"
                      aria-label="Numeric answer display"
                    >
                      {answers[currentQuestion.id]?.answer
                        ? <span>{answers[currentQuestion.id]?.answer}</span>
                        : <span className="text-[#98A2B3]">Use numpad below to enter answer</span>
                      }
                    </div>
                    <Numpad
                      value={answers[currentQuestion.id]?.answer || ''}
                      onChange={(val) => handleNatChange(currentQuestion.id, val)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-[#667085]">No questions available.</div>
            )}
          </div>

          {/* Action Buttons Footer */}
          <div className="border-t border-[#E4E7EC] py-2 px-4 bg-white">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleClearResponse}
                className="bg-[#F0F0F0] hover:bg-[#F9FAFB] text-[#667085] px-4 py-1.5 font-bold text-sm border border-[#008080] rounded-none transition-colors uppercase shadow-sm"
              >
                CLEAR RESPONSE
              </button>
              <button
                onClick={handleMarkForReviewAndNext}
                className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-4 py-1.5 rounded-none font-bold text-sm transition-colors uppercase shadow-sm"
              >
                MARK FOR REVIEW &amp; NEXT
              </button>
              <button
                onClick={handleSaveAndMarkForReview}
                className="bg-[#4A4A4A] hover:bg-[#3A3A3A] text-white px-4 py-1.5 rounded-none font-bold text-sm transition-colors uppercase shadow-sm"
              >
                SAVE &amp; MARK FOR REVIEW
              </button>
              <button
                onClick={handleSaveAndNext}
                className="bg-[#008080] hover:bg-[#006666] text-white px-4 py-1.5 rounded-none font-bold text-sm transition-colors uppercase shadow-sm"
              >
                SAVE &amp; NEXT
              </button>
            </div>
          </div>

          {/* Navigation and Submission Footer Section */}
          <div className="border-t border-[#E4E7EC] py-3 px-4 bg-[#EAF2F2] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                disabled={currentQuestionIndex === 0 && currentSubjectIndex === 0}
                className="bg-white hover:bg-[#F9FAFB] text-[#667085] px-5 py-1.5 font-bold text-xs border border-[#D0D5DD] rounded-none transition-colors uppercase disabled:opacity-50 disabled:hover:bg-white"
              >
                &lt;&lt; BACK
              </button>
              <button
                onClick={moveToNext}
                disabled={currentQuestionIndex === currentQuestions.length - 1 && currentSubjectIndex === subjects.length - 1}
                className="bg-white hover:bg-[#F9FAFB] text-[#667085] px-5 py-1.5 font-bold text-xs border border-[#D0D5DD] rounded-none transition-colors uppercase disabled:opacity-50 disabled:hover:bg-white"
              >
                NEXT &gt;&gt;
              </button>
            </div>
            
            <button
              onClick={() => setShowSubmitModal(true)}
              className="bg-[#008080] hover:bg-[#006666] text-white px-6 py-1.5 rounded-none font-bold text-sm shadow-sm transition-all uppercase"
            >
              SUBMIT
            </button>
          </div>

          {/* Floating Back to Top / Back to Bottom Buttons */}
          <div className="absolute right-6 bottom-24 flex flex-col gap-2 z-20">
            <button
              onClick={scrollToTop}
              className="w-10 h-10 rounded-full bg-[#008080] hover:bg-[#006666] text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all focus:outline-none cursor-pointer active:scale-95 opacity-85 hover:opacity-100"
              title="Back to Top"
              aria-label="Back to Top"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={scrollToBottom}
              className="w-10 h-10 rounded-full bg-[#008080] hover:bg-[#006666] text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all focus:outline-none cursor-pointer active:scale-95 opacity-85 hover:opacity-100"
              title="Back to Bottom"
              aria-label="Back to Bottom"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Area - Palette Sidebar */}
        <aside className={`relative bg-[#F9FAFB] flex flex-col border-l border-[#E4E7EC] transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[300px]' : 'w-0 border-l-0'}`}>
          <div className="w-[300px] h-full flex flex-col overflow-hidden shrink-0">
            {/* Legend Table */}
            <div className="p-4 bg-[#F9FAFB] border-b border-[#E4E7EC] relative">
              <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-[#E4E7EC]/80">
                <span className="text-[11px] font-extrabold text-[#1D2939] uppercase tracking-wider">Legend</span>
                <button
                  type="button"
                  onClick={() => setShowLegendModal(true)}
                  className="w-5 h-5 rounded-full bg-[#008080] hover:bg-[#006666] active:bg-[#004d4d] text-white flex items-center justify-center font-bold text-xs transition-all shadow-sm focus:outline-none cursor-pointer"
                  title="Explain Color Codes"
                  aria-label="Explain Color Codes"
                >
                  i
                </button>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[11px] font-semibold text-[#1D2939]">
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-7 bg-[#E4E7EC] text-[#667085] border border-[#D0D5DD] flex items-center justify-center rounded-none font-bold shadow-sm">
                    {summary.not_visited}
                  </div>
                  <span className="text-[#667085]">Not Visited</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-7 bg-[#F04438] text-white flex items-center justify-center rounded-none font-bold shadow-sm">
                    {summary.not_answered}
                  </div>
                  <span className="text-[#667085]">Not Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-7 bg-[#22C55E] text-white flex items-center justify-center rounded-none font-bold shadow-sm">
                    {summary.answered}
                  </div>
                  <span className="text-[#667085]">Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-7 bg-[#F59E0B] text-white flex items-center justify-center rounded-none font-bold shadow-sm">
                    {summary.review}
                  </div>
                  <span className="text-[#667085]">Marked for Review</span>
                </div>
                <div className="flex items-start gap-1.5 col-span-2 mt-1">
                  <div className="w-8 h-7 bg-[#F59E0B] text-white flex items-center justify-center rounded-none font-bold shadow-sm relative shrink-0">
                    <div className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-[#22C55E] rounded-none border border-white"></div>
                    {summary.answered_review}
                  </div>
                  <span className="leading-tight text-[#667085] mt-0.5">Answered &amp; Marked for Review</span>
                </div>
              </div>
            </div>

            <div className="bg-[#008080] text-white font-bold px-4 py-2 text-xs uppercase tracking-wider border-y border-[#006666]">
              {subjects[currentSubjectIndex]?.subject_name}
            </div>

            {/* Palette Grid */}
            <div 
              className="flex-1 overflow-y-scroll p-4 bg-[#F9FAFB]"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#008080 rgba(0, 0, 0, 0.05)'
              }}
            >
              <div className="grid grid-cols-5 gap-2">
                {currentQuestions.map((q, idx) => {
                  const status = getQuestionStatus(q.id);
                  const active = currentQuestionIndex === idx;

                  let btnClass = "";
                  let hasDot = false;

                  if (status === 'answered') {
                    btnClass = "bg-[#22C55E] text-white border border-[#16A34A]";
                  } else if (status === 'review') {
                    btnClass = "bg-[#F59E0B] text-white border border-[#D97706]";
                  } else if (status === 'answered_review') {
                    btnClass = "bg-[#F59E0B] text-white border border-[#D97706]";
                    hasDot = true;
                  } else if (status === 'not_answered') {
                    btnClass = "bg-[#F04438] text-white border border-[#d9382e]";
                  } else {
                    btnClass = "bg-[#E4E7EC] text-[#667085] border border-[#D0D5DD]";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => handlePaletteClick(idx)}
                      className={`w-[45px] h-[35px] flex items-center justify-center font-bold text-sm shadow-sm relative transition-all rounded-none hover:scale-105 ${btnClass} ${
                        active ? 'ring-2 ring-[#008080] ring-offset-1 scale-105 z-10' : ''
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                      {hasDot && (
                        <span className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-[#22C55E] rounded-none border border-white"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-[#008080] text-white w-5 h-10 flex items-center justify-center absolute right-full top-1/2 -translate-y-1/2 rounded-none hover:bg-[#006666] transition-colors z-10 shadow-md border-y border-l border-[#006666]"
          >
            <svg
              className="w-3.5 h-3.5 transition-transform duration-300"
              style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </aside>
      </div>

      {/* Auto-submit overlay */}
      {submitting && timeLeft <= 0 && (
        <div className="fixed inset-0 bg-[#1D2939]/80 backdrop-blur-sm flex items-center justify-center z-[100] transition-opacity">
          <div className="bg-white rounded-none border border-[#E4E7EC] shadow-xl p-8 w-full max-w-sm mx-4 text-center overflow-hidden">
            <div className="bg-[#F04438] -mx-8 -mt-8 mb-6 px-8 py-4">
              <span className="text-white font-extrabold text-sm uppercase tracking-widest">Time Up!</span>
            </div>
            <div className="w-14 h-14 bg-red-50 border border-[#F04438]/20 flex items-center justify-center mx-auto mb-4 rounded-none">
              <svg className="w-8 h-8 text-[#F04438]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#1D2939] uppercase tracking-wide mb-2">Auto Submitting...</h3>
            <p className="text-[#667085] text-sm">Your exam time has expired. Your answers are being submitted automatically.</p>
            <div className="mt-6 h-1.5 bg-[#E4E7EC] rounded-none overflow-hidden">
              <div className="h-full bg-[#F04438] animate-pulse w-full rounded-none"></div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-[#1D2939]/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-[#E4E7EC] rounded-none p-8 w-full max-w-md mx-4 shadow-xl overflow-hidden">
            <div className="bg-[#008080] -mx-8 -mt-8 mb-6 px-8 py-4">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-widest">Confirm Submission</h3>
            </div>
            <p className="text-[#667085] mb-6 text-sm leading-relaxed">Are you sure you want to submit your exam? You will not be able to change your answers after submission.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="px-5 py-2.5 bg-white hover:bg-[#F9FAFB] text-[#667085] font-bold text-xs border border-[#E4E7EC] rounded-none transition-all uppercase shadow-sm"
              >
                CANCEL
              </button>
              <button
                onClick={handleSubmitExam}
                disabled={submitting}
                className="px-5 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-bold text-xs rounded-none transition-all uppercase shadow-sm"
              >
                {submitting ? 'SUBMITTING...' : 'YES, SUBMIT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend Info Modal */}
      {showLegendModal && (
        <div className="fixed inset-0 bg-[#1D2939]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E4E7EC] rounded-none w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#008080] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs">
                  i
                </div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-widest">Question Legend Guide</h3>
              </div>
              <button
                onClick={() => setShowLegendModal(false)}
                className="text-white/80 hover:text-white text-lg font-bold p-1 leading-none focus:outline-none cursor-pointer"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-[#667085] leading-relaxed">
                The question palette uses standard color codes to help you track your exam progress:
              </p>

              <div className="space-y-3.5 divide-y divide-[#E4E7EC]">
                {/* Not Visited */}
                <div className="pt-3.5 first:pt-0 flex items-start gap-3">
                  <div className="w-9 h-8 bg-[#E4E7EC] text-[#667085] border border-[#D0D5DD] flex items-center justify-center rounded-none font-bold text-xs shadow-sm shrink-0 mt-0.5">
                    01
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1D2939] uppercase">Not Visited</h4>
                    <p className="text-xs text-[#667085] mt-0.5 leading-relaxed">
                      You have not visited or opened this question yet.
                    </p>
                  </div>
                </div>

                {/* Not Answered */}
                <div className="pt-3.5 flex items-start gap-3">
                  <div className="w-9 h-8 bg-[#F04438] text-white flex items-center justify-center rounded-none font-bold text-xs shadow-sm shrink-0 mt-0.5">
                    02
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#F04438] uppercase">Not Answered</h4>
                    <p className="text-xs text-[#667085] mt-0.5 leading-relaxed">
                      You have visited this question, but have not provided an answer.
                    </p>
                  </div>
                </div>

                {/* Answered */}
                <div className="pt-3.5 flex items-start gap-3">
                  <div className="w-9 h-8 bg-[#22C55E] text-white flex items-center justify-center rounded-none font-bold text-xs shadow-sm shrink-0 mt-0.5">
                    03
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#16A34A] uppercase">Answered</h4>
                    <p className="text-xs text-[#667085] mt-0.5 leading-relaxed">
                      You have answered this question. It will be evaluated for scoring.
                    </p>
                  </div>
                </div>

                {/* Marked for Review */}
                <div className="pt-3.5 flex items-start gap-3">
                  <div className="w-9 h-8 bg-[#F59E0B] text-white flex items-center justify-center rounded-none font-bold text-xs shadow-sm shrink-0 mt-0.5">
                    04
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#D97706] uppercase">Marked for Review</h4>
                    <p className="text-xs text-[#667085] mt-0.5 leading-relaxed">
                      You have marked this question for review without answering. <span className="font-semibold text-[#D97706]">(Will NOT be evaluated)</span>.
                    </p>
                  </div>
                </div>

                {/* Answered & Marked for Review */}
                <div className="pt-3.5 flex items-start gap-3">
                  <div className="w-9 h-8 bg-[#F59E0B] text-white flex items-center justify-center rounded-none font-bold text-xs shadow-sm relative shrink-0 mt-0.5">
                    <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-[#22C55E] rounded-none border border-white"></div>
                    05
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#D97706] uppercase">Answered &amp; Marked for Review</h4>
                    <p className="text-xs text-[#667085] mt-0.5 leading-relaxed">
                      You have answered the question and marked it for review. <span className="font-semibold text-[#16A34A]">(WILL be evaluated for scoring)</span>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#E4E7EC] p-4 bg-[#F9FAFB] flex justify-end">
              <button
                onClick={() => setShowLegendModal(false)}
                className="px-6 py-2 bg-[#008080] hover:bg-[#006666] text-white font-bold text-xs rounded-none transition-all uppercase shadow-sm cursor-pointer"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Calculator */}
      {showCalculator && (
        <Calculator onClose={() => setShowCalculator(false)} />
      )}
    </div>
  );
}
