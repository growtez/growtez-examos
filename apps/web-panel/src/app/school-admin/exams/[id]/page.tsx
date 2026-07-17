"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSchoolBaseUrl } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Copy,
  Globe,
  Link2,
  MoreVertical,
  Plus,
  Trash2,
  Users,
  AlertCircle,
  Copy as CopyIcon,
  Play,
  Edit2,
  Check,
  Download,
  ShieldCheck,
  CreditCard,
  Save,
  CheckCircle2,
  FilePlus2,
  X,
  Search,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { openRazorpayCheckout } from "@/components/RazorpayCheckout";
import Step1Details from "./components/Step1Details";
import Step2Students from "./components/Step2Students";
import Step3Questions from "./components/Step3Questions";
import Step4Schedule from "./components/Step4Schedule";
import Step5Publish from "./components/Step5Publish";
import { useExamDetailPage } from "./hooks/useExamDetailPage";

function CustomCombobox({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  className: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setFilteredOptions(
      options.filter((o) => o.toLowerCase().includes(value.toLowerCase())),
    );
  }, [value, options]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={`${className} text-ellipsis overflow-hidden whitespace-nowrap`}
        style={{ paddingRight: "1.75rem" }}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-text-muted bg-transparent">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          ></path>
        </svg>
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-10 w-full bg-surface border border-border mt-1 rounded-xl shadow-xl shadow-[#008080]/10 max-h-[130px] overflow-y-auto custom-scrollbar">
          {filteredOptions.map((opt) => (
            <li
              key={opt}
              className="px-4 py-2.5 hover:bg-bg cursor-pointer text-sm font-medium text-text-main transition-colors"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-500/10 text-gray-500 border-slate-500/20",
  published: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

const STEPPER_STEPS = [
  { step: 1, label: "Setup" },
  { step: 2, label: "Students" },
  { step: 3, label: "Questions" },
  { step: 4, label: "Schedule" },
  { step: 5, label: "Publish" },
] as const;

export default function ExamDetailPage({ params }: { params: { id: string } }) {
  const {
    supabase,
    exam,
    setExam,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    subjects,
    setSubjects,
    questionCounts,
    setQuestionCounts,
    assignedStudents,
    setAssignedStudents,
    loading,
    setLoading,
    publishing,
    setPublishing,
    savingExam,
    setSavingExam,
    saveStatus,
    setSaveStatus,
    currentStep,
    setCurrentStep,
    examFee,
    setExamFee,
    title,
    setTitle,
    description,
    setDescription,
    durationMinutes,
    setDurationMinutes,
    mcqCorrect,
    setMcqCorrect,
    mcqWrong,
    setMcqWrong,
    natCorrect,
    setNatCorrect,
    natWrong,
    setNatWrong,
    role,
    setRole,
    userId,
    setUserId,
    editDurationMode,
    setEditDurationMode,
    inlineEditDuration,
    setInlineEditDuration,
    editSubjectId,
    setEditSubjectId,
    inlineEditSubjectCount,
    setInlineEditSubjectCount,
    assignedSearchQuery,
    setAssignedSearchQuery,
    showAddStudentModal,
    setShowAddStudentModal,
    addingStudent,
    setAddingStudent,
    addError,
    setAddError,
    addSuccess,
    setAddSuccess,
    newName,
    setNewName,
    newRoll,
    setNewRoll,
    newDob,
    setNewDob,
    newCourse,
    setNewCourse,
    newBatch,
    setNewBatch,
    newSession,
    setNewSession,
    linkCourse,
    setLinkCourse,
    linkBatch,
    setLinkBatch,
    linkSession,
    setLinkSession,
    schoolStudents,
    setSchoolStudents,
    searchQuery,
    setSearchQuery,
    addMode,
    setAddMode,
    csvFile,
    setCsvFile,
    linkCopied,
    setLinkCopied,
    filterCourse,
    setFilterCourse,
    filterBatch,
    setFilterBatch,
    filterSession,
    setFilterSession,
    assignedBatchFilter,
    setAssignedBatchFilter,
    assignedCourseFilter,
    setAssignedCourseFilter,
    selectedStudents,
    setSelectedStudents,
    bulkAssigning,
    setBulkAssigning,
    teachers,
    setTeachers,
    templates,
    setTemplates,
    templatesLoading,
    applyingTemplate,
    setApplyingTemplate,
    showAddSubjectModal,
    setShowAddSubjectModal,
    newSubjectTeacherSearch,
    setNewSubjectTeacherSearch,
    showMoreMenu,
    setShowMoreMenu,
    moreMenuRef,
    manageTeachersSubject,
    setManageTeachersSubject,
    selectedTeacherIds,
    setSelectedTeacherIds,
    showAddTeacherMode,
    setShowAddTeacherMode,
    newTeacherName,
    setNewTeacherName,
    newTeacherEmail,
    setNewTeacherEmail,
    newTeacherPassword,
    setNewTeacherPassword,
    newTeacherDepartment,
    setNewTeacherDepartment,
    addingTeacher,
    setAddingTeacher,
    addTeacherError,
    setAddTeacherError,
    teacherSearchQuery,
    setTeacherSearchQuery,
    showInstructionPreview,
    setShowInstructionPreview,
    instructionsList,
    setInstructionsList,
    editInstructionsMode,
    setEditInstructionsMode,
    drawerSubjectId,
    setDrawerSubjectId,
    drawerView,
    setDrawerView,
    drawerQuestions,
    setDrawerQuestions,
    drawerLoading,
    setDrawerLoading,
    drawerFormLoading,
    setDrawerFormLoading,
    drawerError,
    setDrawerError,
    editingQuestionId,
    setEditingQuestionId,
    qType,
    setQType,
    qText,
    setQText,
    qImage,
    setQImage,
    rawImageToCrop,
    setRawImageToCrop,
    cropTarget,
    setCropTarget,
    crop,
    setCrop,
    completedCrop,
    setCompletedCrop,
    imageRef,
    setImageRef,
    optA,
    setOptA,
    optAImg,
    setOptAImg,
    optB,
    setOptB,
    optBImg,
    setOptBImg,
    optC,
    setOptC,
    optCImg,
    setOptCImg,
    optD,
    setOptD,
    optDImg,
    setOptDImg,
    correctAnswer,
    setCorrectAnswer,
    natAnswer,
    setNatAnswer,
    generatingPDF,
    setGeneratingPDF,
    newSubject,
    setNewSubject,
    confirmDialog,
    setConfirmDialog,
    handleSetStep,
    openManageQuestions,
    fetchDrawerQuestions,
    handleDrawerNewQuestion,
    handleDrawerCancel,
    doSaveQuestion,
    handleDrawerEditQuestion,
    handleDrawerDeleteQuestion,
    handleDrawerImageUpload,
    handleCropAndSave,
    canProceedToNextStep,
    autoSaveExamDetails,
    autoSaveSchedule,
    handleSaveExamDetails,
    handleTemplateApply,
    addInstructionItem,
    removeInstructionItem,
    updateInstructionItem,
    downloadQuestionPaper,
    fetchExamData,
    handlePublish,
    handlePayment,
    handleTogglePaid,
    formatDobPassword,
    handleSaveDuration,
    handleSaveSubjectCount,
    handleDeleteSubject,
    handleSaveSubjectTeachers,
    handleAddSubject,
    toggleNewSubjectTeacher,
    handleAssignExisting,
    handleBulkAssign,
    handleAddStudent,
    handleCsvImport,
    handleDownloadCsvTemplate,
    handleRemoveStudent,
    handleDuplicate,
    handleCreateAndAssignTeacher,
    handleUnpublish,
    handleTrash,
    totalQuestionsNeeded,
    totalQuestionsAdded,
    allQuestionsReady,
    stepsBeforeScheduleComplete,
    allStepsComplete,
    availableStudents,
    uniqueCourses,
    uniqueBatches,
    uniqueSessions,
    filteredStudents,
    uniqueAssignedBatches,
    uniqueAssignedCourses,
    filteredAssignedStudents,
    downloadResultsPDF,
  } = useExamDetailPage(params.id);

  const [questionSearchQuery, setQuestionSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);

  const handleExportQuestions = () => {
    if (!drawerSubjectId) return;
    const activeSubjectName = subjects.find(s => s.id === drawerSubjectId)?.subject_name || 'Subject';

    const headers = ["No.", "Type", "Positive Marks", "Negative Marks", "Question Text", "Option A", "Option B", "Option C", "Option D", "Correct Option/Value"];

    const filtered = drawerQuestions.filter(q => {
      const matchesSearch = q.question_text?.toLowerCase().includes(questionSearchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || q.question_type === typeFilter;
      return matchesSearch && matchesType;
    });

    const rows = filtered.map((q, idx) => {
      const isMcq = q.question_type === 'mcq';
      return [
        idx + 1,
        q.question_type || '',
        q.positive_marks ?? 0,
        q.negative_marks ?? 0,
        q.question_text || '',
        isMcq && q.options?.A ? q.options.A : '',
        isMcq && q.options?.B ? q.options.B : '',
        isMcq && q.options?.C ? q.options.C : '',
        isMcq && q.options?.D ? q.options.D : '',
        q.correct_option || ''
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeSubjectName}_questions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isExamOver = exam?.end_time
    ? new Date(exam.end_time) < new Date()
    : false;
  const displayStatus = isExamOver ? "completed" : exam?.status || "draft";
  // Controls the stepper-pill layout (vs. the old single-column/summary layout).
  // The pills should stay visible for non-teachers regardless of draft/published status.
  const isDraftStepperMode = loading || role !== "teacher";
  // True once the exam is no longer editable: published (any non-draft status) or its window has passed.
  const isReadOnly = !loading && (exam?.status !== "draft" || isExamOver);

  if (loading) {
    return (
      <div className="w-full animate-in fade-in duration-300">
        <div className="border-b border-border bg-bg px-4 sm:px-6 pb-3 flex flex-col gap-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4 mb-2 w-full max-w-5xl mx-auto">
            <div className="flex justify-start sm:justify-end">
              <button disabled className="inline-flex min-w-10 items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 bg-surface border border-border text-text-main text-[11px] font-semibold rounded-xl opacity-50 cursor-not-allowed sm:min-w-24">
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Prev</span>
              </button>
            </div>
            <div className="min-w-0 overflow-x-auto bg-accent-primary/5 border border-accent-primary/20 rounded-2xl py-2 px-3 sm:px-6 shadow-sm shadow-accent-primary/5">
              <div className="flex min-w-max items-center justify-center gap-4">
                {STEPPER_STEPS.map((s) => (
                  <div
                    key={s.step}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-[10px] sm:text-[11px] border-2 bg-transparent text-text-muted border-border"
                  >
                    {s.step}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end sm:justify-start">
              <button disabled className="inline-flex min-w-10 items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 bg-surface border border-border text-text-main text-[11px] font-semibold rounded-xl opacity-50 cursor-not-allowed sm:min-w-24">
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-text-main">
            Step 1 · Setup
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 animate-pulse p-4 sm:p-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-surface border border-border rounded-2xl"></div>
          ))}
        </div>
        <div className="h-[400px] bg-surface border border-border rounded-2xl mt-6 mx-4 sm:mx-6 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className={`grid grid-cols-1 ${!isDraftStepperMode ? "xl:grid-cols-3 gap-6 lg:gap-8" : ""} mb-10`}
      >
        {/* Main Content Column */}
        <div
          className={`${isDraftStepperMode ? "" : "xl:col-span-2"} space-y-6`}
        >

          {isDraftStepperMode && (
            <>
              <div className="sticky top-0 z-30 -mx-6 -mt-6 pt-6 px-4 sm:px-6 pb-2 bg-bg relative isolate before:pointer-events-none before:absolute before:inset-x-0 before:-top-12 before:bottom-0 before:z-[-1] before:bg-bg">
                {/* Horizontal Stepper (Top) */}
                <div className="grid grid-cols-[auto_1fr_auto] items-center sm:gap-4 w-full max-w-5xl mx-auto">
                  {/* Prev Button */}
                  <div className="flex justify-start sm:justify-end">
                    <button
                      onClick={() => currentStep > 1 && handleSetStep(currentStep - 1)}
                      disabled={currentStep <= 1}
                      className={`inline-flex min-w-10 items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 bg-accent-primary border border-accent-primary text-white text-[11px] font-semibold rounded-xl transition-all shadow-sm sm:min-w-24 ${currentStep > 1
                        ? "hover:opacity-90 active:scale-95"
                        : "opacity-50 cursor-not-allowed"
                        }`}
                    >
                      <ChevronLeft size={14} />
                      <span className="hidden sm:inline">Prev</span>
                    </button>
                  </div>

                  {/* Stepper Box */}
                  <div className="min-w-0 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-accent-primary/5 border border-accent-primary rounded-2xl py-2.5 px-3 sm:px-4 shadow-sm shadow-accent-primary/5">
                    <div className="flex min-w-max items-center justify-start sm:justify-center">
                      {STEPPER_STEPS.map((s, idx) => {
                        const isActive = currentStep === s.step;
                        const isDone = !isActive && canProceedToNextStep(s.step);
                        const isSegmentFilled = currentStep > s.step;
                        const totalSteps = STEPPER_STEPS.length;
                        let windowStart = currentStep - 1;
                        if (windowStart < 1) windowStart = 1;
                        if (windowStart > totalSteps - 2) windowStart = totalSteps - 2;
                        const windowEnd = windowStart + 2;
                        const isVisibleOnMobile = s.step >= windowStart && s.step <= windowEnd;
                        return (
                          <div
                            key={s.step}
                            className={`${isVisibleOnMobile ? "flex" : "hidden"} sm:flex items-center`}
                          >
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <button
                                onClick={() => handleSetStep(s.step)}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-[11px] sm:text-xs leading-none transition-all duration-300 border-2 shrink-0 shadow-sm
                                  ${isActive
                                    ? "bg-accent-primary text-white border-accent-primary scale-110 shadow-md shadow-accent-primary/20"
                                    : isDone
                                      ? "bg-accent-primary/10 text-accent-primary border-accent-primary/30 hover:bg-accent-primary/20"
                                      : "bg-transparent text-text-muted border-accent-primary/30 hover:border-accent-primary/50"
                                  }`}
                              >
                                {isDone ? <Check size={14} strokeWidth={3} /> : s.step}
                              </button>
                              <button
                                onClick={() => handleSetStep(s.step)}
                                className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${isActive ? "inline-block" : "hidden"} sm:inline-block ${isActive ? "text-accent-primary scale-105 origin-left" : isDone ? "text-accent-primary/80" : "text-text-muted hover:text-text-main"}`}
                              >
                                {s.label}
                              </button>
                            </div>
                            {idx < STEPPER_STEPS.length - 1 && (
                              <div className={`${(isVisibleOnMobile && s.step < windowEnd) ? "block" : "hidden"} sm:block w-4 sm:w-8 h-1 mx-1.5 sm:mx-2 rounded-full bg-accent-primary/20 overflow-hidden shrink-0`}>
                                <div
                                  className={`h-full transition-all duration-500 ease-out ${isSegmentFilled ? "w-full bg-accent-primary shadow-[0_0_8px_rgba(0,128,128,0.4)]" : "w-0 bg-accent-primary"}`}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Next Button */}
                  <div className="flex justify-end sm:justify-start">
                    <button
                      onClick={() => currentStep < 5 && handleSetStep(currentStep + 1)}
                      disabled={currentStep >= 5}
                      className={`inline-flex min-w-10 items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 bg-accent-primary border border-accent-primary text-white text-[11px] font-semibold rounded-xl transition-all shadow-sm sm:min-w-24 ${currentStep < 5
                        ? "hover:opacity-90 active:scale-95"
                        : "opacity-50 cursor-not-allowed"
                        }`}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrolling Header Container */}
              <div className="-mx-6 mb-4 border-b border-border bg-bg px-4 sm:px-6 pb-3 flex flex-col gap-4 relative z-10">
                {/* Row 1: Title (Full Width) */}
                <h2 className="text-base sm:text-lg font-bold text-text-main flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-accent-primary">Step {currentStep}</span>
                  <span className="text-text-muted">·</span>
                  <span>{STEPPER_STEPS.find((s) => s.step === currentStep)?.label}</span>
                </h2>

                {/* Row 2: Controls and Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  {/* Left Side: Step-specific Controls or Pills */}
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 min-w-0 flex-1">
                    {/* Step 1: Template */}
                    {currentStep === 1 && (
                      <div className="flex min-w-0 items-center gap-1.5">
                        <select
                          onChange={(e) => {
                            const selected = templates.find((t) => t.id === e.target.value);
                            if (selected) handleTemplateApply(selected);
                            e.target.value = "";
                          }}
                          defaultValue=""
                          disabled={applyingTemplate || templatesLoading || templates.length === 0}
                          className="max-w-[8.5rem] sm:max-w-full px-3 py-1.5 bg-accent-primary/5 border border-accent-primary/30 rounded-lg text-accent-primary text-xs font-bold focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:bg-accent-primary hover:text-white"
                        >
                          <option value="" disabled>
                            {templatesLoading ? "Loading..." : templates.length === 0 ? "No templates" : "Use Template..."}
                          </option>
                          {templates.map((t) => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                        {applyingTemplate && (
                          <span className="text-[10px] text-accent-primary flex items-center gap-1 font-semibold animate-pulse">
                            <span className="w-2 h-2 rounded-full border-2 border-[#008080] border-t-transparent animate-spin" />
                          </span>
                        )}
                      </div>
                    )}
                    {/* Step 2: Add Students button was moved to Step2Students component */}
                    {/* Step 3: Centered Pills */}
                    {currentStep === 3 && (
                      <div className="relative flex items-center justify-start min-w-0 -mx-4 px-4 md:mx-0 md:px-0">
                        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar px-1 max-w-full snap-x snap-mandatory md:snap-none">
                          {subjects.map((s) => {
                            const added = questionCounts[s.id] || 0;
                            const needed = s.question_count;
                            const complete = added >= needed;
                            const isSelected = drawerSubjectId === s.id;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => openManageQuestions(s.id)}
                                className={`snap-start shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${isSelected
                                  ? "bg-accent-primary text-white border-accent-primary shadow-sm"
                                  : "bg-surface border-border text-text-main hover:border-accent-primary/50"
                                  }`}
                              >
                                {s.subject_name}
                                <span className={isSelected ? "text-white/80" : complete ? "text-emerald-600" : "text-amber-600"}>
                                  {added}/{needed}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {/* mobile-only scroll hint, hidden on desktop */}
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg to-transparent md:hidden" />
                      </div>
                    )}
                  </div>

                  {/* Right Side: Duplicate & Trash */}
                  <div className="flex shrink-0 items-center gap-1.5 justify-end">
                    <button
                      onClick={handleDuplicate}
                      title="Duplicate Exam"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 rounded-lg text-xs font-bold text-accent-primary hover:bg-accent-primary hover:text-white transition-all shadow-sm whitespace-nowrap"
                    >
                      <Copy size={14} />
                      <span className="hidden sm:inline">Duplicate</span>
                    </button>
                    <button
                      onClick={handleTrash}
                      title="Trash Exam"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm whitespace-nowrap"
                    >
                      <Trash2 size={14} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Search Filter Row (only for Step 3) */}
              {currentStep === 3 && drawerSubjectId && (
                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-2 md:gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border">
                  {/* Search Box */}
                  <div className="relative w-full md:max-w-[260px] shrink-0">
                    <Search className="absolute left-4 md:left-auto md:right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={questionSearchQuery}
                      onChange={(e) => setQuestionSearchQuery(e.target.value)}
                      className="w-full py-2 pl-10 md:pl-4 pr-4 md:pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all font-medium"
                    />
                  </div>

                  {/* Filter + Add share one row on mobile, spread out on desktop */}
                  <div className="flex items-center gap-2 md:contents">
                    {/* Filter Dropdown */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsTypeFilterOpen(!isTypeFilterOpen)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-semibold cursor-pointer whitespace-nowrap"
                      >
                        <Filter size={14} className="text-accent-primary" />
                        {typeFilter === 'all' ? 'All Types' : typeFilter.toUpperCase()}
                      </button>
                      {isTypeFilterOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsTypeFilterOpen(false)} />
                          <div className="absolute left-0 mt-2 w-40 bg-surface border border-border rounded-xl shadow-lg py-1 z-50 flex flex-col">
                            <button type="button" onClick={() => { setTypeFilter('all'); setIsTypeFilterOpen(false); }} className={`px-4 py-2 text-left text-xs font-semibold hover:bg-surface-hover border-none bg-transparent cursor-pointer ${typeFilter === 'all' ? 'text-accent-primary bg-accent-primary/5' : 'text-text-main'}`}>All Types</button>
                            <button type="button" onClick={() => { setTypeFilter('mcq'); setIsTypeFilterOpen(false); }} className={`px-4 py-2 text-left text-xs font-semibold hover:bg-surface-hover border-none bg-transparent cursor-pointer ${typeFilter === 'mcq' ? 'text-accent-primary bg-accent-primary/5' : 'text-text-main'}`}>MCQ</button>
                            <button type="button" onClick={() => { setTypeFilter('nat'); setIsTypeFilterOpen(false); }} className={`px-4 py-2 text-left text-xs font-semibold hover:bg-surface-hover border-none bg-transparent cursor-pointer ${typeFilter === 'nat' ? 'text-accent-primary bg-accent-primary/5' : 'text-text-main'}`}>NAT</button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="hidden md:block flex-1" />

                    {/* Add Question Button / All questions added message */}
                    {drawerSubjectId && (
                      (() => {
                        const needed = subjects.find(s => s.id === drawerSubjectId)?.question_count ?? 0;
                        const added = drawerQuestions.length;
                        const isComplete = added >= needed;

                        if (isComplete) {
                          return (
                            <span className="flex-1 md:flex-none text-center text-[12px] font-semibold text-emerald-600 flex items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-2 md:py-1.5 rounded-lg select-none whitespace-nowrap">
                              <ShieldCheck size={14} /> <span className="md:hidden">All added</span><span className="hidden md:inline">All questions added</span>
                            </span>
                          );
                        }

                        if (!isReadOnly && role !== "teacher") {
                          return (
                            <button
                              type="button"
                              onClick={handleDrawerNewQuestion}
                              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-primary/5 border border-accent-primary/30 text-accent-primary hover:bg-accent-primary hover:text-white transition-all text-xs font-bold shadow-sm cursor-pointer active:scale-95 whitespace-nowrap"
                            >
                              <Plus size={14} /> Add Question
                            </button>
                          );
                        }

                        return null;
                      })()
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons (Non-Draft Mode) */}
          {!isDraftStepperMode && (
            <div className="mb-2 flex flex-col xl:flex-row xl:justify-between xl:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 xl:shrink-0 mt-2 xl:mt-0">
                {isExamOver && (
                  <button
                    onClick={downloadQuestionPaper}
                    disabled={generatingPDF}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-accent-primary to-accent-primary/70 border border-[#004d4d] rounded-lg text-xs font-semibold text-white hover:from-[#006666] hover:to-[#004d4d] transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    <Download size={14} />
                    {generatingPDF ? "Generating..." : "Download Paper"}
                  </button>
                )}
                {role !== "teacher" && (
                  <>
                    <div className="relative" ref={moreMenuRef}>
                      <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-text-main hover:border-accent-primary hover:text-accent-primary hover:bg-bg transition-all shadow-sm"
                      >
                        <MoreVertical size={14} />
                      </button>
                      {showMoreMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                          <button
                            onClick={() => {
                              handleDuplicate();
                              setShowMoreMenu(false);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-text-main hover:bg-surface-hover hover:text-accent-primary flex items-center gap-2"
                          >
                            <Copy size={12} />
                            Duplicate
                          </button>
                          <button
                            onClick={() => {
                              handleTrash();
                              setShowMoreMenu(false);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                          >
                            <Trash2 size={12} />
                            Trash
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Teacher Banner */}
          {role === "teacher" && (
            <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-2xl p-5 mb-6 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
              <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="text-text-main font-bold text-base">
                  Question Preparation Mode
                </h3>
                <p className="text-text-muted text-sm font-medium mt-1">
                  Select your assigned subject below to start adding or editing
                  questions. You only have access to manage questions for
                  subjects specifically assigned to you.
                </p>
              </div>
            </div>
          )}

          {/* Subjects Split View (Questions Step) — visible for viewing on any status; edit controls self-gate on exam.status === 'draft' */}
          {(role === "teacher" || currentStep === 3) && (
            <Step3Questions
              role={role}
              userId={userId}
              isExamOver={isExamOver}
              exam={exam}
              subjects={subjects}
              questionCounts={questionCounts}
              drawerSubjectId={drawerSubjectId}
              drawerView={drawerView}
              setDrawerView={setDrawerView}
              drawerQuestions={drawerQuestions}
              drawerLoading={drawerLoading}
              drawerFormLoading={drawerFormLoading}
              drawerError={drawerError}
              editingQuestionId={editingQuestionId}
              qType={qType}
              setQType={setQType}
              qText={qText}
              setQText={setQText}
              qImage={qImage}
              setQImage={setQImage}
              optA={optA}
              setOptA={setOptA}
              optAImg={optAImg}
              setOptAImg={setOptAImg}
              optB={optB}
              setOptB={setOptB}
              optBImg={optBImg}
              setOptBImg={setOptBImg}
              optC={optC}
              setOptC={setOptC}
              optCImg={optCImg}
              setOptCImg={setOptCImg}
              optD={optD}
              setOptD={setOptD}
              optDImg={optDImg}
              setOptDImg={setOptDImg}
              correctAnswer={correctAnswer}
              setCorrectAnswer={setCorrectAnswer}
              natAnswer={natAnswer}
              setNatAnswer={setNatAnswer}
              openManageQuestions={openManageQuestions}
              handleDrawerNewQuestion={handleDrawerNewQuestion}
              handleDrawerCancel={handleDrawerCancel}
              doSaveQuestion={doSaveQuestion}
              handleDrawerEditQuestion={handleDrawerEditQuestion}
              handleDrawerDeleteQuestion={handleDrawerDeleteQuestion}
              handleDrawerImageUpload={handleDrawerImageUpload}
              setShowAddSubjectModal={setShowAddSubjectModal}
              setNewSubjectTeacherSearch={setNewSubjectTeacherSearch}
              editSubjectId={editSubjectId}
              setEditSubjectId={setEditSubjectId}
              inlineEditSubjectCount={inlineEditSubjectCount}
              setInlineEditSubjectCount={setInlineEditSubjectCount}
              handleSaveSubjectCount={handleSaveSubjectCount}
              handleDeleteSubject={handleDeleteSubject}
              setManageTeachersSubject={setManageTeachersSubject}
              setSelectedTeacherIds={setSelectedTeacherIds}
              setTeacherSearchQuery={setTeacherSearchQuery}
              searchQuery={questionSearchQuery}
              typeFilter={typeFilter}
            />
          )}

          {/* Assigned Students (Students Step) */}
          {(role === "teacher" || currentStep === 2) && (
            <Step2Students
              role={role}
              isExamOver={isExamOver}
              exam={exam}
              assignedStudents={assignedStudents}
              setAssignedStudents={setAssignedStudents}
              assignedSearchQuery={assignedSearchQuery}
              setAssignedSearchQuery={setAssignedSearchQuery}
              assignedCourseFilter={assignedCourseFilter}
              setAssignedCourseFilter={setAssignedCourseFilter}
              assignedBatchFilter={assignedBatchFilter}
              setAssignedBatchFilter={setAssignedBatchFilter}
              addSuccess={addSuccess}
              downloadResultsPDF={downloadResultsPDF}
              generatingPDF={generatingPDF}
              setConfirmDialog={setConfirmDialog}
              handleRemoveStudent={handleRemoveStudent}
              supabase={supabase}
              paramsId={params.id}
              isReadOnly={isReadOnly}
              onAddStudentsClick={() => { setShowAddStudentModal(true); setAddMode('search'); setAddError(''); setAddSuccess(''); }}
            />
          )}

          {/* Super Admin Payment Override */}
          {role === "super_admin" && (
            <div className="bg-bg border border-border rounded-2xl p-6 shadow-sm mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-text-main mb-1">
                  Super Admin Override
                </h3>
                <p className="text-text-muted text-sm font-medium">
                  Toggle the payment status of this exam without processing a
                  transaction.
                </p>
              </div>
              <button
                onClick={handleTogglePaid}
                disabled={publishing}
                className={`inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-xl transition-colors shadow-sm
              ${exam.is_paid
                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/20"
                  }
              ${publishing ? "opacity-50 cursor-not-allowed" : ""}
            `}
              >
                {publishing ? (
                  <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                {exam.is_paid ? "Mark as Unpaid" : "Mark as Paid"}
              </button>
            </div>
          )}

          {/* Exam Details Form — visible on step 1 for any status; read-only once published or over */}
          {role !== "teacher" && currentStep === 1 && (
            <Step1Details
              role={role}
              isExamOver={isExamOver}
              exam={exam}
              title={title}
              setTitle={setTitle}
              setExam={setExam}
              description={description}
              setDescription={setDescription}
              durationMinutes={durationMinutes}
              setDurationMinutes={setDurationMinutes}
              startTime={startTime}
              setEndTime={setEndTime}
              mcqCorrect={mcqCorrect}
              setMcqCorrect={setMcqCorrect}
              mcqWrong={mcqWrong}
              setMcqWrong={setMcqWrong}
              natCorrect={natCorrect}
              setNatCorrect={setNatCorrect}
              natWrong={natWrong}
              setNatWrong={setNatWrong}
              instructionsList={instructionsList}
              updateInstructionItem={updateInstructionItem}
              addInstructionItem={addInstructionItem}
              removeInstructionItem={removeInstructionItem}
              autoSaveExamDetails={autoSaveExamDetails}
              setShowInstructionPreview={setShowInstructionPreview}
              subjects={subjects}
              questionCounts={questionCounts}
              setShowAddSubjectModal={setShowAddSubjectModal}
              editSubjectId={editSubjectId}
              setEditSubjectId={setEditSubjectId}
              inlineEditSubjectCount={inlineEditSubjectCount}
              setInlineEditSubjectCount={setInlineEditSubjectCount}
              handleSaveSubjectCount={handleSaveSubjectCount}
              handleDeleteSubject={handleDeleteSubject}
              setManageTeachersSubject={setManageTeachersSubject}
              setSelectedTeacherIds={setSelectedTeacherIds}
              setTeacherSearchQuery={setTeacherSearchQuery}
              handleSaveExamDetails={handleSaveExamDetails}
              paramsId={params.id}
              isReadOnly={isReadOnly}
            />
          )}
          {/* Schedule Step — shown on step 4 for any status; read-only once published or over */}
          {(role === "teacher" || currentStep === 4) && (
            <Step4Schedule
              startTime={startTime}
              setStartTime={setStartTime}
              endTime={endTime}
              setEndTime={setEndTime}
              autoSaveSchedule={autoSaveSchedule}
              durationMinutes={durationMinutes}
              stepsBeforeScheduleComplete={stepsBeforeScheduleComplete}
              publishing={publishing}
              isReadOnly={isReadOnly}
            />
          )}

          {/* Publish Step — shown on step 5 for any status; Step5Publish renders its own read-only summary once published */}
          {(role === "teacher" || currentStep === 5) && (
            <Step5Publish
              exam={exam}
              allStepsComplete={allStepsComplete}
              publishing={publishing}
              startTime={startTime}
              endTime={endTime}
              title={title}
              description={description}
              durationMinutes={durationMinutes}
              mcqCorrect={mcqCorrect}
              mcqWrong={mcqWrong}
              natCorrect={natCorrect}
              natWrong={natWrong}
              subjects={subjects}
              questionCounts={questionCounts}
              assignedStudentsCount={assignedStudents.length}
              examFee={examFee}
              onNavigateToStep={handleSetStep}
              handlePublish={handlePublish}
              handlePayment={handlePayment}
              supabase={supabase}
            />
          )}
          
          {/* Bottom Navigation */}
          {isDraftStepperMode && (
            <div className="flex justify-between items-center mt-6 pt-5 border-t border-border pb-6">
              <button
                onClick={() => currentStep > 1 && handleSetStep(currentStep - 1)}
                disabled={currentStep <= 1}
                className={`inline-flex min-w-20 items-center justify-center gap-1.5 px-4 py-2 bg-surface border border-border text-text-main text-sm font-semibold rounded-lg transition-all shadow-sm ${currentStep > 1
                  ? "hover:bg-bg active:scale-95"
                  : "opacity-50 cursor-not-allowed"
                  }`}
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              
              {currentStep < 5 ? (
                <button
                  onClick={() => handleSetStep(currentStep + 1)}
                  className="inline-flex min-w-20 items-center justify-center gap-1.5 px-4 py-2 bg-accent-primary border border-accent-primary text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:opacity-90 active:scale-95 shadow-accent-primary/20"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              ) : (
                <div />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manage Teachers Modal */}
      {manageTeachersSubject && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => setManageTeachersSubject(null)}
        >
          <div
            className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-accent-primary px-6 py-4 flex items-center justify-between">
              <span className="text-white font-bold">
                Manage Teachers for {manageTeachersSubject.subject_name}
              </span>
              <button
                onClick={() => {
                  setManageTeachersSubject(null);
                  setShowAddTeacherMode(false);
                  setAddTeacherError("");
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {showAddTeacherMode ? (
              <form onSubmit={handleCreateAndAssignTeacher} className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-text-main font-bold text-sm">
                    Create New Teacher
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTeacherMode(false);
                      setAddTeacherError("");
                    }}
                    className="text-accent-primary text-xs font-bold hover:underline"
                  >
                    Back to List
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent-primary"
                      placeholder="e.g. Dr. Sharma"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newTeacherEmail}
                      onChange={(e) => setNewTeacherEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent-primary"
                      placeholder="sharma@school.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={newTeacherDepartment}
                      onChange={(e) => setNewTeacherDepartment(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent-primary"
                      placeholder="e.g. Mathematics"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newTeacherPassword}
                      onChange={(e) => setNewTeacherPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent-primary"
                      placeholder="Min 6 characters"
                    />
                  </div>
                </div>

                {addTeacherError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs font-medium mb-4">
                    {addTeacherError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTeacherMode(false);
                      setAddTeacherError("");
                    }}
                    className="px-4 py-2 bg-surface border border-border text-text-muted rounded-xl hover:bg-bg text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingTeacher}
                    className="px-4 py-2 bg-accent-primary text-white rounded-xl hover:bg-accent-primary/80 text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                  >
                    {addingTeacher ? "Creating..." : "Create & Assign"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-text-muted">
                    Select existing teachers:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTeacherMode(true);
                      setAddTeacherError("");
                    }}
                    className="text-accent-primary text-xs font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Add New Teacher
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={teacherSearchQuery}
                  onChange={(e) => setTeacherSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent-primary mb-3"
                />
                <div className="max-h-60 overflow-y-auto mb-4 border border-border rounded-lg custom-scrollbar">
                  {teachers.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-text-muted text-sm font-medium">
                        No teachers available.
                      </p>
                      <p className="text-text-muted text-xs mt-1">
                        Please add a new teacher above.
                      </p>
                    </div>
                  ) : (
                    teachers
                      .filter(
                        (t) =>
                          t.full_name
                            .toLowerCase()
                            .includes(teacherSearchQuery.toLowerCase()) ||
                          (t.department || "")
                            .toLowerCase()
                            .includes(teacherSearchQuery.toLowerCase()),
                      )
                      .map((t) => (
                        <label
                          key={t.id}
                          className="flex items-center gap-3 p-3 hover:bg-bg cursor-pointer border-b border-border last:border-0 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTeacherIds.includes(t.id)}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedTeacherIds([
                                  ...selectedTeacherIds,
                                  t.id,
                                ]);
                              else
                                setSelectedTeacherIds(
                                  selectedTeacherIds.filter(
                                    (id) => id !== t.id,
                                  ),
                                );
                            }}
                            className="w-4 h-4 text-accent-primary rounded border-border focus:ring-accent-primary cursor-pointer"
                          />
                          <span className="text-sm font-medium text-text-main">
                            {t.full_name}{" "}
                            <span className="text-xs text-text-muted">
                              ({t.department || "No Dept"})
                            </span>
                          </span>
                        </label>
                      ))
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setManageTeachersSubject(null)}
                    className="px-4 py-2 bg-surface border border-border text-text-muted rounded-xl hover:bg-bg text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSubjectTeachers}
                    className="px-4 py-2 bg-accent-primary text-white rounded-xl hover:bg-accent-primary/80 text-sm font-semibold transition-colors shadow-sm"
                  >
                    Save Teachers
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instruction Preview Modal */}
      {showInstructionPreview && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
          onClick={() => setShowInstructionPreview(false)}
        >
          <div
            className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-accent-primary px-6 py-4 flex items-center justify-between shrink-0">
              <span className="text-white font-bold">
                Exam Instructions Preview
              </span>
              <button
                onClick={() => setShowInstructionPreview(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-[#F9FAFB]">
              <p className="text-sm text-text-muted mb-4 text-center font-medium">
                This is how the instructions will appear to the student in the
                exam app.
              </p>

              <div className="border border-[#E4E7EC] rounded-xl p-8 bg-surface shadow-sm max-w-2xl mx-auto">
                <div className="border-l-4 border-[#008080] pl-3 mb-4">
                  <h3 className="text-sm font-extrabold text-[#1D2939] uppercase tracking-wider">
                    Important Instructions
                  </h3>
                </div>
                <ul className="space-y-3">
                  {/* General Instructions */}
                  <li className="flex gap-3 text-sm text-[#667085] font-medium">
                    <span className="text-accent-primary font-bold mt-0.5">
                      ▸
                    </span>
                    Do not refresh the page or close the application once the
                    exam has started.
                  </li>
                  <li className="flex gap-3 text-sm text-[#667085] font-medium">
                    <span className="text-accent-primary font-bold mt-0.5">
                      ▸
                    </span>
                    The timer will run continuously. If you get disconnected,
                    your time will keep running on the server.
                  </li>
                  <li className="flex gap-3 text-sm text-[#667085] font-medium">
                    <span className="text-accent-primary font-bold mt-0.5">
                      ▸
                    </span>
                    Your answers are automatically saved as you select them.
                  </li>
                  <li className="flex gap-3 text-sm text-[#667085] font-medium">
                    <span className="text-accent-primary font-bold mt-0.5">
                      ▸
                    </span>
                    Once the exam end time is reached, it will be automatically
                    submitted regardless of your progress.
                  </li>

                  {/* Custom Exam-Specific Instructions */}
                  {instructionsList.filter((i) => i.trim() !== "").length > 0 && (
                    <>
                      <li className="flex items-center gap-2 pt-2">
                        <span className="h-px flex-1 bg-emerald-100" />
                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded tracking-wider shrink-0">
                          Your Additions
                        </span>
                        <span className="h-px flex-1 bg-emerald-100" />
                      </li>
                      {instructionsList
                        .filter((i) => i.trim() !== "")
                        .map((inst, idx) => (
                          <li
                            key={idx}
                            className="flex gap-3 text-sm text-[#667085] font-medium bg-emerald-50/50 p-2 -mx-2 rounded border border-dashed border-emerald-100"
                          >
                            <span className="text-accent-primary font-bold mt-0.5 shrink-0">
                              ▸
                            </span>
                            <span>{inst}</span>
                          </li>
                        ))}
                    </>
                  )}
                </ul>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInstructionPreview(false)}
                className="px-6 py-2.5 bg-accent-primary text-white font-semibold rounded-xl hover:bg-accent-primary/80 text-sm transition-colors shadow-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowAddStudentModal(false);
            setAddError("");
            setAddSuccess("");
            setAddMode("link");
            setLinkCopied(false);
            setSearchQuery("");
          }}
        >
          <div
            className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-accent-primary px-6 py-4 flex items-center justify-between">
              <span className="text-white font-bold">Add Students to Exam</span>
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setAddError("");
                  setAddSuccess("");
                  setAddMode("link");
                  setLinkCopied(false);
                  setSearchQuery("");
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 h-[550px] flex flex-col">
              {/* Tabs */}
              <div className="flex bg-bg rounded-xl p-1 mb-6 border border-border shrink-0">
                <button
                  onClick={() => {
                    setAddMode("link");
                    setAddError("");
                    setAddSuccess("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMode === "link" ? "bg-surface text-accent-primary shadow-sm" : "text-text-muted hover:text-text-main"}`}
                >
                  Share Link
                </button>
                <button
                  onClick={() => {
                    setAddMode("search");
                    setAddError("");
                    setAddSuccess("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMode === "search" || addMode === "create" ? "bg-surface text-accent-primary shadow-sm" : "text-text-muted hover:text-text-main"}`}
                >
                  Search & Add
                </button>
                <button
                  onClick={() => {
                    setAddMode("csv");
                    setAddError("");
                    setAddSuccess("");
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMode === "csv" ? "bg-surface text-accent-primary shadow-sm" : "text-text-muted hover:text-text-main"}`}
                >
                  Import CSV
                </button>
              </div>

              {addSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-600 text-sm font-medium mb-6">
                  {addSuccess}
                </div>
              )}
              {addError && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-600 text-sm font-medium mb-6 flex items-center gap-2">
                  <AlertCircle size={16} /> {addError}
                </div>
              )}

              {addMode === "link" ? (
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                  <div className="bg-surface border border-border rounded-xl p-6">
                    <Globe
                      size={32}
                      className="mx-auto text-accent-primary mb-3"
                    />
                    <p className="text-text-main text-base font-bold text-center mb-2">
                      Public Registration Link
                    </p>
                    <p className="text-text-muted text-sm font-medium text-center mb-5">
                      Share this link with students. They will be automatically
                      added to this exam upon completing the form.
                    </p>

                    <div className="bg-bg border border-border p-4 rounded-xl mb-5 space-y-3">
                      <p className="text-xs font-bold text-accent-primary uppercase tracking-wider mb-2">
                        Optional: Pre-fill Student Details
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                            Course
                          </label>
                          <CustomCombobox
                            value={linkCourse}
                            onChange={setLinkCourse}
                            options={uniqueCourses as string[]}
                            placeholder="e.g. NEET"
                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-main text-xs focus:outline-none focus:border-accent-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                            Batch
                          </label>
                          <CustomCombobox
                            value={linkBatch}
                            onChange={setLinkBatch}
                            options={uniqueBatches as string[]}
                            placeholder="e.g. Morning"
                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-main text-xs focus:outline-none focus:border-accent-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                            Session
                          </label>
                          <CustomCombobox
                            value={linkSession}
                            onChange={setLinkSession}
                            options={uniqueSessions as string[]}
                            placeholder="e.g. 2024-25"
                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-main text-xs focus:outline-none focus:border-accent-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${getSchoolBaseUrl()}/register/${params.id}${linkCourse || linkBatch || linkSession ? `?p=${btoa(JSON.stringify({ c: linkCourse || undefined, b: linkBatch || undefined, s: linkSession || undefined }))}` : ""}`}
                        className="flex-1 px-4 py-2.5 bg-bg border border-border rounded-lg text-sm text-text-muted font-mono focus:outline-none truncate"
                      />
                      <button
                        onClick={() => {
                          const url = `${getSchoolBaseUrl()}/register/${params.id}${linkCourse || linkBatch || linkSession ? `?p=${btoa(JSON.stringify({ c: linkCourse || undefined, b: linkBatch || undefined, s: linkSession || undefined }))}` : ""}`;
                          navigator.clipboard.writeText(url);
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }}
                        className="px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
                      >
                        <CopyIcon size={16} />
                        {linkCopied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2 mt-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddStudentModal(false);
                        setAddError("");
                        setSearchQuery("");
                      }}
                      className="flex-1 py-2.5 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-bg text-sm transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : addMode === "search" ? (
                <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                  <div className="flex flex-col gap-3 shrink-0">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or roll number..."
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all"
                    />
                    <div className="flex gap-2">
                      <select
                        value={filterCourse}
                        onChange={(e) => setFilterCourse(e.target.value)}
                        className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary"
                      >
                        <option value="">All Courses</option>
                        {uniqueCourses.map((c: any) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <select
                        value={filterBatch}
                        onChange={(e) => setFilterBatch(e.target.value)}
                        className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary"
                      >
                        <option value="">All Batches</option>
                        {uniqueBatches.map((b: any) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                      <select
                        value={filterSession}
                        onChange={(e) => setFilterSession(e.target.value)}
                        className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary"
                      >
                        <option value="">All Sessions</option>
                        {uniqueSessions.map((s: any) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {filteredStudents.length > 0 && (
                    <div className="flex justify-between items-center px-1 shrink-0">
                      <div className="text-xs font-semibold text-text-muted">
                        {selectedStudents.length} selected
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            if (
                              selectedStudents.length ===
                              filteredStudents.length
                            ) {
                              setSelectedStudents([]);
                            } else {
                              setSelectedStudents(
                                filteredStudents.map((s) => s.id),
                              );
                            }
                          }}
                          className="text-accent-primary text-xs font-bold hover:underline"
                        >
                          {selectedStudents.length === filteredStudents.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto border border-border rounded-xl divide-y divide-[#e0f2f2] custom-scrollbar">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="p-3 flex justify-between items-center hover:bg-bg transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedStudents((prev) =>
                            prev.includes(student.id)
                              ? prev.filter((id) => id !== student.id)
                              : [...prev, student.id],
                          );
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => { }}
                            className="w-4 h-4 text-accent-primary border-border rounded focus:ring-accent-primary cursor-pointer"
                          />
                          <div>
                            <p className="font-semibold text-text-main text-sm">
                              {student.full_name}
                            </p>
                            <p className="text-xs font-mono text-accent-primary mt-0.5">
                              Roll: {student.roll_number}{" "}
                              <span className="text-text-muted px-1">•</span>{" "}
                              <span className="text-gray-500 font-sans">
                                {student.course} ({student.batch})
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignExisting(student.id);
                          }}
                          className="px-4 py-2 bg-surface-hover text-accent-primary hover:bg-accent-primary hover:text-white rounded-lg text-xs font-bold uppercase tracking-wide transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                    {filteredStudents.length === 0 && (
                      <div className="p-6 text-center">
                        <p className="text-sm font-medium text-text-muted">
                          No available students found.
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedStudents.length > 0 && (
                    <button
                      onClick={handleBulkAssign}
                      disabled={bulkAssigning}
                      className="w-full py-3 mt-2 shrink-0 bg-accent-primary hover:bg-accent-primary/80 text-white font-bold rounded-xl shadow-lg shadow-accent-primary/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {bulkAssigning ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        `Assign ${selectedStudents.length} Selected Student${selectedStudents.length !== 1 ? "s" : ""}`
                      )}
                    </button>
                  )}

                  <div className="pt-2 text-center shrink-0">
                    <p className="text-sm font-medium text-text-muted">
                      Can't find the student?
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAddMode("create");
                        setAddError("");
                        setAddSuccess("");
                      }}
                      className="mt-2 text-accent-primary font-bold text-sm hover:underline"
                    >
                      Create New Student
                    </button>
                  </div>
                </div>
              ) : addMode === "create" ? (
                <form
                  onSubmit={handleAddStudent}
                  className="space-y-4 flex-1 flex flex-col overflow-y-auto custom-scrollbar"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-text-main font-bold text-sm">
                      Create New Student
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setAddMode("search");
                        setAddError("");
                        setAddSuccess("");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg text-accent-primary hover:bg-surface-hover hover:text-[#006666] rounded-lg text-xs font-bold transition-colors border border-border"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      placeholder="Aarav Patel"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      value={newRoll}
                      onChange={(e) => setNewRoll(e.target.value)}
                      required
                      placeholder="2024001"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5">
                      Date of Birth{" "}
                      <span className="text-text-muted font-normal">
                        (password = DDMMYYYY)
                      </span>
                    </label>
                    <input
                      type="date"
                      value={newDob}
                      onChange={(e) => setNewDob(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5">
                        Course
                      </label>
                      <CustomCombobox
                        value={newCourse}
                        onChange={setNewCourse}
                        options={uniqueCourses as string[]}
                        placeholder="e.g. NEET"
                        className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5">
                        Batch
                      </label>
                      <CustomCombobox
                        value={newBatch}
                        onChange={setNewBatch}
                        options={uniqueBatches as string[]}
                        placeholder="e.g. Morning"
                        className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5">
                        Session
                      </label>
                      <CustomCombobox
                        value={newSession}
                        onChange={setNewSession}
                        options={uniqueSessions as string[]}
                        placeholder="e.g. 2024-25"
                        className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-sm font-medium transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={addingStudent}
                      className="flex-1 py-3 bg-accent-primary hover:bg-accent-primary/80 text-white font-semibold rounded-xl disabled:opacity-50 text-sm transition-colors shadow-sm shadow-accent-primary/20"
                    >
                      {addingStudent ? "Creating..." : "Create & Assign"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddStudentModal(false);
                        setAddError("");
                        setSearchQuery("");
                      }}
                      className="px-6 py-3 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-bg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCsvImport} className="space-y-4">
                  <div className="bg-bg border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-text-main text-sm font-bold">
                        CSV Format:
                      </p>
                      <button
                        type="button"
                        onClick={handleDownloadCsvTemplate}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-primary hover:underline bg-surface px-2 py-1 rounded border border-accent-primary/20 shadow-sm hover:bg-surface-hover transition-colors"
                      >
                        <Download size={12} /> Download Template
                      </button>
                    </div>
                    <code className="text-xs text-accent-primary bg-surface px-4 py-3 block border border-border rounded-lg font-mono overflow-x-auto whitespace-nowrap">
                      name, roll_number, dob, course, batch, session
                      <br />
                      Aarav Patel, 2024001, 15/06/2005, NEET, Morning, 2024-25
                      <br />
                      Priya Singh, 2024002, 22/03/2005, JEE, Evening, 2024-25
                    </code>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-1.5">
                      Select CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      required
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-text-main file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-lg file:bg-accent-primary/10 file:text-accent-primary file:font-semibold hover:file:bg-accent-primary/20 transition-all text-sm"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={addingStudent || !csvFile}
                      className="flex-1 py-3 bg-accent-primary hover:bg-accent-primary/80 text-white font-semibold rounded-xl disabled:opacity-50 text-sm transition-colors shadow-sm shadow-accent-primary/20"
                    >
                      {addingStudent ? "Importing..." : "Import CSV"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddStudentModal(false);
                        setAddError("");
                      }}
                      className="px-6 py-3 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-bg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">
                {confirmDialog.title}
              </h3>
              <p className="text-text-muted text-sm font-medium mb-6">
                {confirmDialog.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="flex-1 py-3 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-bg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className={`flex-1 py-3 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm ${confirmDialog.confirmColor.includes("red")
                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                    : confirmDialog.confirmColor.includes("orange")
                      ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                      : confirmDialog.confirmColor.includes("amber")
                        ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                        : "bg-accent-primary hover:bg-accent-primary/80 shadow-accent-primary/20"
                    }`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-accent-primary px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold">Add Subject</h3>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSubject} className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    value={newSubject.name}
                    onChange={(e) =>
                      setNewSubject({ ...newSubject, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all text-sm font-medium"
                    placeholder="e.g. Physics"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-1.5">
                    No. of Questions
                  </label>
                  <input
                    type="number"
                    value={newSubject.questionCount}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        questionCount: Math.max(
                          0,
                          parseInt(e.target.value) || 0,
                        ),
                      })
                    }
                    min="0"
                    required
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-lg text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 transition-all text-sm font-medium"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-text-muted mb-2">
                  Assign Teachers
                </label>
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={newSubjectTeacherSearch}
                  onChange={(e) => setNewSubjectTeacherSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent-primary mb-3"
                />
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg custom-scrollbar">
                  {teachers.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-text-muted text-sm font-medium">
                        No teachers available.
                      </p>
                    </div>
                  ) : (
                    teachers
                      .filter(
                        (t) =>
                          t.full_name
                            .toLowerCase()
                            .includes(newSubjectTeacherSearch.toLowerCase()) ||
                          (t.department || "")
                            .toLowerCase()
                            .includes(newSubjectTeacherSearch.toLowerCase()),
                      )
                      .map((t) => (
                        <label
                          key={t.id}
                          className="flex items-center gap-3 p-3 hover:bg-bg cursor-pointer border-b border-border last:border-0 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={newSubject.teacherIds.includes(t.id)}
                            onChange={() => toggleNewSubjectTeacher(t.id)}
                            className="w-4 h-4 text-accent-primary rounded border-border focus:ring-accent-primary cursor-pointer"
                          />
                          <span className="text-sm font-medium text-text-main">
                            {t.full_name}{" "}
                            <span className="text-xs text-text-muted">
                              ({t.department || "No Dept"})
                            </span>
                          </span>
                        </label>
                      ))
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-5 py-2.5 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-bg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-accent-primary text-white font-semibold rounded-xl hover:bg-accent-primary/80 text-sm transition-colors shadow-sm"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crop tool for the Manage Questions drawer */}
      {rawImageToCrop && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-[1100] p-4 animate-in fade-in">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-accent-primary px-6 py-4 flex items-center justify-between">
              <span className="text-white font-bold">Crop Image</span>
              <button
                type="button"
                onClick={() => setRawImageToCrop(null)}
                className="text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex-1 overflow-auto bg-bg flex justify-center items-center">
              <ReactCrop
                crop={crop}
                onChange={(c: any) => setCrop(c)}
                onComplete={(c: any) => setCompletedCrop(c)}
                className="max-h-full"
              >
                <img
                  src={rawImageToCrop || undefined}
                  onLoad={(e) => setImageRef(e.currentTarget)}
                  alt="Crop preview"
                  className="max-h-[60vh] object-contain"
                />
              </ReactCrop>
            </div>
            <div className="p-6 border-t border-border bg-surface flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRawImageToCrop(null)}
                className="px-5 py-2.5 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-surface-hover text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropAndSave}
                className="px-5 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
              >
                Crop & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}