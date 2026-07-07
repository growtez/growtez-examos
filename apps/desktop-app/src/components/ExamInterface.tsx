import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

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
  const [answers, setAnswers] = useState<Record<string, { answer: string | null; marked: boolean; visited: boolean }>>({});
  
  // Calculate time remaining based on server time and exam end_time
  const getInitialTimeLeft = () => {
    if (!exam.end_time) return exam.duration_minutes * 60;
    const now = new Date(Date.now() + serverTimeOffset).getTime();
    const endTime = new Date(exam.end_time).getTime();
    const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
    return remaining;
  };

  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  // Prevent double auto-submit
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    const fetchExamData = async () => {
      const { data: subjectsData } = await supabase
        .from('exam_subjects')
        .select('*')
        .eq('exam_id', exam.id)
        .order('sort_order');
      const loadedSubjects = subjectsData || [];
      setSubjects(loadedSubjects);

      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', exam.id)
        .order('question_number');
      const loadedQuestions = questionsData || [];
      setQuestions(loadedQuestions);

      const initialAnswers: Record<string, { answer: string | null; marked: boolean; visited: boolean }> = {};
      loadedQuestions.forEach((q) => {
        initialAnswers[q.id] = { answer: null, marked: false, visited: false };
      });
      if (loadedQuestions.length > 0) {
        initialAnswers[loadedQuestions[0].id].visited = true;
      }
      setAnswers(initialAnswers);
      setLoading(false);
    };
    fetchExamData();
  }, [exam.id]);

  // Timer — re-syncs every second; auto-submits when time hits 0
  useEffect(() => {
    if (loading) return; // Don't start timer until exam data is loaded

    if (timeLeft <= 0) {
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

  const handleSelectOption = (qId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], answer: option } }));
  };

  const handleNatChange = (qId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [qId]: { ...prev[qId], answer: val } }));
  };

  const handleSaveAndNext = () => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: { ...prev[currentQuestion.id], visited: true } }));
    moveToNext();
  };

  const handleSaveAndMarkForReview = () => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: { ...prev[currentQuestion.id], marked: true, visited: true } }));
    moveToNext();
  };

  const handleMarkForReviewAndNext = () => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: { ...prev[currentQuestion.id], answer: null, marked: true, visited: true } }));
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
    if (state.marked && state.answer !== null && state.answer !== '') return 'answered_review';
    if (state.marked) return 'review';
    if (state.answer !== null && state.answer !== '') return 'answered';
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

      questions.forEach((q) => {
        const studentAns = answers[q.id]?.answer;
        const subIdx = subjects.findIndex(s => s.id === q.exam_subject_id);
        const section = sectionScores[subIdx];
        if (studentAns === null || studentAns === '') {
          section.unanswered++;
        } else if (studentAns === q.correct_option) {
          section.correct++;
          section.marks += q.positive_marks ?? 4;
          finalScore += q.positive_marks ?? 4;
        } else {
          section.wrong++;
          section.marks += q.negative_marks ?? 0;
          finalScore += q.negative_marks ?? 0;
        }
      });

      const formattedAnswers: Record<string, any> = {};
      Object.keys(answers).forEach(qId => {
        formattedAnswers[qId] = { question_id: qId, answer: answers[qId].answer, marked_for_review: answers[qId].marked, time_spent_seconds: 0 };
      });

      await supabase.rpc('submit_exam', {
        p_exam_id: exam.id,
        p_school_id: exam.school_id,
        p_answers: formattedAnswers,
        p_total_marks: finalScore,
        p_section_scores: sectionScores,
        p_time_taken_seconds: exam.duration_minutes * 60,
      });
      await supabase.auth.signOut();
      onExamSubmitted();
    } catch (err) {
      console.error('Auto-submit failed:', err);
      // Still sign out and move on so the student is not stuck
      await supabase.auth.signOut();
      onExamSubmitted();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitExam = async () => {
    setSubmitting(true);
    try {
      let finalScore = 0;
      const sectionScores: any[] = subjects.map(sub => ({ subject_name: sub.subject_name, correct: 0, wrong: 0, unanswered: 0, marks: 0 }));

      questions.forEach((q) => {
        const studentAns = answers[q.id]?.answer;
        const subIdx = subjects.findIndex(s => s.id === q.exam_subject_id);
        const section = sectionScores[subIdx];

        if (studentAns === null || studentAns === '') {
          section.unanswered++;
        } else if (studentAns === q.correct_option) {
          section.correct++;
          section.marks += q.positive_marks ?? 4;
          finalScore += q.positive_marks ?? 4;
        } else {
          section.wrong++;
          section.marks += q.negative_marks ?? 0;
          finalScore += q.negative_marks ?? 0;
        }
      });

      const formattedAnswers: Record<string, any> = {};
      Object.keys(answers).forEach(qId => {
        formattedAnswers[qId] = {
          question_id: qId,
          answer: answers[qId].answer,
          marked_for_review: answers[qId].marked,
          time_spent_seconds: 0
        };
      });

      const { error } = await supabase.rpc('submit_exam', {
        p_exam_id: exam.id,
        p_school_id: exam.school_id,
        p_answers: formattedAnswers,
        p_total_marks: finalScore,
        p_section_scores: sectionScores,
        p_time_taken_seconds: (exam.duration_minutes * 60) - timeLeft
      });

      if (error) {
        console.error('RPC Submit Error:', error);
        throw error;
      }

      await supabase.auth.signOut();
      onExamSubmitted();
    } catch (error) {
      console.error(error);
      alert('Failed to submit exam.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-12 text-center">Loading exam...</div>;

  const summary = getExamSummary();

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans text-[15px] select-none">

      {/* Top Header - White */}
      <header className="h-[90px] border-b-2 border-[#008080] flex items-center justify-between bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#008080] flex items-center justify-center">
            <img src="/logo.png" alt="ParikshaOS Logo" className="w-10 h-10 object-contain" />
          </div>
          <div>
            <h1 className="text-[#008080] text-[20px] font-extrabold tracking-widest m-0 leading-tight uppercase">ParikshaOS</h1>
            <p className="text-[10px] text-[#555555] uppercase tracking-widest">Powered by Growtez</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="w-16 h-16 border-2 border-[#b2d8d8] bg-[#f5f9f9] flex items-center justify-center">
            <svg className="w-12 h-12 text-[#8aacac]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
          </div>
          <div className="flex flex-col text-right">
            <div className="text-[#1a2e2e]"><span className="text-[#555555]">Candidate Name :</span> <span className="text-[#008080] font-bold">[{studentProfile.full_name}]</span></div>
            <div className="text-[#1a2e2e]"><span className="text-[#555555]">Subject Name :</span> <span className="text-[#008080] font-bold">[{exam.title}]</span></div>
            <div className="text-[#1a2e2e]"><span className="text-[#555555]">Remaining Time :</span>
              <span className={`px-2 py-0.5 font-bold ml-1 text-xs text-white ${
                timeLeft <= 300 ? 'bg-red-600 animate-pulse' : 'bg-[#008080]'
              }`}>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Low Time Warning Banner */}
      {timeLeft <= 300 && timeLeft > 0 && (
        <div className="bg-red-600 text-white text-center text-xs font-bold py-1.5 uppercase tracking-widest animate-pulse">
          ⚠ Less than {Math.ceil(timeLeft / 60)} minute{timeLeft > 60 ? 's' : ''} remaining — Exam will auto-submit when time runs out!
        </div>
      )}

      {/* Secondary Bar - Teal */}
      <div className="bg-[#008080] h-[50px] flex items-center justify-between px-6 text-white font-bold uppercase shadow-sm">
        <div className="flex items-center gap-6 h-full">
          <span className="text-sm tracking-widest">{exam.title?.toUpperCase() || 'EXAMINATION'}</span>
          <div className="flex h-full">
            {subjects.map((sub, idx) => (
              <button
                key={sub.id}
                onClick={() => { setCurrentSubjectIndex(idx); setCurrentQuestionIndex(0); }}
                className={`px-6 h-full border-r border-[#006666] transition-colors hover:bg-[#006666] text-sm ${currentSubjectIndex === idx ? 'bg-[#004d4d]' : 'bg-[#007070]'
                  }`}
              >
                {sub.subject_name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center">
            <span className="text-[10px] leading-tight">DOWNLOAD PAPER IN:</span>
            <button className="bg-[#006666] hover:bg-[#004d4d] text-white text-xs px-4 py-1 flex items-center gap-1 border border-[#004d4d]">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              DOWNLOAD
            </button>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="text-[11px] leading-none">Paper Language:</span>
            <select className="text-black bg-white border border-[#004d4d] px-2 py-0.5 text-xs font-normal w-32 outline-none">
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Area - Question Panel */}
        <div className="flex-1 flex flex-col bg-white border-r border-gray-300">

          <div className="flex-1 overflow-y-auto p-6">
            {currentQuestion ? (
              <div>
                <div className="flex items-center justify-between border-b border-gray-300 pb-2 mb-4">
                  <h2 className="text-lg font-bold">Question {currentQuestion.question_number ?? (currentQuestionIndex + 1)}:</h2>
                  <div className="w-6 h-6 bg-[#3b82f6] text-white flex items-center justify-center rounded-full cursor-pointer hover:bg-[#2563eb]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  </div>
                </div>

                <div className="text-base text-gray-800 leading-relaxed max-w-4xl font-serif">
                  <p className="mb-6 whitespace-pre-wrap">{currentQuestion.question_text}</p>
                </div>

                {currentQuestion.question_type === 'mcq' && currentQuestion.options ? (
                  <div className="space-y-4 max-w-lg mt-8 font-serif">
                    {['A', 'B', 'C', 'D'].map((opt, i) => {
                      const selected = answers[currentQuestion.id]?.answer === opt;
                      return (
                        <label key={opt} className="flex items-start gap-4 cursor-pointer group">
                          <input
                            type="radio"
                            name={`q_${currentQuestion.id}`}
                            checked={selected}
                            onChange={() => handleSelectOption(currentQuestion.id, opt)}
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-400 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="flex items-center gap-3">
                            <span className="font-semibold">({i + 1})</span>
                            <span className="text-gray-800 group-hover:text-black">{currentQuestion.options[opt]}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-8 max-w-sm">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Numeric Answer:</label>
                    <input
                      type="text"
                      value={answers[currentQuestion.id]?.answer || ''}
                      onChange={(e) => handleNatChange(currentQuestion.id, e.target.value)}
                      className="border border-gray-400 px-3 py-2 w-full focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">No questions available.</div>
            )}
          </div>

          {/* Action Buttons Footer */}
          <div className="border-t-2 border-[#b2d8d8] p-4 pb-0 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={handleSaveAndNext} className="bg-[#008080] hover:bg-[#006666] text-white px-4 py-2 font-bold text-xs border-b-2 border-[#004d4d] transition-colors uppercase">
                SAVE &amp; NEXT
              </button>
              <button onClick={handleSaveAndMarkForReview} className="bg-[#555555] hover:bg-[#333333] text-white px-4 py-2 font-bold text-xs border-b-2 border-[#222222] transition-colors uppercase">
                SAVE &amp; MARK FOR REVIEW
              </button>
              <button onClick={handleClearResponse} className="bg-white hover:bg-[#f5f9f9] text-[#1a2e2e] px-4 py-2 font-bold text-xs border-2 border-[#b2d8d8] hover:border-[#008080] transition-colors uppercase">
                CLEAR RESPONSE
              </button>
              <button onClick={handleMarkForReviewAndNext} className="bg-[#004d4d] hover:bg-[#003333] text-white px-4 py-2 font-bold text-xs border-b-2 border-[#002222] transition-colors uppercase">
                MARK FOR REVIEW &amp; NEXT
              </button>
            </div>

            <div className="bg-[#e0f2f2] border border-[#b2d8d8] flex items-center justify-between p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="bg-white border-2 border-[#b2d8d8] px-3 py-1 font-bold text-xs text-[#1a2e2e] hover:border-[#008080] disabled:opacity-50">&lt;&lt; BACK
                </button>
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(currentQuestions.length - 1, prev + 1))}
                  disabled={currentQuestionIndex === currentQuestions.length - 1}
                  className="bg-white border-2 border-[#b2d8d8] px-3 py-1 font-bold text-xs text-[#1a2e2e] hover:border-[#008080] disabled:opacity-50">NEXT &gt;&gt;
                </button>
              </div>
              <button onClick={() => setShowSubmitModal(true)} className="bg-[#008080] hover:bg-[#006666] text-white px-6 py-1 font-bold text-sm border-b-2 border-[#004d4d] uppercase">
                SUBMIT
              </button>
            </div>
          </div>
        </div>

        {/* Right Area - Palette Sidebar */}
        <aside className="w-[300px] bg-white flex flex-col border-l-2 border-[#b2d8d8]">
          {/* Legend Table */}
          <div className="p-4 bg-[#f5f9f9] border-b-2 border-[#b2d8d8]">
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[11px] font-medium text-[#1a2e2e]">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-7 bg-[#e0e0e0] border border-[#b0b0b0] flex items-center justify-center relative shadow-sm" style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 20%)' }}>
                  {summary.not_visited}
                </div>
                <span>Not Visited</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-7 bg-[#ea580c] text-white border border-[#c2410c] flex items-center justify-center relative shadow-sm" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)' }}>
                  {summary.not_answered}
                </div>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-7 bg-[#008080] text-white border border-[#006666] flex items-center justify-center relative shadow-sm" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}>
                  <div className="absolute top-0 right-0 w-3 h-3 bg-white" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}></div>
                  {summary.answered}
                </div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-7 bg-[#555555] text-white border border-[#333333] flex items-center justify-center shadow-sm">
                  {summary.review}
                </div>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-start gap-1.5 col-span-2 mt-1">
                <div className="w-8 h-7 bg-[#555555] text-white border border-[#333333] flex items-center justify-center shadow-sm relative shrink-0">
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#008080] border border-white"></div>
                  {summary.answered_review}
                </div>
                <span className="leading-tight mt-0.5">Answered &amp; Marked for Review (will be considered for evaluation)</span>
              </div>
            </div>
          </div>

          <div className="bg-[#008080] text-white font-bold px-4 py-1 text-sm border-y border-[#006666]">
            {subjects[currentSubjectIndex]?.subject_name}
          </div>

          {/* Palette Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#e0f2f2]/30">
            <div className="grid grid-cols-5 gap-2">
              {currentQuestions.map((q, idx) => {
                const status = getQuestionStatus(q.id);
                const active = currentQuestionIndex === idx;

                let btnStyle = { backgroundColor: '#e0e0e0', color: '#374151', border: '1px solid #b0b0b0', clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 20%)' }; // default not visited

                if (status === 'answered') {
                  btnStyle = { backgroundColor: '#008080', color: 'white', border: '1px solid #006666', clipPath: 'polygon(0 0, 80% 0, 100% 20%, 100% 100%, 0 100%)' };
                } else if (status === 'review') {
                  btnStyle = { backgroundColor: '#555555', color: 'white', border: '1px solid #333333', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' };
                } else if (status === 'answered_review') {
                  btnStyle = { backgroundColor: '#555555', color: 'white', border: '1px solid #333333', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' };
                } else if (status === 'not_answered') {
                  btnStyle = { backgroundColor: '#ea580c', color: 'white', border: '1px solid #c2410c', clipPath: 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)' };
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => handlePaletteClick(idx)}
                    className={`w-[45px] h-[35px] flex items-center justify-center font-bold text-sm shadow-sm relative transition-transform hover:scale-110 ${active ? 'ring-2 ring-blue-500 ring-offset-1 scale-105 z-10' : ''}`}
                    style={btnStyle}
                  >
                    {String(idx + 1).padStart(2, '0')}
                    {status === 'answered_review' && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22c55e] rounded-full border border-white translate-x-1 translate-y-1"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button className="bg-black text-white w-6 h-10 flex items-center justify-center absolute right-[300px] top-1/2 -translate-y-1/2 rounded-l-md hover:bg-gray-800 z-10">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </aside>
      </div>

      {/* Auto-submit overlay */}
      {submitting && timeLeft <= 0 && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
          <div className="bg-white border-2 border-red-600 shadow-[4px_4px_0px_#991b1b] p-8 w-full max-w-sm mx-4 text-center">
            <div className="bg-red-600 -mx-8 -mt-8 mb-6 px-8 py-3">
              <span className="text-white font-extrabold text-sm uppercase tracking-widest">Time Up!</span>
            </div>
            <div className="w-14 h-14 bg-red-100 border-2 border-red-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-[#1a2e2e] uppercase tracking-wide mb-2">Auto Submitting...</h3>
            <p className="text-[#555555] text-sm">Your exam time has expired. Your answers are being submitted automatically.</p>
            <div className="mt-4 h-1.5 bg-[#e0f2f2] overflow-hidden">
              <div className="h-full bg-red-500 animate-pulse w-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-[#008080] p-8 w-full max-w-md mx-4 shadow-[4px_4px_0px_#004d4d]">
            <div className="bg-[#008080] -mx-8 -mt-8 mb-6 px-8 py-3">
              <h3 className="text-base font-extrabold text-white uppercase tracking-widest">Confirm Submission</h3>
            </div>
            <p className="text-[#555555] mb-6 text-sm">Are you sure you want to submit your exam? You will not be able to change your answers after submission.</p>
            <div className="flex gap-4 justify-end">
              <button onClick={() => setShowSubmitModal(false)} disabled={submitting} className="px-5 py-2 bg-white hover:bg-[#f5f9f9] text-[#1a2e2e] font-bold text-sm border-2 border-[#b2d8d8] hover:border-[#008080] uppercase">
                CANCEL
              </button>
              <button onClick={handleSubmitExam} disabled={submitting} className="px-5 py-2 bg-[#008080] hover:bg-[#006666] text-white font-bold text-sm border-b-4 border-[#004d4d] uppercase">
                {submitting ? 'SUBMITTING...' : 'YES, SUBMIT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
