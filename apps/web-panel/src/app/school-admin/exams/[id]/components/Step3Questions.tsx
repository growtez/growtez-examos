import React from 'react';
import { BookOpen, Edit2, Trash2, Search } from 'lucide-react';

interface Step3QuestionsProps {
  role: string;
  userId: string;
  isExamOver: boolean;
  exam: any;
  subjects: any[];
  questionCounts: Record<string, number>;
  drawerSubjectId: string | null;
  drawerView: 'list' | 'editor';
  setDrawerView: (val: 'list' | 'editor') => void;
  drawerQuestions: any[];
  drawerLoading: boolean;
  drawerFormLoading: boolean;
  drawerError: string;
  editingQuestionId: string | null;
  qType: 'mcq' | 'nat';
  setQType: (val: 'mcq' | 'nat') => void;
  qText: string;
  setQText: (val: string) => void;
  qImage: string | null;
  setQImage: (val: string | null) => void;
  optA: string;
  setOptA: (val: string) => void;
  optAImg: string | null;
  setOptAImg: (val: string | null) => void;
  optB: string;
  setOptB: (val: string) => void;
  optBImg: string | null;
  setOptBImg: (val: string | null) => void;
  optC: string;
  setOptC: (val: string) => void;
  optCImg: string | null;
  setOptCImg: (val: string | null) => void;
  optD: string;
  setOptD: (val: string) => void;
  optDImg: string | null;
  setOptDImg: (val: string | null) => void;
  correctAnswer: string;
  setCorrectAnswer: (val: string) => void;
  natAnswer: string;
  setNatAnswer: (val: string) => void;

  openManageQuestions: (subjectId: string) => void;
  handleDrawerNewQuestion: () => void;
  handleDrawerCancel: () => void;
  doSaveQuestion: (e: any, addAnother: boolean) => any;
  handleDrawerEditQuestion: (q: any) => void;
  handleDrawerDeleteQuestion: (qId: string) => void;
  handleDrawerImageUpload: (e: React.ChangeEvent<HTMLInputElement>, target: 'question' | 'A' | 'B' | 'C' | 'D') => void;

  setShowAddSubjectModal: (val: boolean) => void;
  setNewSubjectTeacherSearch: (val: string) => void;
  editSubjectId: string | null;
  setEditSubjectId: (val: string | null) => void;
  inlineEditSubjectCount: number;
  setInlineEditSubjectCount: (val: number) => void;
  handleSaveSubjectCount: (subjectId: string) => void;
  handleDeleteSubject: (e: any, id: string, name: string) => void;
  setManageTeachersSubject: (subject: any) => void;
  setSelectedTeacherIds: (ids: string[]) => void;
  setTeacherSearchQuery: (query: string) => void;
  searchQuery: string;
  typeFilter: string;
}

export default function Step3Questions({
  role,
  userId,
  isExamOver,
  exam,
  subjects,
  questionCounts,
  drawerSubjectId,
  drawerView,
  setDrawerView,
  drawerQuestions,
  drawerLoading,
  drawerFormLoading,
  drawerError,
  editingQuestionId,
  qType,
  setQType,
  qText,
  setQText,
  qImage,
  setQImage,
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
  openManageQuestions,
  handleDrawerNewQuestion,
  handleDrawerCancel,
  doSaveQuestion,
  handleDrawerEditQuestion,
  handleDrawerDeleteQuestion,
  handleDrawerImageUpload,
  setShowAddSubjectModal,
  setNewSubjectTeacherSearch,
  editSubjectId,
  setEditSubjectId,
  inlineEditSubjectCount,
  setInlineEditSubjectCount,
  handleSaveSubjectCount,
  handleDeleteSubject,
  setManageTeachersSubject,
  setSelectedTeacherIds,
  setTeacherSearchQuery,
  searchQuery,
  typeFilter,
}: Step3QuestionsProps) {

  const isDraftStepperMode = role !== 'teacher' && exam?.status === 'draft';

  return (
    <div className="flex flex-col gap-4 mb-4">
      {!isDraftStepperMode && (
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
          {subjects.map((s) => {
            const added = questionCounts[s.id] || 0;
            const needed = s.question_count;
            const complete = added >= needed;
            const isAssignedTeacher =
              role !== 'teacher' ||
              (role === 'teacher' && s.exam_subject_teachers?.some((est: any) => est.teacher_id === userId));
            const isSelected = drawerSubjectId === s.id;

            return (
              <button
                key={s.id}
                type="button"
                disabled={!isAssignedTeacher}
                onClick={() => isAssignedTeacher && openManageQuestions(s.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                  !isAssignedTeacher
                    ? 'bg-gray-50 border-gray-200 text-gray-400 opacity-60 cursor-not-allowed'
                    : isSelected
                      ? 'bg-accent-primary text-white border-accent-primary shadow-sm'
                      : 'bg-surface border-border text-text-main hover:border-accent-primary/50'
                }`}
              >
                {s.subject_name}
                <span className={isSelected ? 'text-white/80' : complete ? 'text-emerald-600' : 'text-amber-600'}>
                  {added}/{needed}
                </span>
              </button>
            );
          })}
        </div>
      )}



      {/* Questions Area — outer card border/background removed */}
      <div className="flex-1 flex flex-col min-h-[550px]">
        {/* Content Area */}
        {drawerSubjectId ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            <div className="space-y-3">
              {drawerLoading ? (
                <div className="flex justify-center p-8"><span className="w-6 h-6 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" /></div>
              ) : drawerQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen size={32} className="mx-auto mb-3 text-border" />
                  <p className="text-text-muted font-medium">No questions added yet.</p>
                </div>
              ) : (
                (() => {
                  const filtered = drawerQuestions.filter((q, originalIdx) => {
                    const qNumber = (originalIdx + 1).toString();
                    const matchesSearch = q.question_text?.toLowerCase().includes(searchQuery.toLowerCase()) || qNumber.includes(searchQuery.trim());
                    const matchesType = typeFilter === 'all' || q.question_type === typeFilter;
                    return matchesSearch && matchesType;
                  });
                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 mx-4 bg-surface border border-border rounded-xl shadow-sm">
                        <Search size={32} className="mx-auto mb-3 text-border animate-pulse" />
                        <p className="text-text-muted font-medium">No questions match your search/filters.</p>
                      </div>
                    );
                  }
                  return filtered.map((q) => {
                    const originalNumber = drawerQuestions.indexOf(q) + 1;
                    return (
                    <div key={q.id} className="mx-4 p-4 bg-surface border border-border rounded-xl shadow-sm group relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-surface border border-border flex items-center justify-center text-[10px] text-text-main font-bold">{originalNumber}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${q.question_type === 'mcq' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                            {q.question_type}
                          </span>
                          <span className="text-[10px] font-bold text-text-muted">+{q.positive_marks} / {q.negative_marks}</span>
                        </div>
                        {exam?.status === 'draft' && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleDrawerEditQuestion(q)} className="text-accent-primary hover:bg-accent-primary/10 p-1 rounded transition-colors"><Edit2 size={13} /></button>
                            <button onClick={() => handleDrawerDeleteQuestion(q.id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"><Trash2 size={13} /></button>
                          </div>
                        )}
                      </div>
                      <p className="text-text-main text-xs font-semibold whitespace-pre-wrap mb-1.5">{q.question_text}</p>
                      {q.image_url && <img src={q.image_url} alt="Question" className="max-w-full max-h-[150px] object-contain rounded-lg border border-border mb-3" />}
                      {q.question_type === 'mcq' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <div key={opt} className={`p-2 rounded text-[11px] border transition-colors flex items-start ${q.correct_option === opt ? 'bg-accent-primary/5 border-accent-primary text-accent-primary font-bold' : 'bg-surface text-text-muted border-border font-medium'}`}>
                              <span className="mr-1.5">{opt}.</span>
                              <div className="flex flex-col gap-1.5">
                                {q.options[opt] && <span>{q.options[opt]}</span>}
                                {q.options[`${opt}_image`] && <img src={q.options[`${opt}_image`]} alt={opt} className="max-w-[100px] max-h-[80px] object-contain rounded border border-border" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {q.question_type === 'nat' && (
                        <div className="inline-flex px-3 py-1.5 bg-accent-primary/5 border border-accent-primary rounded-lg text-xs text-accent-primary font-bold mt-2">Answer: {q.correct_option}</div>
                      )}
                    </div>
                  )});
                })()
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-4">
            <BookOpen size={36} className="mb-3 text-border" />
            <p className="text-sm font-bold text-text-main mb-1">Manage Questions</p>
            <p className="text-xs text-center max-w-sm">
              Select a subject from the navigation pills above to view questions.
            </p>
          </div>
        )}
      </div>

      {drawerSubjectId && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[1000] transition-opacity duration-300 ${drawerView === 'editor' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setDrawerView('list')}
          />
          <div className={`fixed top-0 right-0 h-[100dvh] w-full max-w-[560px] bg-bg z-[1001] transition-transform duration-500 ease-out shadow-[-8px_0_40px_-12px_rgba(0,0,0,0.25)] flex flex-col border-l border-border ${drawerView === 'editor' ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Drawer Header - pinned */}
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-accent-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen size={17} className="text-accent-primary" />
                </span>
                <div>
                  <h3 className="text-sm font-bold m-0 text-text-main leading-tight">
                    {editingQuestionId ? 'Edit Question' : 'Add New Question'}
                  </h3>
                  <p className="text-[11px] text-text-muted font-medium m-0">
                    {subjects.find(s => s.id === drawerSubjectId)?.subject_name}
                  </p>
                </div>
              </div>
              <button
                className="w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-text-muted transition-all hover:bg-red-50 hover:border-red-200 hover:text-red-500 cursor-pointer text-sm"
                onClick={handleDrawerCancel}
              >
                ✕
              </button>
            </div>

            {/* Drawer Body - scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-bg">
              <form id="drawer-question-form" onSubmit={(e) => doSaveQuestion(e, false)} className="space-y-5">

                {/* Question type toggle */}
                <div className="flex bg-surface rounded-xl p-1 border border-border shadow-sm">
                  <button type="button" onClick={() => setQType('mcq')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${qType === 'mcq' ? 'bg-accent-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
                    Multiple Choice
                  </button>
                  <button type="button" onClick={() => setQType('nat')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${qType === 'nat' ? 'bg-accent-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'}`}>
                    Numerical
                  </button>
                </div>

                {/* Question text + image section */}
                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                    <label className="text-[11px] font-bold text-text-main uppercase tracking-wider">Question</label>
                  </div>
                  <textarea
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-text-main focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/15 outline-none resize-none text-sm font-medium transition-shadow"
                    placeholder="Enter question..."
                  />
                  <div className="flex items-center gap-3 pt-1">
                    <input type="file" accept="image/*" onChange={(e) => handleDrawerImageUpload(e, 'question')} className="hidden" id="q-img" />
                    <label htmlFor="q-img" className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg border border-border text-accent-primary font-semibold text-xs rounded-lg hover:bg-accent-primary/5 hover:border-accent-primary/40 transition-colors">
                      Upload Image
                    </label>
                    {qImage && (
                      <div className="relative group">
                        <img src={qImage} alt="Preview" className="h-10 rounded-lg border border-border object-contain" />
                        <button type="button" onClick={() => setQImage(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">✕</button>
                      </div>
                    )}
                  </div>
                </div>

                {qType === 'mcq' ? (
                  <>
                    {/* Options section */}
                    <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                        <label className="text-[11px] font-bold text-text-main uppercase tracking-wider">Options</label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'Option A', val: optA, setVal: setOptA, img: optAImg, setImg: setOptAImg, id: 'A' },
                          { label: 'Option B', val: optB, setVal: setOptB, img: optBImg, setImg: setOptBImg, id: 'B' },
                          { label: 'Option C', val: optC, setVal: setOptC, img: optCImg, setImg: setOptCImg, id: 'C' },
                          { label: 'Option D', val: optD, setVal: setOptD, img: optDImg, setImg: setOptDImg, id: 'D' }
                        ].map((opt) => (
                          <div
                            key={opt.label}
                            className={`bg-bg p-3 rounded-lg border transition-colors ${correctAnswer === opt.id ? 'border-accent-primary/50 ring-1 ring-accent-primary/15' : 'border-border'}`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="flex items-center gap-1.5 text-xs font-bold text-text-muted">
                                <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold ${correctAnswer === opt.id ? 'bg-accent-primary text-white' : 'bg-surface border border-border text-text-muted'}`}>
                                  {opt.id}
                                </span>
                                {opt.label}
                              </label>
                              {correctAnswer === opt.id && (
                                <span className="text-[9px] font-bold text-accent-primary uppercase tracking-wider">Correct</span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={opt.val}
                              onChange={(e) => opt.setVal(e.target.value)}
                              className="w-full px-3 py-1.5 bg-surface border border-border rounded-lg text-sm mb-2 outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/15 transition-shadow"
                            />
                            <div className="flex items-center gap-2">
                              <input type="file" accept="image/*" onChange={(e) => handleDrawerImageUpload(e, opt.id as any)} className="hidden" id={`img-${opt.id}`} />
                              <label htmlFor={`img-${opt.id}`} className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 bg-surface border border-border text-accent-primary font-semibold text-[10px] rounded hover:bg-accent-primary/5 hover:border-accent-primary/40 transition-colors">
                                Add Image
                              </label>
                              {opt.img && (
                                <div className="relative group">
                                  <img src={opt.img} alt="Preview" className="h-6 rounded border border-border object-contain" />
                                  <button type="button" onClick={() => opt.setImg(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">✕</button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Correct answer section */}
                    <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                        <label className="text-[11px] font-bold text-text-main uppercase tracking-wider">Correct Answer</label>
                      </div>
                      <div className="flex gap-2">
                        {['A', 'B', 'C', 'D'].map((opt) => (
                          <button key={opt} type="button" onClick={() => setCorrectAnswer(opt)}
                            className={`flex-1 h-10 rounded-lg text-sm font-bold border-2 transition-all ${correctAnswer === opt ? 'bg-accent-primary border-accent-primary text-white shadow-sm' : 'bg-bg border-border text-text-muted hover:border-accent-primary/50 hover:text-accent-primary'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-surface border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                      <label className="text-[11px] font-bold text-text-main uppercase tracking-wider">Correct Numerical Answer</label>
                    </div>
                    <input
                      type="text"
                      value={natAnswer}
                      onChange={(e) => setNatAnswer(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/15 text-sm font-medium transition-shadow"
                    />
                  </div>
                )}

                {drawerError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    {drawerError}
                  </div>
                )}
              </form>
            </div>

            {/* Drawer Footer - pinned at bottom */}
            <div className="px-5 py-3.5 border-t border-border bg-surface shrink-0 flex gap-2">
              <button type="button" onClick={handleDrawerCancel} className="flex-1 py-2.5 bg-bg border border-border text-text-muted font-semibold rounded-lg text-sm hover:bg-surface-hover hover:text-text-main transition-colors">
                Cancel
              </button>
              <button type="submit" form="drawer-question-form" disabled={drawerFormLoading} className="flex-1 py-2.5 bg-accent-primary text-white font-semibold rounded-lg text-sm hover:bg-accent-primary/90 disabled:opacity-50 transition-colors shadow-sm">
                {drawerFormLoading ? 'Saving...' : 'Save Question'}
              </button>
              {!editingQuestionId && drawerQuestions.length < (subjects.find(s => s.id === drawerSubjectId)?.question_count ?? 0) - 1 && (
                <button type="button" onClick={(e) => doSaveQuestion(e, true)} disabled={drawerFormLoading} className="flex-1 py-2.5 bg-accent-primary/10 text-accent-primary font-semibold rounded-lg text-sm border border-accent-primary/20 hover:bg-accent-primary/20 disabled:opacity-50 transition-colors">
                  Save & Add Next
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}