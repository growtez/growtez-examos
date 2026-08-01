'use client';

import React, { useRef, useState, useEffect } from 'react';
import { CalendarDays, Clock3, AlertCircle } from 'lucide-react';

interface Step4ScheduleProps {
  startTime: string;
  setStartTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  autoSaveSchedule: (currentStartTime?: string, currentEndTime?: string) => Promise<void>;
  durationMinutes: number;
  stepsBeforeScheduleComplete: boolean;
  publishing: boolean;
  isPublished?: boolean;
  isReadOnly?: boolean;
}

export default function Step4Schedule({
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  autoSaveSchedule,
  durationMinutes,
  isPublished = false,
  isReadOnly = false,
}: Step4ScheduleProps) {
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openPicker = (input: HTMLInputElement | null) => {
    if (!input) return;
    input.focus();
    input.showPicker?.();
  };

  const getPresentTimestamp = () => {
    const d = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const isStartTimePast = mounted && startTime ? new Date(startTime).getTime() < Date.now() - 60000 : false;
  const isEndTimePast = mounted && endTime ? new Date(endTime).getTime() <= Date.now() : false;
  const isSchedulePast = mounted && (isStartTimePast || isEndTimePast);

  // Calculate actual gap between start and end times when both are set
  const actualGapMinutes = (startTime && endTime)
    ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)
    : null;

  const displayDuration = (actualGapMinutes !== null && actualGapMinutes > 0)
    ? actualGapMinutes
    : durationMinutes;

  return (
    <div className="bg-bg border border-border rounded-2xl p-6 shadow-sm">
      {isReadOnly && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
          Exam has started — schedule is now locked.
        </div>
      )}
      {isPublished && !isReadOnly && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700">
          Exam is published — you can still adjust the schedule until the exam starts.
        </div>
      )}
      {isSchedulePast && !isReadOnly && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>
              The schedule time is in the past relative to the present timestamp. Please provide a correct schedule time.
            </span>
          </div>
        </div>
      )}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-text-muted">
          Choose when the exam opens and when submissions close.
        </p>
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text-main">
          <Clock3 size={14} className="text-accent-primary" />
          {displayDuration} min duration
          {actualGapMinutes !== null && actualGapMinutes !== durationMinutes && actualGapMinutes > 0 && (
            <span className="ml-1 text-[10px] font-semibold text-amber-500">(exam: {durationMinutes} min)</span>
          )}
        </div>
      </div>

      <div className={`grid gap-4 lg:grid-cols-2 ${isReadOnly ? 'pointer-events-none select-none opacity-75' : ''}`}>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all focus-within:border-accent-primary focus-within:ring-2 focus-within:ring-accent-primary/15">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-text-main">
                Start date & time *
              </label>
              <p className="mt-1 text-xs font-medium text-text-muted">
                Auto-publishes the exam.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openPicker(startInputRef.current)}
              disabled={isReadOnly}
              aria-label="Open start date and time picker"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg text-accent-primary transition-all hover:border-accent-primary hover:bg-accent-primary/5"
            >
              <CalendarDays size={18} />
            </button>
          </div>
          <input
            ref={startInputRef}
            type="datetime-local"
            min={mounted ? getPresentTimestamp() : undefined}
            value={startTime}
            disabled={isReadOnly}
            onClick={(e) => openPicker(e.currentTarget)}
            onChange={(e) => {
              const newStart = e.target.value;
              setStartTime(newStart);
              if (newStart && durationMinutes > 0) {
                const end = new Date(new Date(newStart).getTime() + durationMinutes * 60000);
                const endString = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                setEndTime(endString);
                void autoSaveSchedule(newStart, endString);
                return;
              }
              void autoSaveSchedule(newStart, endTime);
            }}
            className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm font-semibold text-text-main shadow-inner transition-all [color-scheme:light] focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all focus-within:border-accent-primary focus-within:ring-2 focus-within:ring-accent-primary/15">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-text-main">
                End date & time *
              </label>
              <p className="mt-1 text-xs font-medium text-text-muted">
                Auto-calculated, but editable.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openPicker(endInputRef.current)}
              disabled={isReadOnly}
              aria-label="Open end date and time picker"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg text-accent-primary transition-all hover:border-accent-primary hover:bg-accent-primary/5"
            >
              <CalendarDays size={18} />
            </button>
          </div>
          <input
            ref={endInputRef}
            type="datetime-local"
            value={endTime}
            disabled={isReadOnly}
            onClick={(e) => openPicker(e.currentTarget)}
            onChange={(e) => {
              const newEnd = e.target.value;
              setEndTime(newEnd);
              void autoSaveSchedule(startTime, newEnd);
            }}
            className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm font-semibold text-text-main shadow-inner transition-all [color-scheme:light] focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}