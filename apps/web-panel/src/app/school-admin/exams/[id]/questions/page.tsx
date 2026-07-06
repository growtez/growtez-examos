'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

  // Question form
  const [questionType, setQuestionType] = useState<'mcq' | 'nat'>('mcq');
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [natAnswer, setNatAnswer] = useState('');

  useEffect(() => { init(); }, []);
  useEffect(() => { if (selectedSubject) fetchQuestions(); }, [selectedSubject]);

  const init = async () => {
    const { data: examData } = await supabase.from('exams').select('*').eq('id', params.id).single();
    setExam(examData);

    const { data: subjectsData } = await supabase
      .from('exam_subjects')
      .select('*')
      .eq('exam_id', params.id)
      .order('sort_order');
    setSubjects(subjectsData || []);

    if (!selectedSubject && subjectsData && subjectsData.length > 0) {
      setSelectedSubject(subjectsData[0].id);
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

      const questionNumber = questions.length + 1;
      const markingScheme = exam.marking_scheme || {};

      const questionData: any = {
        exam_id: params.id,
        school_id: exam.school_id,
        exam_subject_id: selectedSubject,
        question_type: questionType,
        question_text: questionText,
        question_number: questionNumber,
        marks: questionType === 'mcq' ? (markingScheme.mcq_correct || 4) : (markingScheme.nat_correct || 4),
        positive_marks: questionType === 'mcq' ? (markingScheme.mcq_correct || 4) : (markingScheme.nat_correct || 4),
        negative_marks: questionType === 'mcq' ? (markingScheme.mcq_wrong || -1) : (markingScheme.nat_wrong || 0),
      };

      if (questionType === 'mcq') {
        questionData.options = { A: optionA, B: optionB, C: optionC, D: optionD };
        questionData.correct_option = correctAnswer;
      } else {
        questionData.options = {};
        questionData.correct_option = natAnswer;
      }

      const { error: insertError } = await supabase.from('questions').insert(questionData);
      if (insertError) throw insertError;

      // Reset form
      setQuestionText(''); setOptionA(''); setOptionB(''); setOptionC(''); setOptionD('');
      setCorrectAnswer('A'); setNatAnswer(''); setShowForm(false);
      fetchQuestions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Delete this question?')) return;
    await supabase.from('questions').delete().eq('id', qId);
    fetchQuestions();
  };

  const currentSubject = subjects.find(s => s.id === selectedSubject);

  if (loading) return <div className="text-gray-500 p-12 text-center">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/exams/${params.id}`} className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 text-sm transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to Exam
        </Link>
        <h2 className="text-2xl font-bold text-gray-900">{exam?.title} — Questions</h2>
      </div>

      {/* Subject Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {subjects.map((s) => (
          <button key={s.id} onClick={() => setSelectedSubject(s.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              selectedSubject === s.id
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-white text-gray-500 border border-gray-300 hover:text-gray-900'
            }`}>
            {s.subject_name}
          </button>
        ))}
      </div>

      {/* Progress */}
      {currentSubject && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <span className="text-gray-900 font-medium">{currentSubject.subject_name}</span>
            <span className={`ml-3 text-sm ${questions.length >= currentSubject.question_count ? 'text-emerald-400' : 'text-amber-400'}`}>
              {questions.length} / {currentSubject.question_count} questions
            </span>
          </div>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-gray-900 font-medium rounded-xl text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Question
          </button>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4 mb-8">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-xs text-gray-500 font-mono">{idx + 1}</span>
                <span className={`text-xs px-2 py-0.5 rounded-md ${q.question_type === 'mcq' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {q.question_type?.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400">+{q.positive_marks}/{q.negative_marks}</span>
              </div>
              <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
            </div>
            <p className="text-gray-900 mb-3">{q.question_text}</p>
            {q.question_type === 'mcq' && q.options && (
              <div className="grid grid-cols-2 gap-2">
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div key={opt} className={`px-3 py-2 rounded-lg text-sm ${q.correct_option === opt ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white text-gray-500 border border-gray-300'}`}>
                    <span className="font-medium mr-2">{opt}.</span>{q.options[opt]}
                  </div>
                ))}
              </div>
            )}
            {q.question_type === 'nat' && (
              <div className="text-sm text-emerald-400">Answer: {q.correct_option}</div>
            )}
          </div>
        ))}
      </div>

      {/* Add Question Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Question — {currentSubject?.subject_name}</h3>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              {/* Question Type */}
              <div className="flex gap-3">
                <button type="button" onClick={() => setQuestionType('mcq')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${questionType === 'mcq' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-white border-gray-300 text-gray-500'}`}>
                  MCQ (Multiple Choice)
                </button>
                <button type="button" onClick={() => setQuestionType('nat')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${questionType === 'nat' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-white border-gray-300 text-gray-500'}`}>
                  NAT (Numerical)
                </button>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Question</label>
                <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} required rows={3}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                  placeholder="Enter question text..." />
              </div>

              {questionType === 'mcq' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: 'Option A', value: optionA, set: setOptionA }, { label: 'Option B', value: optionB, set: setOptionB }, { label: 'Option C', value: optionC, set: setOptionC }, { label: 'Option D', value: optionD, set: setOptionD }].map((opt) => (
                      <div key={opt.label}>
                        <label className="block text-xs text-gray-500 mb-1">{opt.label}</label>
                        <input type="text" value={opt.value} onChange={(e) => opt.set(e.target.value)} required
                          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Correct Answer</label>
                    <div className="flex gap-2">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <button key={opt} type="button" onClick={() => setCorrectAnswer(opt)}
                          className={`w-12 h-10 rounded-lg text-sm font-bold transition-all ${correctAnswer === opt ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-white border border-gray-300 text-gray-500 hover:text-gray-900'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Correct Numerical Answer</label>
                  <input type="text" value={natAnswer} onChange={(e) => setNatAnswer(e.target.value)} required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="e.g. 42.5" />
                </div>
              )}

              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={formLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-gray-900 font-medium rounded-xl disabled:opacity-50">
                  {formLoading ? 'Adding...' : 'Add Question'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
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
