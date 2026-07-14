'use client';

import React, { useRef } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';

interface Step4ScheduleProps {
  startTime: string;
  setStartTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  autoSaveSchedule: (currentStartTime?: string, currentEndTime?: string) => Promise<void>;
  durationMinutes: number;
  stepsBeforeScheduleComplete: boolean;
  publishing: boolean;
}

export default function Step4Schedule({
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  autoSaveSchedule,
  durationMinutes,
}: Step4ScheduleProps) {
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  const openPicker = (input: HTMLInputElement | null) => {
    if (!input) return;
    input.focus();
    input.showPicker?.();
  };

  return (
    <div className="bg-bg border border-border rounded-2xl p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-text-muted">
          Choose when the exam opens and when submissions close.
        </p>
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text-main">
          <Clock3 size={14} className="text-accent-primary" />
          {durationMinutes} min duration
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
              aria-label="Open start date and time picker"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg text-accent-primary transition-all hover:border-accent-primary hover:bg-accent-primary/5"
            >
              <CalendarDays size={18} />
            </button>
          </div>
          <input
            ref={startInputRef}
            type="datetime-local"
            value={startTime}
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
