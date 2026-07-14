'use client';

import React from 'react';
import { Play, CreditCard } from 'lucide-react';

interface Step5PublishProps {
  exam: any;
  allStepsComplete: boolean;
  publishing: boolean;
  startTime: string;
  endTime: string;
  examFee: number;
  handlePublish: (bypassPayment: boolean) => void;
  handlePayment: () => void;
}

export default function Step5Publish({
  exam,
  allStepsComplete,
  publishing,
  startTime,
  endTime,
  examFee,
  handlePublish,
  handlePayment,
}: Step5PublishProps) {
  if (!exam) return null;

  return (
    <div className="bg-bg border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-text-main mb-2">Publish Exam</h3>
      <p className="text-text-muted text-sm font-medium mb-6">
        {allStepsComplete
          ? 'All steps are complete. You can now publish the exam.'
          : 'Some steps are still incomplete. Finish all steps before publishing.'}
      </p>
      
      <div className="flex items-center gap-4">
        {exam.is_paid ? (
          <button
            onClick={() => handlePublish(false)}
            disabled={!allStepsComplete || publishing || !startTime || !endTime}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-primary hover:bg-accent-primary/80 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
          >
            <Play size={16} />
            {publishing ? 'Publishing...' : 'Publish Exam'}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePayment}
              disabled={!allStepsComplete || publishing || !startTime || !endTime}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
            >
              <CreditCard size={16} />
              Pay ₹{examFee} to Publish
            </button>
            <button
              onClick={() => handlePublish(true)}
              disabled={!allStepsComplete || publishing || !startTime || !endTime}
              className="inline-flex items-center gap-1.5 px-4 py-3 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
              title="Dev Tool: Skip payment entirely"
            >
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
    </div>
  );
}
