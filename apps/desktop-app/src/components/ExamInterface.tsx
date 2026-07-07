import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (!exam.end_time) {
          return Math.max(0, prev - 1);
        }
        const now = new Date(Date.now() + serverTimeOffset).getTime();
        const endTime = new Date(exam.end_time).getTime();
        return Math.max(0, Math.floor((endTime - now) / 1000));
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam.end_time, serverTimeOffset]);


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
      <header className="h-[90px] border-b flex items-center justify-between bg-white px-6">
        <div className="flex items-center gap-3">
          {/* Mock NTA Logo */}
          <div className="w-16 h-16 bg-white rounded-full border-[3px] border-green-600 flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-orange-500 rounded-full scale-[0.8] clip-path-polygon" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 70%)' }}></div>
            <svg className="w-10 h-10 text-green-600 absolute z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <h1 className="text-[#1e3b8a] text-[22px] font-extrabold tracking-wide uppercase m-0 leading-tight">growtez ExamOS</h1>
            <p className="text-white bg-[#22c55e] px-2 py-0.5 text-xs font-bold inline-block italic mt-0.5 tracking-wide">Excellence in Assessment</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="w-16 h-16 border-2 border-gray-400 bg-gray-100 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
          </div>
          <div className="flex flex-col text-right">
            <div className="text-gray-800"><span className="text-gray-500">Candidate Name :</span> <span className="text-orange-600 font-bold">[{studentProfile.full_name}]</span></div>
            <div className="text-gray-800"><span className="text-gray-500">Subject Name :</span> <span className="text-orange-600 font-bold">[{exam.title}]</span></div>
            <div className="text-gray-800"><span className="text-gray-500">Remaining Time :</span> <span className="bg-[#3b82f6] text-white px-2 py-0.5 rounded-sm font-bold ml-1">{formatTime(timeLeft)}</span></div>
          </div>
        </div>
      </header>

      {/* Secondary Bar - Orange */}
      <div className="bg-[#f97316] h-[50px] flex items-center justify-between px-6 text-white font-bold uppercase shadow-sm">
        <div className="flex items-center gap-6 h-full">
          <span className="text-lg tracking-wider">JEE MAIN</span>
          <div className="flex h-full">
            {subjects.map((sub, idx) => (
              <button
                key={sub.id}
                onClick={() => { setCurrentSubjectIndex(idx); setCurrentQuestionIndex(0); }}
                className={`px-6 h-full border-r border-[#ea580c] transition-colors hover:bg-[#1d4ed8] ${currentSubjectIndex === idx ? 'bg-[#2563eb]' : 'bg-[#3b82f6]'
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
            <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs px-4 py-1 flex items-center gap-1 border border-blue-400/50">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              DOWNLOAD
            </button>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="text-[11px] leading-none">Paper Language:</span>
            <select className="text-black bg-white border border-gray-300 px-2 py-0.5 text-xs font-normal w-32 outline-none">
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
          <div className="border-t border-gray-300 p-4 pb-0 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={handleSaveAndNext} className="bg-[#4ade80] hover:bg-[#22c55e] text-white px-4 py-2 font-bold text-xs shadow-[1px_1px_3px_rgba(0,0,0,0.3)] border border-green-600 transition-colors uppercase">
                SAVE & NEXT
              </button>
              <button onClick={handleSaveAndMarkForReview} className="bg-[#fb923c] hover:bg-[#f97316] text-white px-4 py-2 font-bold text-xs shadow-[1px_1px_3px_rgba(0,0,0,0.3)] border border-orange-600 transition-colors uppercase">
                SAVE & MARK FOR REVIEW
              </button>
              <button onClick={handleClearResponse} className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 font-bold text-xs shadow-[1px_1px_3px_rgba(0,0,0,0.3)] border border-gray-300 transition-colors uppercase">
                CLEAR RESPONSE
              </button>
              <button onClick={handleMarkForReviewAndNext} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 font-bold text-xs shadow-[1px_1px_3px_rgba(0,0,0,0.3)] border border-blue-600 transition-colors uppercase">
                MARK FOR REVIEW & NEXT
              </button>
            </div>

            <div className="bg-gray-100 border border-gray-300 flex items-center justify-between p-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="bg-white border border-gray-300 px-3 py-1 font-bold text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                  &lt;&lt; BACK
                </button>
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(currentQuestions.length - 1, prev + 1))}
                  disabled={currentQuestionIndex === currentQuestions.length - 1}
                  className="bg-white border border-gray-300 px-3 py-1 font-bold text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                  NEXT &gt;&gt;
                </button>
              </div>
              <button onClick={() => setShowSubmitModal(true)} className="bg-[#4ade80] hover:bg-[#22c55e] text-white px-6 py-1 font-bold text-sm border border-green-600">
                SUBMIT
              </button>
            </div>
          </div>
        </div>

        {/* Right Area - Palette Sidebar */}
        <aside className="w-[300px] bg-white flex flex-col">
          {/* Legend Table */}
          <div className="p-4 bg-white border-b border-gray-300">
            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[11px] font-medium text-gray-700">
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-7 bg-gray-200 border border-gray-300 flex items-center justify-center relative shadow-sm" style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 20%)' }}>
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
                <div className="w-8 h-7 bg-[#22c55e] text-white border border-[#16a34a] flex items-center justify-center relative shadow-sm" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}>
                  <div className="absolute top-0 right-0 w-3 h-3 bg-white" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}></div>
                  {summary.answered}
                </div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-7 bg-[#7e22ce] text-white border border-[#6b21a8] flex items-center justify-center rounded-full shadow-sm">
                  {summary.review}
                </div>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-start gap-1.5 col-span-2 mt-1">
                <div className="w-8 h-7 bg-[#7e22ce] text-white border border-[#6b21a8] flex items-center justify-center rounded-full shadow-sm relative shrink-0">
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22c55e] rounded-full border border-white"></div>
                  {summary.answered_review}
                </div>
                <span className="leading-tight mt-0.5">Answered & Marked for Review (will be considered for evaluation)</span>
              </div>
            </div>
          </div>

          <div className="bg-[#3b82f6] text-white font-bold px-4 py-1 text-sm border-y border-blue-400">
            {subjects[currentSubjectIndex]?.subject_name}
          </div>

          {/* Palette Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#e5e7eb]/30">
            <div className="grid grid-cols-5 gap-2">
              {currentQuestions.map((q, idx) => {
                const status = getQuestionStatus(q.id);
                const active = currentQuestionIndex === idx;

                let btnStyle = { backgroundColor: '#e5e7eb', color: '#374151', border: '1px solid #d1d5db', clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 20%)' }; // default not visited

                if (status === 'answered') {
                  btnStyle = { backgroundColor: '#22c55e', color: 'white', border: '1px solid #16a34a', clipPath: 'polygon(0 0, 80% 0, 100% 20%, 100% 100%, 0 100%)' }; // Green with clipped top-right
                } else if (status === 'review') {
                  btnStyle = { backgroundColor: '#7e22ce', color: 'white', border: '1px solid #6b21a8', clipPath: 'circle(50% at 50% 50%)' }; // Purple circle
                } else if (status === 'answered_review') {
                  btnStyle = { backgroundColor: '#7e22ce', color: 'white', border: '1px solid #6b21a8', clipPath: 'circle(50% at 50% 50%)' }; // Purple circle with dot handled below
                } else if (status === 'not_answered') {
                  btnStyle = { backgroundColor: '#ea580c', color: 'white', border: '1px solid #c2410c', clipPath: 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)' }; // Orange with clipped bottom-right
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

      {/* Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 p-8 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Confirm Submission</h3>
            <p className="text-gray-600 mb-6 text-sm">Are you sure you want to submit your exam? You will not be able to change your answers after submission.</p>
            <div className="flex gap-4 justify-end">
              <button onClick={() => setShowSubmitModal(false)} disabled={submitting} className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-sm border border-gray-300">
                CANCEL
              </button>
              <button onClick={handleSubmitExam} disabled={submitting} className="px-5 py-2 bg-[#4ade80] hover:bg-[#22c55e] text-white font-bold text-sm border border-green-600">
                {submitting ? 'SUBMITTING...' : 'YES, SUBMIT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
