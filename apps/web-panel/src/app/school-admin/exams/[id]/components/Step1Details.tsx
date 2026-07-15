'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Check, BookOpen, ChevronDown } from 'lucide-react';

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
}: {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
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
}: {
  title: string;
  headerExtra?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-sm h-full ${className || ''}`}>
      <div
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 mb-3 border-b border-[#f0f7f7] pb-1.5 cursor-pointer sm:cursor-default"
      >
        <span className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold text-text-main">{title}</h3>
          <ChevronDown
            size={14}
            className={`text-text-muted transition-transform sm:hidden ${expanded ? 'rotate-180' : ''}`}
          />
        </span>
        {headerExtra && (
          <span onClick={(e) => e.stopPropagation()}>{headerExtra}</span>
        )}
      </div>
      <div className={`${expanded ? 'block' : 'hidden'} sm:block`}>{children}</div>
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
  setManageTeachersSubject: (subject: any) => void;
  setSelectedTeacherIds: (ids: string[]) => void;
  setTeacherSearchQuery: (query: string) => void;
  handleSaveExamDetails: (e: React.FormEvent) => void;
  paramsId: string;
  isReadOnly?: boolean;
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
  setManageTeachersSubject,
  setSelectedTeacherIds,
  setTeacherSearchQuery,
  handleSaveExamDetails,
  paramsId,
  isReadOnly = false,
}: Step1DetailsProps) {
  const [expandedCards, setExpandedCards] = useState({
    details: true,
    marking: true,
    subjects: true,
    instructions: true,
  });
  const allExpanded = Object.values(expandedCards).every(Boolean);
  const toggleCard = (key: keyof typeof expandedCards) =>
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleAll = () => {
    const next = !allExpanded;
    setExpandedCards({ details: next, marking: next, subjects: next, instructions: next });
  };

  return (
    <form
      onSubmit={(e) => {
        if (isReadOnly) { e.preventDefault(); return; }
        handleSaveExamDetails(e);
      }}
      className={`space-y-4 mb-6 ${isReadOnly ? 'pointer-events-none select-none opacity-75' : ''}`}
    >
      {isReadOnly && (
        <div className="rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-text-muted">
          This exam is published — details are read-only.
        </div>
      )}
      <div className="sm:hidden flex justify-end">
        <button
          type="button"
          onClick={toggleAll}
          className="text-[11px] font-bold text-accent-primary hover:underline flex items-center gap-1"
        >
          <ChevronDown size={12} className={`transition-transform ${allExpanded ? 'rotate-180' : ''}`} />
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exam Details */}
        <CollapsibleCard
          title="Exam Details"
          expanded={expandedCards.details}
          onToggle={() => toggleCard('details')}
          className="order-1"
        >
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Title *</label>
              <AutoGrowInput
                value={title}
                onChange={(newTitle) => {
                  setTitle(newTitle);
                  setExam((prev: any) => (prev ? { ...prev, title: newTitle } : null));
                  window.dispatchEvent(new CustomEvent('breadcrumb-update', { detail: { id: paramsId, title: newTitle } }));
                }}
                onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                required
                className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium leading-relaxed sm:leading-normal"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Description</label>
              <AutoGrowInput
                value={description}
                onChange={setDescription}
                onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium leading-relaxed sm:leading-normal min-h-[3.5rem]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Duration (minutes) *</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => {
                  const newDuration = parseInt(e.target.value) || 0;
                  setDurationMinutes(newDuration);
                  if (startTime && newDuration > 0) {
                    const end = new Date(new Date(startTime).getTime() + newDuration * 60000);
                    const endString = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                    setEndTime(endString);
                  }
                }}
                onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                min={1}
                required
                className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium leading-relaxed sm:leading-normal"
              />
            </div>
          </div>
        </CollapsibleCard>

        {/* Marking Scheme */}
        <CollapsibleCard
          title="Marking Scheme"
          expanded={expandedCards.marking}
          onToggle={() => toggleCard('marking')}
          className="order-2"
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1">MCQ Correct</label>
              <input
                type="number"
                step="any"
                value={mcqCorrect}
                onChange={(e) => setMcqCorrect(e.target.value)}
                onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium leading-relaxed sm:leading-normal"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1">MCQ Wrong (-)</label>
              <input
                type="number"
                step="any"
                value={mcqWrong}
                onChange={(e) => setMcqWrong(e.target.value)}
                onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium leading-relaxed sm:leading-normal"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1">NAT Correct</label>
              <input
                type="number"
                step="any"
                value={natCorrect}
                onChange={(e) => setNatCorrect(e.target.value)}
                onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium leading-relaxed sm:leading-normal"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-muted mb-1">NAT Wrong (-)</label>
              <input
                type="number"
                step="any"
                value={natWrong}
                onChange={(e) => setNatWrong(e.target.value)}
                onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium leading-relaxed sm:leading-normal"
              />
            </div>
          </div>
        </CollapsibleCard>

        {/* Subjects (Step 1 Position) */}
        <CollapsibleCard
          title="Subjects"
          expanded={expandedCards.subjects}
          onToggle={() => toggleCard('subjects')}
          className="lg:col-span-2 order-3 mb-4"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((s) => {
              const added = questionCounts[s.id] || 0;
              const needed = s.question_count;
              const complete = added >= needed;
              return (
                <div key={s.id} className="bg-bg border border-border rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-text-main font-bold text-xs leading-relaxed break-words sm:leading-normal">{s.subject_name}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSubject(e, s.id, s.subject_name)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 size={12} />
                    </button>
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
                          type="number"
                          value={inlineEditSubjectCount}
                          onChange={(e) => setInlineEditSubjectCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 px-1 py-0.5 text-[10px] border border-[#008080] rounded outline-none font-bold"
                          min="1"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveSubjectCount(s.id)}
                          className="text-white bg-accent-primary p-0.5 rounded"
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
                      <Plus size={8} className="mr-0.5" /> Assign Teacher
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleCard>

        {/* Exam Instructions */}
        <CollapsibleCard
          title="Exam Instructions"
          expanded={expandedCards.instructions}
          onToggle={() => toggleCard('instructions')}
          className="order-3 lg:col-span-2"
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
                onClick={addInstructionItem}
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
                  value={inst}
                  onChange={(val) => updateInstructionItem(index, val)}
                  onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
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