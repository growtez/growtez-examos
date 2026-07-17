'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StudentResultPage({ params }: { params: { exam_id: string } }) {
  const supabase = createClient();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Result State
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data, error: examError } = await supabase
          .from('exams')
          .select('*, schools(name)')
          .eq('id', params.exam_id)
          .single();

        if (examError || !data) throw new Error('Exam not found');
        if (data.status !== 'completed') throw new Error('Results for this exam are not yet published');
        
        setExam(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [params.exam_id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumber || !dob) {
      setSubmitError('Please enter both Roll Number and Date of Birth');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setResult(null);

    try {
      // 1. Find the student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, full_name')
        .eq('roll_number', rollNumber.trim())
        .eq('date_of_birth', dob)
        .eq('school_id', exam.school_id)
        .single();

      if (studentError || !student) {
        throw new Error('Invalid Roll Number or Date of Birth');
      }

      // 2. Find the result
      const { data: res, error: resultError } = await supabase
        .from('results')
        .select('*')
        .eq('exam_id', params.exam_id)
        .eq('student_id', student.id)
        .single();

      if (resultError || !res) {
        throw new Error('No result found for this student in this exam');
      }

      setResult({ ...res, studentName: student.full_name });
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadAnswerKey = () => {
    if (!result?.id) return;
    const link = document.createElement('a');
    link.href = `/api/download/answer-key?resultId=${result.id}`;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg p-4">
        <div className="bg-surface p-8 rounded-2xl shadow-sm border border-border max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-main mb-2">Unavailable</h2>
          <p className="text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg font-sans text-text-main">
      <header className="border-b border-accent-primary flex items-center justify-center bg-surface px-6 h-[70px] shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="text-accent-primary text-[18px] font-extrabold tracking-widest m-0 leading-tight">ParikshaOS</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl shadow-xl overflow-hidden border border-border">
            <div className="bg-accent-primary py-5 px-6 text-center">
              <span className="text-white/80 font-bold text-[10px] uppercase tracking-widest block mb-1">
                {exam.schools?.name}
              </span>
              <h2 className="text-white font-extrabold text-lg line-clamp-2">
                {exam.title}
              </h2>
            </div>

            <div className="p-6 md:p-8">
              {!result ? (
                <>
                  <div className="mb-6 text-center">
                    <h3 className="text-lg font-bold text-text-main">Check Your Result</h3>
                    <p className="text-sm text-text-muted mt-1">Enter your details to view your score and download the answer key.</p>
                  </div>

                  {submitError && (
                    <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 font-medium flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      {submitError}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
                        Roll Number
                      </label>
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        required
                        placeholder="Enter your roll number"
                        className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-accent-primary hover:bg-accent-primary/90 text-white font-bold rounded-xl transition-all shadow-sm shadow-accent-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'View Result'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-text-main mb-1">{result.studentName}</h3>
                  <p className="text-sm text-text-muted font-medium mb-6">Roll No: {rollNumber}</p>
                  
                  <div className="bg-surface-hover border border-border rounded-xl p-5 mb-6">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Total Score</p>
                    <p className="text-4xl font-black text-accent-primary">
                      {result.total_marks}
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadAnswerKey}
                    className="w-full py-3 bg-surface border border-accent-primary text-accent-primary font-bold rounded-xl transition-all hover:bg-accent-primary hover:text-white flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Download Answer Key
                  </button>
                  
                  <button
                    onClick={() => {
                      setResult(null);
                      setRollNumber('');
                      setDob('');
                      setSubmitError(null);
                    }}
                    className="mt-4 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
                  >
                    Check another result
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
