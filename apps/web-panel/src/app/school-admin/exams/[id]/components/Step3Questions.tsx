'use client';

import React from 'react';
import { BookOpen, Plus, Edit2, Trash2, Check, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';

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
}: Step3QuestionsProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 mb-6">
      {/* Left Side: Subjects List (Sticky Sidebar) */}
      <div className="w-full md:w-[240px] shrink-0 bg-surface border border-border rounded-2xl p-5 shadow-sm h-fit md:sticky md:top-0 z-10">
        <div className="mb-4 border-b border-[#f0f7f7] pb-1.5 flex justify-between items-center">
          <h3 className="text-lg font-bold text-text-main">Subjects</h3>
          {!isExamOver && exam?.status === 'draft' && role !== 'teacher' && (
            <button
              type="button"
              onClick={() => { setShowAddSubjectModal(true); setNewSubjectTeacherSearch(''); }}
              className="text-accent-primary hover:text-accent-primary/80 transition-colors p-1"
              title="Add Subject"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
        
        <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
          {subjects.map((s) => {
            const added = questionCounts[s.id] || 0;
            const needed = s.question_count;
            const complete = added >= needed;
            const isAssignedTeacher = role !== 'teacher' || (role === 'teacher' && s.exam_subject_teachers?.some((est: any) => est.teacher_id === userId));
            const isSelected = drawerSubjectId === s.id;
            
            return (
              <div
                key={s.id}
                onClick={() => { if (isAssignedTeacher) openManageQuestions(s.id); }}
                role="button"
                tabIndex={isAssignedTeacher ? 0 : -1}
                className={`flex flex-col rounded-xl p-3 gap-2 transition-all text-left ${
                  role === 'teacher' 
                    ? (isAssignedTeacher 
                        ? (isSelected ? 'bg-accent-primary/5 border-2 border-accent-primary shadow-sm' : 'bg-surface border-2 border-transparent hover:border-accent-primary/50 cursor-pointer')
                        : 'bg-gray-50 border border-gray-200 opacity-60 pointer-events-none') 
                    : (isSelected ? 'bg-accent-primary/5 border-2 border-accent-primary shadow-sm' : 'bg-bg border border-border hover:border-accent-primary/50 cursor-pointer')
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-text-main font-bold text-sm truncate">{s.subject_name}</span>
                  <div className="flex items-center gap-1 pointer-events-auto shrink-0">
                    {!isExamOver && exam?.status === 'draft' && editSubjectId !== s.id && role !== 'teacher' && (
                      <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); setInlineEditSubjectCount(needed); setEditSubjectId(s.id); }} className="text-text-muted hover:text-accent-primary transition-colors p-1 rounded-md hover:bg-surface-hover">
                        <Edit2 size={12} />
                      </button>
                    )}
                    {!isExamOver && exam?.status === 'draft' && role !== 'teacher' && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteSubject(e, s.id, s.subject_name); }} className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                
                {editSubjectId === s.id && (
                  <div className="flex items-center gap-1 pointer-events-auto" onClick={e => { e.stopPropagation(); e.preventDefault(); }}>
                    <input type="number" value={inlineEditSubjectCount} onChange={(e) => setInlineEditSubjectCount(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 px-2 py-1 text-xs border border-[#008080] rounded outline-none font-bold text-text-main" min="1" />
                    <button onClick={() => handleSaveSubjectCount(s.id)} className="text-white bg-accent-primary hover:bg-accent-primary/80 p-1 rounded transition-colors"><Check size={14}/></button>
                  </div>
                )}

                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${complete ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {added}/{needed} Qs
                  </span>
                  {role === 'teacher' && isAssignedTeacher && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-accent-primary/10 text-accent-primary px-1.5 py-0.5 rounded">
                      Assigned
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {subjects.length === 0 && (
            <div className="text-center py-6 text-text-muted text-sm font-medium">No subjects added.</div>
          )}
        </div>
      </div>

      {/* Right Side: Questions Area (Sticky with internal scroll) */}
      <div className="flex-1 bg-surface border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[650px] md:sticky md:top-0 md:h-[calc(100vh-112px)]">
        {drawerSubjectId ? (
          <>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface shrink-0 sticky top-0 z-10">
              <div className="min-w-0">
                <p className="text-text-main text-lg font-bold truncate">{subjects.find(s => s.id === drawerSubjectId)?.subject_name}</p>
                <p className="text-text-muted text-sm font-semibold">
                  {`${drawerQuestions.length} / ${subjects.find(s => s.id === drawerSubjectId)?.question_count ?? 0} questions`}
                </p>
              </div>
              {exam?.status === 'draft' && drawerQuestions.length < (subjects.find(s => s.id === drawerSubjectId)?.question_count ?? 0) && (
                <button onClick={handleDrawerNewQuestion} className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent-primary text-white font-semibold rounded-xl text-sm hover:bg-accent-primary/80 transition-all shadow-sm active:scale-95 shrink-0">
                  <Plus size={16} /> Add Question
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="space-y-4">
                {drawerLoading ? (
                  <div className="flex justify-center p-8"><span className="w-6 h-6 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" /></div>
                ) : drawerQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen size={32} className="mx-auto mb-3 text-border" />
                    <p className="text-text-muted font-medium">No questions added yet.</p>
                  </div>
                ) : (
                  drawerQuestions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-bg border border-border rounded-xl group relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-surface border border-border flex items-center justify-center text-xs text-text-main font-bold">{idx + 1}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${q.question_type === 'mcq' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                            {q.question_type}
                          </span>
                          <span className="text-[10px] font-bold text-text-muted">+{q.positive_marks} / {q.negative_marks}</span>
                        </div>
                        {exam?.status === 'draft' && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleDrawerEditQuestion(q)} className="text-accent-primary hover:bg-accent-primary/10 p-1.5 rounded-lg transition-colors"><Edit2 size={14} /></button>
                            <button onClick={() => handleDrawerDeleteQuestion(q.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>
                      <p className="text-text-main text-xs font-semibold whitespace-pre-wrap mb-2">{q.question_text}</p>
                      {q.image_url && <img src={q.image_url} alt="Question" className="max-w-full max-h-[150px] object-contain rounded-lg border border-border mb-3" />}
                      {q.question_type === 'mcq' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <div key={opt} className={`p-2.5 rounded-lg text-xs border transition-colors flex items-start ${q.correct_option === opt ? 'bg-accent-primary/5 border-accent-primary text-accent-primary font-bold' : 'bg-surface text-text-muted border-border font-medium'}`}>
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
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-6">
            <BookOpen size={48} className="mb-4 text-border" />
            <p className="text-lg font-bold text-text-main mb-2">Manage Questions</p>
            <p className="text-sm text-center max-w-sm">
              Select a subject from the list on the left to add, edit, or remove questions.
            </p>
          </div>
        )}
      </div>

      {drawerSubjectId && (
        <>
          <div 
            className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000] transition-opacity duration-300 ${drawerView === 'editor' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
            onClick={() => setDrawerView('list')} 
          />
          <div className={`fixed top-0 right-0 h-[100dvh] w-full max-w-[550px] bg-bg z-[1001] transition-transform duration-500 shadow-2xl flex flex-col border-l border-border ${drawerView === 'editor' ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-4 border-b border-border flex justify-between items-center bg-surface shrink-0">
              <div className="flex items-center gap-3">
                <BookOpen size={20} className="text-accent-primary" />
                <h3 className="text-lg font-semibold m-0 text-text-main">
                  {editingQuestionId ? 'Edit Question' : 'Add New Question'}
                </h3>
              </div>
              <button 
                className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-muted transition-all hover:bg-border hover:text-text-main hover:rotate-90 border-none cursor-pointer" 
                onClick={() => setDrawerView('list')}
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={(e) => doSaveQuestion(e, false)} className="space-y-5">
                <div className="flex bg-bg rounded-xl p-1 border border-border">
                  <button type="button" onClick={() => setQType('mcq')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${qType === 'mcq' ? 'bg-surface text-accent-primary shadow-sm' : 'text-text-muted'}`}>MCQ</button>
                  <button type="button" onClick={() => setQType('nat')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${qType === 'nat' ? 'bg-surface text-accent-primary shadow-sm' : 'text-text-muted'}`}>NAT</button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-main mb-1 uppercase tracking-wider">Question Text</label>
                    <textarea value={qText} onChange={(e) => setQText(e.target.value)} rows={3} className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text-main focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 outline-none resize-none text-sm font-medium" placeholder="Enter question..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-main mb-1 uppercase tracking-wider">Image (Optional)</label>
                    <div className="flex items-center gap-3">
                      <input type="file" accept="image/*" onChange={(e) => handleDrawerImageUpload(e, 'question')} className="hidden" id="q-img" />
                      <label htmlFor="q-img" className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg border border-border text-accent-primary font-semibold text-xs rounded-lg hover:bg-surface-hover">
                        Upload Image
                      </label>
                      {qImage && (
                        <div className="relative group">
                          <img src={qImage} alt="Preview" className="h-10 rounded border border-border object-contain" />
                          <button type="button" onClick={() => setQImage(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100">✕</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {qType === 'mcq' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: 'Option A', val: optA, setVal: setOptA, img: optAImg, setImg: setOptAImg, id: 'A' }, 
                        { label: 'Option B', val: optB, setVal: setOptB, img: optBImg, setImg: setOptBImg, id: 'B' }, 
                        { label: 'Option C', val: optC, setVal: setOptC, img: optCImg, setImg: setOptCImg, id: 'C' }, 
                        { label: 'Option D', val: optD, setVal: setOptD, img: optDImg, setImg: setOptDImg, id: 'D' }
                      ].map((opt) => (
                        <div key={opt.label} className="bg-bg p-3 rounded-xl border border-border">
                          <label className="block text-xs font-semibold text-text-muted mb-1">{opt.label}</label>
                          <input type="text" value={opt.val} onChange={(e) => opt.setVal(e.target.value)} className="w-full px-3 py-1.5 bg-surface border border-border rounded-lg text-sm mb-2 outline-none focus:border-accent-primary" />
                          <div className="flex items-center gap-2">
                            <input type="file" accept="image/*" onChange={(e) => handleDrawerImageUpload(e, opt.id as any)} className="hidden" id={`img-${opt.id}`} />
                            <label htmlFor={`img-${opt.id}`} className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 bg-surface border border-border text-accent-primary font-semibold text-[10px] rounded hover:bg-surface-hover">
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
                    <div>
                      <label className="block text-xs font-semibold text-text-main mb-1 uppercase tracking-wider">Correct Answer</label>
                      <div className="flex gap-2">
                        {['A', 'B', 'C', 'D'].map((opt) => (
                          <button key={opt} type="button" onClick={() => setCorrectAnswer(opt)}
                            className={`w-10 h-10 rounded-xl text-sm font-bold border-2 transition-all ${correctAnswer === opt ? 'bg-accent-primary border-accent-primary text-white' : 'bg-bg border-border text-text-muted hover:border-accent-primary'}`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-text-main mb-1 uppercase tracking-wider">Correct Numerical Answer</label>
                    <input type="text" value={natAnswer} onChange={(e) => setNatAnswer(e.target.value)} required className="w-full px-3 py-2 bg-bg border border-border rounded-xl outline-none focus:border-accent-primary text-sm font-medium" />
                  </div>
                )}

                {drawerError && <div className="bg-red-50 text-red-600 p-2 rounded-lg text-xs font-semibold">{drawerError}</div>}
                
                <div className="flex gap-2 pt-2 border-t border-border mt-4">
                  <button type="button" onClick={() => setDrawerView('list')} className="flex-1 py-2 bg-surface border border-border text-text-muted font-semibold rounded-xl text-sm hover:bg-surface-hover">
                    Cancel
                  </button>
                  <button type="submit" disabled={drawerFormLoading} className="flex-1 py-2 bg-accent-primary text-white font-semibold rounded-xl text-sm hover:bg-accent-primary/80 disabled:opacity-50">
                    {drawerFormLoading ? 'Saving...' : 'Save Question'}
                  </button>
                  {!editingQuestionId && drawerQuestions.length < (subjects.find(s => s.id === drawerSubjectId)?.question_count ?? 0) - 1 && (
                    <button type="button" onClick={(e) => doSaveQuestion(e, true)} disabled={drawerFormLoading} className="flex-1 py-2 bg-accent-primary/10 text-accent-primary font-semibold rounded-xl text-sm hover:bg-accent-primary/20 disabled:opacity-50">
                      Save & Add Next
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
