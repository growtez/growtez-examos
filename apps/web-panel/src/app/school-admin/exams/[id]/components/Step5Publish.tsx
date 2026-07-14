'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, CreditCard, Play } from 'lucide-react';

interface Step5PublishProps {
  exam: any;
  allStepsComplete: boolean;
  publishing: boolean;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  durationMinutes: number;
  mcqCorrect: number | string;
  mcqWrong: number | string;
  natCorrect: number | string;
  natWrong: number | string;
  subjects: any[];
  questionCounts: Record<string, number>;
  assignedStudentsCount: number;
  examFee: number | null;
  onNavigateToStep: (step: number) => void;
  handlePublish: (bypassPayment: boolean) => void;
  handlePayment: () => void;
}

export default function Step5Publish({
  exam,
  allStepsComplete,
  publishing,
  startTime,
  endTime,
  title,
  description,
  durationMinutes,
  mcqCorrect,
  mcqWrong,
  natCorrect,
  natWrong,
  subjects,
  questionCounts,
  assignedStudentsCount,
  examFee,
  onNavigateToStep,
  handlePublish,
  handlePayment,
}: Step5PublishProps) {
  if (!exam) return null;

  const isSetupComplete =
    title.trim() !== '' &&
    description.trim() !== '' &&
    durationMinutes > 0 &&
    String(mcqCorrect).trim() !== '' &&
    String(mcqWrong).trim() !== '' &&
    String(natCorrect).trim() !== '' &&
    String(natWrong).trim() !== '' &&
    subjects.length > 0 &&
    subjects.some((subject) => (subject.exam_subject_teachers?.length || 0) > 0);
  const isStudentsComplete = assignedStudentsCount > 0;
  const isQuestionsComplete =
    subjects.length > 0 &&
    subjects.every((subject) => (questionCounts[subject.id] || 0) >= subject.question_count);
  const isScheduleComplete = startTime !== '' && endTime !== '';

  const setupMissing = [
    title.trim() === '' ? 'Add exam title' : null,
    description.trim() === '' ? 'Add exam description' : null,
    durationMinutes <= 0 ? 'Set exam duration' : null,
    String(mcqCorrect).trim() === '' ? 'Set MCQ correct marks' : null,
    String(mcqWrong).trim() === '' ? 'Set MCQ wrong marks' : null,
    String(natCorrect).trim() === '' ? 'Set NAT correct marks' : null,
    String(natWrong).trim() === '' ? 'Set NAT wrong marks' : null,
    subjects.length === 0 ? 'Add at least one subject' : null,
    subjects.length > 0 && !subjects.some((subject) => (subject.exam_subject_teachers?.length || 0) > 0)
      ? 'Assign at least one teacher to a subject'
      : null,
  ].filter(Boolean) as string[];

  const incompleteSubjects = subjects
    .filter((subject) => (questionCounts[subject.id] || 0) < subject.question_count)
    .map((subject) => {
      const added = questionCounts[subject.id] || 0;
      return `${subject.subject_name}: ${added}/${subject.question_count} questions`;
    });

  const requirements = [
    {
      step: 1,
      title: 'Setup',
      complete: isSetupComplete,
      details: setupMissing.length > 0 ? setupMissing : ['Complete'],
    },
    {
      step: 2,
      title: 'Students',
      complete: isStudentsComplete,
      details: isStudentsComplete
        ? [`${assignedStudentsCount} assigned`]
        : ['Assign students'],
    },
    {
      step: 3,
      title: 'Questions',
      complete: isQuestionsComplete,
      details: isQuestionsComplete
        ? ['Complete']
        : subjects.length === 0
          ? ['Add subjects']
          : incompleteSubjects,
    },
    {
      step: 4,
      title: 'Schedule',
      complete: isScheduleComplete,
      details: isScheduleComplete
        ? ['Complete']
        : [
            !startTime ? 'Add start time' : null,
            !endTime ? 'Add end time' : null,
          ].filter(Boolean) as string[],
    },
  ];

  const missingCount = requirements.filter((item) => !item.complete).length;
  const canPublish = allStepsComplete && isScheduleComplete;
  const isFeeLoaded = examFee != null;

  return (
    <div className="bg-bg border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-text-main mb-2">Publish Exam</h3>
      <p className="text-text-muted text-sm font-medium mb-6">
        {canPublish
          ? 'Ready to publish.'
          : `${missingCount} pending`}
      </p>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-text-main">Checklist</h4>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                canPublish ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {canPublish ? 'Ready to publish' : 'Needs fixes'}
            </span>
          </div>

          <div className="space-y-4">
            {requirements.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => onNavigateToStep(item.step)}
                className="w-full border-b border-border/70 pb-4 text-left transition-colors hover:bg-bg/40 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  {item.complete ? (
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                  ) : (
                    <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={18} />
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${item.complete ? 'text-emerald-700' : 'text-red-700'}`}>
                      {item.title}
                    </p>
                    <ul className={`mt-1 space-y-1 text-xs font-semibold ${item.complete ? 'text-emerald-700/85' : 'text-red-700/90'}`}>
                      {item.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-5">
            <h4 className="text-sm font-bold text-text-main">Publish actions</h4>
          </div>

          <div className="flex flex-col gap-3">
            {exam.is_paid ? (
              <button
                onClick={() => handlePublish(false)}
                disabled={!canPublish || publishing}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-primary hover:bg-accent-primary/80 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
              >
                <Play size={16} />
                {publishing ? 'Publishing...' : 'Publish Exam'}
              </button>
            ) : (
              <>
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
                  <p className="text-xs font-bold uppercase">Price</p>
                  <p className="mt-1 text-lg font-bold">
                    {isFeeLoaded ? `Rs ${examFee}` : 'Loading...'}
                  </p>
                </div>
                <button
                  onClick={handlePayment}
                  disabled={!canPublish || publishing || !isFeeLoaded}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                >
                  <CreditCard size={16} />
                  Pay & Publish
                </button>
                <button
                  onClick={() => handlePublish(true)}
                  disabled={!canPublish || publishing}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                  title="Dev Tool: Skip payment entirely"
                >
                  <Play size={14} /> Dev Publish
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
