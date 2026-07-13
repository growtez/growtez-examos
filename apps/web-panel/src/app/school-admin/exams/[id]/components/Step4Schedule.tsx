'use client';

import React from 'react';

interface Step4ScheduleProps {
  startTime: string;
  setStartTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  durationMinutes: number;
  stepsBeforeScheduleComplete: boolean;
  publishing: boolean;
}

export default function Step4Schedule({
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  durationMinutes,
  stepsBeforeScheduleComplete,
  publishing,
}: Step4ScheduleProps) {
  return (
    <div className="bg-bg border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-text-main mb-2">Schedule Exam</h3>
      <p className="text-text-muted text-sm font-medium mb-6">
        Set the start and end times for the exam.
      </p>
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-text-main mb-1.5">Start Time (Auto-publish) *</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => {
              const newStart = e.target.value;
              setStartTime(newStart);
              if (newStart && durationMinutes > 0) {
                const end = new Date(new Date(newStart).getTime() + durationMinutes * 60000);
                const endString = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                setEndTime(endString);
              }
            }}
            disabled={!stepsBeforeScheduleComplete || publishing}
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all disabled:opacity-50 text-sm font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-main mb-1.5">End Time (Auto-end) *</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={!stepsBeforeScheduleComplete || publishing}
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all disabled:opacity-50 text-sm font-medium"
          />
        </div>
      </div>
    </div>
  );
}
