'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, BookOpen, ChevronDown, Info, AlertCircle } from 'lucide-react';

/**
 * A single-line-looking field that wraps text and grows its height
 * as content increases, instead of overflowing/scrolling horizontally
 * like a normal <input>.
 */
function AutoGrowInput({
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  className,
  id,
}: {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      id={id}
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      rows={1}
      className={`${className} resize-none overflow-hidden whitespace-pre-wrap break-words`}
    />
  );
}

/**
 * A card that becomes a collapsible accordion on mobile (tap the header
 * to expand/collapse) but stays always-expanded, non-collapsible on
 * sm screens and up.
 */
function CollapsibleCard({
  title,
  headerExtra,
  expanded,
  onToggle,
  className,
  children,
  hasError = false,
}: {
  title: string;
  headerExtra?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  className?: string;
  children: React.ReactNode;
  hasError?: boolean;
}) {
  return (
    <div className={`bg-surface border-2 rounded-xl p-3.5 sm:p-4 shadow-sm h-full transition-all group ${
      hasError ? 'border-red-500 bg-red-50/10 shadow-red-500/10' : 'border-border/50 hover:border-accent-primary/30 hover:shadow-md'
    } ${className || ''}`}>
      <div
        className="w-full flex items-center justify-between gap-2 mb-3 border-b border-[#f0f7f7] pb-1.5"
      >
        <span className="flex items-center gap-1.5">
          <h3 className={`text-sm font-bold ${hasError ? 'text-red-600' : 'text-text-main'}`}>{title}</h3>
          {hasError && (
            <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-200 shrink-0">
              Required Fields Missing
            </span>
          )}
        </span>
        {headerExtra && (
          <span>{headerExtra}</span>
        )}
      </div>
      <div className="block">{children}</div>
    </div>
  );
}


interface Step1DetailsProps {
  role: string;
  isExamOver: boolean;
  exam: any;
  title: string;
  setTitle: (val: string) => void;
  setExam: React.Dispatch<React.SetStateAction<any>>;
  description: string;
  setDescription: (val: string) => void;
  durationMinutes: number;
  setDurationMinutes: (val: number) => void;
  startTime: string;
  setEndTime: (val: string) => void;
  mcqCorrect: number | string;
  setMcqCorrect: (val: number | string) => void;
  mcqWrong: number | string;
  setMcqWrong: (val: number | string) => void;
  natCorrect: number | string;
  setNatCorrect: (val: number | string) => void;
  natWrong: number | string;
  setNatWrong: (val: number | string) => void;
  msqCorrect: number | string;
  setMsqCorrect: (val: number | string) => void;
  msqPartial: number | string;
  setMsqPartial: (val: number | string) => void;
  msqWrong: number | string;
  setMsqWrong: (val: number | string) => void;
  msqPartialEnabled: boolean;
  setMsqPartialEnabled: (val: boolean) => void;
  msqEnabled: boolean;
  setMsqEnabled: (val: boolean) => void;
  instructionsList: string[];
  updateInstructionItem: (index: number, value: string) => void;
  addInstructionItem: () => void;
  removeInstructionItem: (index: number) => void;
  autoSaveExamDetails: (
    title?: string,
    description?: string,
    durationMinutes?: number,
    mcqCorrect?: number | string,
    mcqWrong?: number | string,
    natCorrect?: number | string,
    natWrong?: number | string,
    msqCorrect?: string | number,
    msqPartial?: string | number,
    msqWrong?: string | number,
    msqPartialEnabled?: boolean,
    msqEnabled?: boolean,
    instructionsList?: string[]
  ) => void;
  setShowInstructionPreview: (val: boolean) => void;
  subjects: any[];
  questionCounts: Record<string, number>;
  setShowAddSubjectModal: (val: boolean) => void;
  editSubjectId: string | null;
  setEditSubjectId: (val: string | null) => void;
  inlineEditSubjectCount: number;
  setInlineEditSubjectCount: (val: number) => void;
  handleSaveSubjectCount: (subjectId: string) => void;
  handleDeleteSubject: (e: any, id: string, name: string) => void;
  handleMoveSubject?: (index: number, direction: 'left' | 'right') => void;
  handleReorderSubjects?: (fromIndex: number, toIndex: number) => void;
  setManageTeachersSubject: (subject: any) => void;
  setSelectedTeacherIds: (ids: string[]) => void;
  setTeacherSearchQuery: (query: string) => void;
  handleSaveExamDetails: (e: React.FormEvent) => void;
  paramsId: string;
  isReadOnly?: boolean;
  showStep1Errors?: boolean;
  expandAll?: boolean;
}

const GENERAL_INSTRUCTIONS = [
  'Do not refresh the page or close the application once the exam has started.',
  'The timer will run continuously. If you get disconnected, your time will keep running on the server.',
  'Your answers are automatically saved as you select them.',
  'Once the exam end time is reached, it will be automatically submitted regardless of your progress.',
];

export default function Step1Details({
  role,
  isExamOver,
  exam,
  title,
  setTitle,
  setExam,
  description,
  setDescription,
  durationMinutes,
  setDurationMinutes,
  startTime,
  setEndTime,
  mcqCorrect,
  setMcqCorrect,
  mcqWrong,
  setMcqWrong,
  natCorrect,
  setNatCorrect,
  natWrong,
  setNatWrong,
  msqCorrect,
  setMsqCorrect,
  msqPartial,
  setMsqPartial,
  msqWrong,
  setMsqWrong,
  msqPartialEnabled,
  setMsqPartialEnabled,
  msqEnabled,
  setMsqEnabled,
  instructionsList,
  updateInstructionItem,
  addInstructionItem,
  removeInstructionItem,
  autoSaveExamDetails,
  setShowInstructionPreview,
  subjects,
  questionCounts,
  setShowAddSubjectModal,
  editSubjectId,
  setEditSubjectId,
  inlineEditSubjectCount,
  setInlineEditSubjectCount,
  handleSaveSubjectCount,
  handleDeleteSubject,
  handleMoveSubject,
  handleReorderSubjects,
  setManageTeachersSubject,
  setSelectedTeacherIds,
  setTeacherSearchQuery,
  handleSaveExamDetails,
  paramsId,
  isReadOnly = false,
  showStep1Errors = false,
  expandAll,
}: Step1DetailsProps) {
  const [expandedCards, setExpandedCards] = useState({
    details: true,
    marking: true,
    instructions: true,
    subjects: true,
  });

  const [draggedSubjectIndex, setDraggedSubjectIndex] = useState<number | null>(null);
  const [draggedOverSubjectIndex, setDraggedOverSubjectIndex] = useState<number | null>(null);
  const [showPartialTooltip, setShowPartialTooltip] = useState(false);
  const allExpanded = Object.values(expandedCards).every(Boolean);
  const toggleCard = (key: keyof typeof expandedCards) =>
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleAll = () => {
    const next = !allExpanded;
    setExpandedCards({ details: next, marking: next, subjects: next, instructions: next });
  };

  // Sync from parent-controlled expand/collapse (mobile header button)
  useEffect(() => {
    if (expandAll !== undefined) {
      setExpandedCards({ details: expandAll, marking: expandAll, subjects: expandAll, instructions: expandAll });
    }
  }, [expandAll]);

  useEffect(() => {
    if (showStep1Errors) {
      setExpandedCards({ details: true, marking: true, subjects: true, instructions: true });
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showStep1Errors]);

  return (
    <form
      onSubmit={(e) => {
        if (isReadOnly) { e.preventDefault(); return; }
        handleSaveExamDetails(e);
      }}
      className={`space-y-4 mb-6 ${isReadOnly ? 'pointer-events-none select-none opacity-75' : ''}`}
    >
      {isReadOnly && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-600">
          This exam is published — details are read-only.
        </div>
      )}
      {showStep1Errors && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex items-center gap-3 text-xs font-semibold text-red-600 shadow-sm">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <span>Please fill in all required fields marked in red (and add at least 1 subject) before proceeding.</span>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exam Details */}
        <CollapsibleCard
          title="Exam Details"
          expanded={expandedCards.details}
          onToggle={() => toggleCard('details')}
          hasError={showStep1Errors && (title.trim() === '' || !durationMinutes || durationMinutes < 1)}
          className="order-1"
        >
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Title *</label>
              <input
                id="exam-title-input"
                type="text"
                value={title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setTitle(newTitle);
                  setExam((prev: any) => (prev ? { ...prev, title: newTitle } : null));
                  window.dispatchEvent(new CustomEvent('breadcrumb-update', { detail: { id: paramsId, title: newTitle } }));
                }}
                onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, msqCorrect, msqPartial, msqWrong, msqPartialEnabled, msqEnabled, instructionsList)}
                required
                className={`w-full px-3 py-2 bg-bg border ${showStep1Errors && title.trim() === '' ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : 'border-border'} rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 hover:border-accent-primary/40 transition-all text-[13px] font-medium leading-relaxed sm:leading-normal shadow-sm hover:shadow`}
              />
              {showStep1Errors && title.trim() === '' && (
                <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> Exam title is required
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Description</label>
              <AutoGrowInput
                value={description}
                onChange={setDescription}
                onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, msqCorrect, msqPartial, msqWrong, msqPartialEnabled, msqEnabled, instructionsList)}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 hover:border-accent-primary/40 transition-all text-[13px] font-medium leading-relaxed sm:leading-normal min-h-[3.5rem] shadow-sm hover:shadow"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Duration (minutes) *</label>
              <input
                id="exam-duration-input"
                type="number"
                value={durationMinutes === 0 ? '' : durationMinutes}
                onChange={(e) => {
                  const val = e.target.value;
                  const newDuration = val === '' ? 0 : (parseInt(val) || 0);
                  setDurationMinutes(newDuration);
                  if (startTime && newDuration > 0) {
                    const end = new Date(new Date(startTime).getTime() + newDuration * 60000);
                    const endString = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                    setEndTime(endString);
                  }
                }}
                onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, msqCorrect, msqPartial, msqWrong, msqPartialEnabled, msqEnabled, instructionsList)}
                min={1}
                required
                className={`w-full px-3 py-2 bg-bg border ${showStep1Errors && (!durationMinutes || durationMinutes < 1) ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/10' : 'border-border'} rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 hover:border-accent-primary/40 transition-all text-[13px] font-medium leading-relaxed sm:leading-normal shadow-sm hover:shadow`}
              />
              {showStep1Errors && (!durationMinutes || durationMinutes < 1) && (
                <p className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> Duration must be at least 1 minute
                </p>
              )}
            </div>
          </div>
        </CollapsibleCard>

        {/* Marking Scheme */}
        <CollapsibleCard
          title="Marking Scheme"
          expanded={expandedCards.marking}
          onToggle={() => toggleCard('marking')}
          hasError={showStep1Errors && (
            String(mcqCorrect).trim() === '' ||
            String(mcqWrong).trim() === '' ||
            String(natCorrect).trim() === '' ||
            String(natWrong).trim() === '' ||
            (msqEnabled && (
              String(msqCorrect).trim() === '' ||
              String(msqWrong).trim() === '' ||
              (msqPartialEnabled && String(msqPartial).trim() === '')
            ))
          )}
          className="order-2"
        >
          <div className="flex flex-col gap-4">
            {/* MCQ Section */}
            <div className="bg-surface border border-border rounded-lg p-3 flex items-center gap-2 sm:gap-4">
              <h4 className="text-xs font-bold text-text-main shrink-0">MCQ</h4>
              <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-4">
                <div className={`relative border ${showStep1Errors && String(mcqCorrect).trim() === '' ? 'border-red-500 shadow-red-500/20' : 'border-border'} rounded-md focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all shadow-sm bg-bg`}>
                  <label className="absolute -top-2 left-2 bg-surface px-1 text-[10px] font-semibold text-text-muted whitespace-nowrap z-10 pointer-events-none">Correct (+)</label>
                  <input
                    id="mcq-correct-input"
                    type="number"
                    step="any"
                    value={mcqCorrect}
                    onChange={(e) => setMcqCorrect(e.target.value)}
                    onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, msqCorrect, msqPartial, msqWrong, msqPartialEnabled, msqEnabled, instructionsList)}
                    className="w-full px-2 sm:px-3 py-1.5 bg-transparent text-center text-text-main focus:outline-none text-xs font-medium"
                  />
                </div>
                <div className={`relative border ${showStep1Errors && String(mcqWrong).trim() === '' ? 'border-red-500 shadow-red-500/20' : 'border-border'} rounded-md focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all shadow-sm bg-bg`}>
                  <label className="absolute -top-2 left-2 bg-surface px-1 text-[10px] font-semibold text-text-muted whitespace-nowrap z-10 pointer-events-none">Wrong (-)</label>
                  <input
                    id="mcq-wrong-input"
                    type="number"
                    step="any"
                    value={mcqWrong}
                    onChange={(e) => setMcqWrong(e.target.value)}
                    onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, msqCorrect, msqPartial, msqWrong, msqPartialEnabled, msqEnabled, instructionsList)}
                    className="w-full px-2 sm:px-3 py-1.5 bg-transparent text-center text-text-main focus:outline-none text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* NAT Section */}
            <div className="bg-surface border border-border rounded-lg p-3 flex items-center gap-2 sm:gap-4">
              <h4 className="text-xs font-bold text-text-main shrink-0">NAT</h4>
              <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-4">
                <div className={`relative border ${showStep1Errors && String(natCorrect).trim() === '' ? 'border-red-500 shadow-red-500/20' : 'border-border'} rounded-md focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all shadow-sm bg-bg`}>
                  <label className="absolute -top-2 left-2 bg-surface px-1 text-[10px] font-semibold text-text-muted whitespace-nowrap z-10 pointer-events-none">Correct (+)</label>
                  <input
                    id="nat-correct-input"
                    type="number"
                    step="any"
                    value={natCorrect}
                    onChange={(e) => setNatCorrect(e.target.value)}
                    onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, msqCorrect, msqPartial, msqWrong, msqPartialEnabled, msqEnabled, instructionsList)}
                    className="w-full px-2 sm:px-3 py-1.5 bg-transparent text-center text-text-main focus:outline-none text-xs font-medium"
                  />
                </div>
                <div className={`relative border ${showStep1Errors && String(natWrong).trim() === '' ? 'border-red-500 shadow-red-500/20' : 'border-border'} rounded-md focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all shadow-sm bg-bg`}>
                  <label className="absolute -top-2 left-2 bg-surface px-1 text-[10px] font-semibold text-text-muted whitespace-nowrap z-10 pointer-events-none">Wrong (-)</label>
                  <input
                    id="nat-wrong-input"
                    type="number"
                    step="any"
                    value={natWrong}
                    onChange={(e) => setNatWrong(e.target.value)}
                    onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, msqCorrect, msqPartial, msqWrong, msqPartialEnabled, msqEnabled, instructionsList)}
                    className="w-full px-2 sm:px-3 py-1.5 bg-transparent text-center text-text-main focus:outline-none text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* MSQ Section */}
            <div className="bg-surface border border-border rounded-lg p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={msqEnabled}
                    onChange={(e) => {
                      setMsqEnabled(e.target.checked);
                      autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, msqCorrect, msqPartial, msqWrong, msqPartialEnabled, e.target.checked, instructionsList);
                    }}
                    className="w-4 h-4 text-accent-primary rounded border-border focus:ring-accent-primary cursor-pointer"
                  />
                  <h4 className="text-xs font-bold text-text-main select-none">MSQ</h4>
                </label>

                <label className={`flex items-center gap-2 cursor-pointer transition-opacity ${!msqEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input
                    type="checkbox"
                    checked={msqPartialEnabled}
                    onChange={(e) => {
                      setMsqPartialEnabled(e.target.checked);
                      autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, msqCorrect, msqPartial, msqWrong, e.target.checked, msqEnabled, instructionsList);
                    }}
                    disabled={!msqEnabled}
                    className="w-3.5 h-3.5 text-accent-primary rounded border-border focus:ring-accent-primary cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-text-muted select-none">Partial Marking</span>
                </label>
              </div>

              <div className={`transition-opacity ${!msqEnabled ? 'opacity-50 pointer-events-none' : ''} space-y-3`}>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-1">
                  <div className={`relative border ${showStep1Errors && msqEnabled && String(msqCorrect).trim() === '' ? 'border-red-500 shadow-red-500/20' : 'border-border'} ${!msqEnabled ? 'bg-gray-50' : 'bg-bg'} rounded-md focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all shadow-sm`}>
                    <label className="absolute -top-2 left-2 bg-surface px-1 text-[10px] font-semibold text-text-muted whitespace-nowrap z-10 pointer-events-none">Full (+)</label>
                    <input
                      id="msq-correct-input"
                      type="number"
                      step="any"
                      value={msqCorrect}
                      onChange={(e) => setMsqCorrect(e.target.value)}
                      onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, msqCorrect, msqPartial, msqWrong, msqPartialEnabled, msqEnabled, instructionsList)}
                      disabled={!msqEnabled}
                      className="w-full px-2 sm:px-3 py-1.5 bg-transparent text-center text-text-main focus:outline-none text-xs font-medium"
                    />
                  </div>
                  <div className={`relative border ${showStep1Errors && msqEnabled && String(msqWrong).trim() === '' ? 'border-red-500 shadow-red-500/20' : 'border-border'} ${!msqEnabled ? 'bg-gray-50' : 'bg-bg'} rounded-md focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all shadow-sm`}>
                    <label className="absolute -top-2 left-2 bg-surface px-1 text-[10px] font-semibold text-text-muted whitespace-nowrap z-10 pointer-events-none">Wrong (-)</label>
                    <input
                      id="msq-wrong-input"
                      type="number"
                      step="any"
                      value={msqWrong}
                      onChange={(e) => setMsqWrong(e.target.value)}
                      onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, msqCorrect, msqPartial, msqWrong, msqPartialEnabled, msqEnabled, instructionsList)}
                      disabled={!msqEnabled}
                      className="w-full px-2 sm:px-3 py-1.5 bg-transparent text-center text-text-main focus:outline-none text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <div className={`relative border ${showStep1Errors && msqEnabled && msqPartialEnabled && String(msqPartial).trim() === '' ? 'border-red-500 shadow-red-500/20' : 'border-border'} ${!msqEnabled || !msqPartialEnabled ? 'opacity-50 bg-gray-50' : 'bg-bg'} rounded-md focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all shadow-sm`}>
                    <label className="absolute -top-2 left-2 bg-surface px-1 text-[10px] font-semibold text-text-muted whitespace-nowrap z-20 flex items-center gap-1 overflow-visible">
                      <span>Partial (+)</span>
                      <span 
                        className="relative cursor-help pointer-events-auto flex items-center"
                        onMouseEnter={() => setShowPartialTooltip(true)}
                        onMouseLeave={() => setShowPartialTooltip(false)}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowPartialTooltip(!showPartialTooltip);
                        }}
                      >
                        <Info className={`w-3.5 h-3.5 transition-colors ${showPartialTooltip ? 'text-accent-primary' : 'text-text-muted'}`} />
                        
                        <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-surface border border-border rounded-xl shadow-xl transition-all duration-200 z-50 transform origin-bottom font-normal ${showPartialTooltip ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
                          <div className="text-xs font-bold text-text-main mb-2 border-b border-border pb-1.5 flex items-center gap-1.5 whitespace-normal">
                            <Info size={14} className="text-accent-primary" />
                            Partial Marking Rules
                          </div>
                          <ul className="text-[11px] text-text-muted space-y-1.5 leading-relaxed font-medium whitespace-normal">
                            <li className="flex items-start gap-1.5">
                              <span className="text-accent-primary mt-0.5">•</span>
                              <span><strong className="text-text-main">1 correct</strong> option chosen → <strong className="text-accent-primary">+1 mark</strong></span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-accent-primary mt-0.5">•</span>
                              <span><strong className="text-text-main">2 correct</strong> options chosen → <strong className="text-accent-primary">+2 marks</strong></span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span><strong className="text-text-main">All correct</strong> options chosen → <strong className="text-emerald-600">Full Marks</strong></span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-red-400 mt-0.5">•</span>
                              <span><strong className="text-text-main">Any wrong</strong> option chosen → <strong className="text-red-500">Negative Marks</strong> penalty</span>
                            </li>
                          </ul>
                          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-surface border-b border-r border-border rotate-45"></div>
                        </div>
                      </span>
                    </label>
                    <input
                      id="msq-partial-input"
                      type="number"
                      step="any"
                      value={msqPartial}
                      onChange={(e) => setMsqPartial(e.target.value)}
                      onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, msqCorrect, msqPartial, msqWrong, msqPartialEnabled, msqEnabled, instructionsList)}
                      disabled={!msqEnabled || !msqPartialEnabled}
                      className="w-full px-2 sm:px-3 py-1.5 bg-transparent text-center text-text-main focus:outline-none text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleCard>

        {/* Subjects (Step 1 Position) */}
        <div id="subjects-section-card" className="lg:col-span-2 order-3">
          <CollapsibleCard
            title="Subjects"
            expanded={expandedCards.subjects}
            onToggle={() => toggleCard('subjects')}
            hasError={showStep1Errors && subjects.length === 0}
            className="mb-4"
            headerExtra={
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowAddSubjectModal(true);
                }}
                className="text-[11px] font-bold text-accent-primary hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> Add Subject
              </button>
            }
          >
            {subjects.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-8 px-4 text-center ${
                showStep1Errors ? 'bg-red-50/50 border-2 border-red-500/80 shadow-red-500/10' : 'bg-bg/50 border border-dashed border-border'
              } rounded-xl transition-all`}>
                <div className={`w-10 h-10 rounded-full ${showStep1Errors ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/20'} flex items-center justify-center mb-2`}>
                  <AlertCircle size={20} className={showStep1Errors ? 'text-red-500' : 'text-amber-500'} />
                </div>
                <p className={`text-xs font-bold mb-1 ${showStep1Errors ? 'text-red-600' : 'text-text-main'}`}>
                  {showStep1Errors ? 'At Least 1 Subject Required' : 'No Subjects Added Yet'}
                </p>
                <p className="text-[11px] text-text-muted max-w-xs mb-3">
                  {showStep1Errors ? 'Please add at least one subject to this exam before proceeding.' : 'Click below to add your first subject to this exam.'}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAddSubjectModal(true);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg ${
                    showStep1Errors ? 'bg-red-600 hover:bg-red-700' : 'bg-accent-primary hover:bg-accent-primary/90'
                  } text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95`}
                >
                  <Plus size={14} /> Add Subject Now
                </button>
              </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((s, index) => {
              const added = questionCounts[s.id] || 0;
              const needed = s.question_count;
              const complete = added >= needed;
              const isDragging = draggedSubjectIndex === index;
              const isDragOver = draggedOverSubjectIndex === index;

              const isEditing = editSubjectId === s.id;

              return (
                <div 
                  key={s.id} 
                  draggable={!!handleReorderSubjects && !isEditing}
                  data-subject-index={index}
                  onDragStart={(e) => {
                    if (isEditing) {
                      e.preventDefault();
                      return;
                    }
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('input')) {
                      e.preventDefault();
                      return;
                    }
                    setTimeout(() => setDraggedSubjectIndex(index), 0);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', index.toString());
                  }}
                  onDragEnter={(e) => e.preventDefault()}
                  onTouchStart={(e) => {
                    if (isEditing) return;
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('input')) return;
                    setDraggedSubjectIndex(index);
                    document.body.style.overflow = 'hidden';
                  }}
                  onTouchMove={(e) => {
                    if (draggedSubjectIndex === null) return;
                    const touch = e.touches[0];
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    const card = element?.closest('[data-subject-index]');
                    if (card) {
                      const hoverIndex = parseInt(card.getAttribute('data-subject-index') || '-1', 10);
                      if (hoverIndex !== -1 && hoverIndex !== draggedOverSubjectIndex) {
                        setDraggedOverSubjectIndex(hoverIndex);
                      }
                    }
                  }}
                  onTouchEnd={(e) => {
                    document.body.style.overflow = '';
                    if (draggedSubjectIndex !== null && draggedOverSubjectIndex !== null && draggedSubjectIndex !== draggedOverSubjectIndex && handleReorderSubjects) {
                      handleReorderSubjects(draggedSubjectIndex, draggedOverSubjectIndex);
                    }
                    setDraggedSubjectIndex(null);
                    setDraggedOverSubjectIndex(null);
                  }}
                  onTouchCancel={() => {
                    document.body.style.overflow = '';
                    setDraggedSubjectIndex(null);
                    setDraggedOverSubjectIndex(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (draggedSubjectIndex !== null && draggedSubjectIndex !== index) {
                      setDraggedOverSubjectIndex(index);
                    }
                  }}
                  onDragLeave={() => {
                    setDraggedOverSubjectIndex(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedSubjectIndex !== null && draggedSubjectIndex !== index && handleReorderSubjects) {
                      handleReorderSubjects(draggedSubjectIndex, index);
                    }
                    setDraggedSubjectIndex(null);
                    setDraggedOverSubjectIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedSubjectIndex(null);
                    setDraggedOverSubjectIndex(null);
                  }}
                  className={`bg-bg border rounded-xl p-3 flex flex-col justify-between transition-all group ${!isEditing ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'border-accent-primary border-dashed shadow-md bg-accent-primary/5' : 'border-border hover:border-accent-primary/40 hover:shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-text-main font-bold text-xs leading-relaxed break-words sm:leading-normal group-hover:text-accent-primary transition-colors">{s.subject_name}</span>
                    <div className="flex items-center gap-1">

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSubject(e, s.id, s.subject_name)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                        title="Delete Subject"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider leading-relaxed sm:leading-normal ${complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {added}/{needed} q&apos;s
                    </span>
                    {editSubjectId !== s.id && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setInlineEditSubjectCount(needed);
                          setEditSubjectId(s.id);
                        }}
                        className="text-text-muted hover:text-accent-primary transition-colors p-1"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                    {editSubjectId === s.id && (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          type="number"
                          value={inlineEditSubjectCount === 0 ? '' : inlineEditSubjectCount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInlineEditSubjectCount(val === '' ? 0 : (parseInt(val) || 0));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveSubjectCount(s.id);
                            }
                          }}
                          className="w-20 px-1.5 py-0.5 text-xs border border-accent-primary rounded outline-none font-bold text-center"
                          min="1"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveSubjectCount(s.id)}
                          className="text-white bg-accent-primary p-0.5 rounded hover:bg-accent-primary/90 transition-colors"
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.exam_subject_teachers?.map((est: any) => (
                      <span key={est.id} className="text-[9px] font-bold uppercase tracking-wider text-accent-primary bg-surface border border-border px-1.5 py-0.5 rounded leading-relaxed break-words whitespace-normal sm:leading-normal">
                        {est.teachers?.full_name || 'Teacher'}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setManageTeachersSubject(s);
                        setSelectedTeacherIds(s.exam_subject_teachers?.map((est: any) => est.teacher_id) || []);
                        setTeacherSearchQuery('');
                      }}
                      className="text-text-muted hover:text-accent-primary text-[9px] font-bold uppercase tracking-wider border border-dashed border-border px-1.5 py-0.5 rounded flex items-center"
                    >
                      <Plus size={8} className="mr-0.5" /> Assign Teacher (Optional)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </CollapsibleCard>
      </div>

        {/* Exam Instructions */}
        <CollapsibleCard
          title="Exam Instructions"
          expanded={expandedCards.instructions}
          onToggle={() => toggleCard('instructions')}
          className="order-4 lg:col-span-2"
          headerExtra={
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowInstructionPreview(true)}
                className="inline-flex items-center gap-1.5 text-accent-primary text-xs font-bold hover:underline bg-[#f0f7f7] px-2 py-1 rounded-md transition-colors"
              >
                <BookOpen size={14} /> Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  addInstructionItem();
                  setTimeout(() => {
                    const el = document.getElementById(`instruction-input-${instructionsList.length}`);
                    if (el) {
                      el.focus();
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 100);
                }}
                className="inline-flex items-center gap-1 text-accent-primary text-[11px] font-bold hover:underline"
              >
                <Plus size={12} /> Add
              </button>
            </div>
          }
        >
          <div className="mb-3">
            <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">General Instructions (always shown)</span>
            <div className="space-y-1.5">
              {GENERAL_INSTRUCTIONS.map((inst, index) => (
                <div key={index} className="flex items-start gap-2 w-full text-xs text-text-muted font-medium leading-relaxed bg-bg border border-border rounded-lg px-3 py-1.5">
                  <span className="font-bold flex-shrink-0">{index + 1}.</span>
                  <span>{inst}</span>
                </div>
              ))}
            </div>
          </div>
          <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Your Additions</span>
          <div className="space-y-1.5">
            {instructionsList.map((inst, index) => (
              <div key={index} className="flex items-start gap-2 w-full">
                <span className="text-text-muted font-bold text-[11px] w-4 text-right flex-shrink-0 mt-1.5">{index + 1}.</span>
                <AutoGrowInput
                  id={`instruction-input-${index}`}
                  value={inst}
                  onChange={(val) => updateInstructionItem(index, val)}
                  onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, msqCorrect, msqPartial, msqWrong, msqPartialEnabled, msqEnabled, instructionsList)}
                  placeholder="e.g. Do not close browser..."
                  className="flex-1 min-w-0 px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium leading-relaxed sm:leading-normal"
                />
                {instructionsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInstructionItem(index)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1 mt-0.5"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </CollapsibleCard>
      </div>
    </form>
  );
}
