'use client';

import React from 'react';
import { Plus, Trash2, Edit2, Check, BookOpen } from 'lucide-react';

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
}

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
}: Step1DetailsProps) {
  return (
    <form onSubmit={handleSaveExamDetails} className="space-y-4 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exam Details */}
        <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-sm order-1 h-full">
          <h3 className="text-sm font-bold text-text-main mb-3 border-b border-[#f0f7f7] pb-1.5">Exam Details</h3>
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  const newTitle = e.target.value;
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
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                rows={2}
                className="w-full px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all resize-none text-xs font-medium leading-relaxed whitespace-normal break-words sm:leading-normal"
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
        </div>

        {/* Marking Scheme */}
        <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-sm order-2 h-full">
          <h3 className="text-sm font-bold text-text-main mb-3 border-b border-[#f0f7f7] pb-1.5">Marking Scheme</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
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
        </div>

        {/* Subjects (Step 1 Position) */}
        <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-sm lg:col-span-2 order-3 h-full mb-4">
          <div className="mb-4 border-b border-[#f0f7f7] pb-1.5 flex justify-between items-center">
            <h3 className="text-sm font-bold text-text-main">Subjects</h3>
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
          </div>
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
        </div>

        {/* Exam Instructions */}
        <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-sm order-3 lg:col-span-2">
          <div className="flex items-center justify-between mb-3 border-b border-[#f0f7f7] pb-1.5">
            <h3 className="text-sm font-bold text-text-main">Exam Instructions</h3>
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
          </div>
          <div className="space-y-1.5">
            {instructionsList.map((inst, index) => (
              <div key={index} className="flex items-center gap-2 w-full">
                <span className="text-text-muted font-bold text-[11px] w-4 text-right flex-shrink-0">{index + 1}.</span>
                <input
                  type="text"
                  value={inst}
                  onChange={(e) => updateInstructionItem(index, e.target.value)}
                  onBlur={() => autoSaveExamDetails(title, description, durationMinutes, mcqCorrect, mcqWrong, natCorrect, natWrong, instructionsList)}
                  placeholder="e.g. Do not close browser..."
                  className="flex-1 min-w-0 px-3 py-1.5 bg-bg border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all text-xs font-medium leading-relaxed sm:leading-normal"
                />
                {instructionsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInstructionItem(index)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}