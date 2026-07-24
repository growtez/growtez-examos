'use client';

import React from 'react';
import { Users, Download, Plus, Trash2, RotateCcw, Search, X } from 'lucide-react';

interface Step2StudentsProps {
  role: string;
  isExamOver: boolean;
  exam: any;
  assignedStudents: any[];
  setAssignedStudents: React.Dispatch<React.SetStateAction<any[]>>;
  assignedSearchQuery: string;
  setAssignedSearchQuery: (val: string) => void;
  assignedCourseFilter: string;
  setAssignedCourseFilter: (val: string) => void;
  assignedBatchFilter: string;
  setAssignedBatchFilter: (val: string) => void;
  addSuccess: string;
  downloadResultsPDF: () => void;
  generatingPDF: boolean;
  setConfirmDialog: React.Dispatch<React.SetStateAction<any>>;
  handleRemoveStudent: (asId: string, studentId: string) => void;
  supabase: any;
  paramsId: string;
  isReadOnly?: boolean;
  onAddStudentsClick: () => void;
}

export default function Step2Students({
  role,
  isExamOver,
  exam,
  assignedStudents,
  setAssignedStudents,
  assignedSearchQuery,
  setAssignedSearchQuery,
  assignedCourseFilter,
  setAssignedCourseFilter,
  assignedBatchFilter,
  setAssignedBatchFilter,
  addSuccess,
  downloadResultsPDF,
  generatingPDF,
  setConfirmDialog,
  handleRemoveStudent,
  supabase,
  paramsId,
  isReadOnly = false,
  onAddStudentsClick
}: Step2StudentsProps) {
  const [selectedStudents, setSelectedStudents] = React.useState<string[]>([]);

  // Derived state calculations
  const uniqueAssignedBatches = Array.from(new Set(assignedStudents.map((s: any) => s.students?.batch).filter(Boolean)));
  const uniqueAssignedCourses = Array.from(new Set(assignedStudents.map((s: any) => s.students?.course).filter(Boolean)));

  const filteredAssignedStudents = assignedStudents.filter((as: any) => {
    const matchesSearch = as.students?.full_name?.toLowerCase().includes(assignedSearchQuery.toLowerCase()) ||
      as.students?.roll_number?.toLowerCase().includes(assignedSearchQuery.toLowerCase());
    const matchesBatch = assignedBatchFilter ? as.students?.batch === assignedBatchFilter : true;
    const matchesCourse = assignedCourseFilter ? as.students?.course === assignedCourseFilter : true;
    return matchesSearch && matchesBatch && matchesCourse;
  });

  const getStatusBadge = (as: any) => {
    if (isExamOver) {
      if (as.status === 'assigned') return { colorClass: 'bg-red-500/10 text-red-500 border-red-500/20', text: 'Absent' };
      return { colorClass: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20', text: 'Completed' };
    }
    if (as.status === 'submitted') return { colorClass: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20', text: 'Submitted' };
    if (as.status === 'in_progress') return { colorClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20', text: 'In Progress' };
    return { colorClass: 'bg-surface-hover text-text-muted border-border', text: '' }; // assigned gets no text as requested previously
  };

  const handleResetClick = (as: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Exam Attempt',
      message: "Are you sure you want to reset this student's exam? This will completely delete their current progress and results so they can retake it.",
      confirmText: 'Reset Exam',
      confirmColor: 'bg-amber-600 hover:bg-amber-700 border-amber-800 text-white',
      onConfirm: async () => {
        setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
        setAssignedStudents(prev => prev.map(s => s.student_id === as.student_id ? { ...s, status: 'assigned', result: null } : s));
        const { error } = await supabase.rpc('reset_student_exam', { p_exam_id: paramsId, p_student_id: as.student_id });
        if (error) {
          alert('Failed to reset: ' + error.message);
          setAssignedStudents(prev => prev.map(s => s.student_id === as.student_id ? { ...s, status: as.status, result: as.result } : s));
        }
      }
    });
  };

  return (
    <div className="mb-6 animate-in fade-in duration-300">
      <div className={isReadOnly ? 'pointer-events-none select-none opacity-75' : ''}>
        {isReadOnly && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-600">
            This exam is published — student assignments are read-only.
          </div>
        )}

        {addSuccess && <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-4 rounded-xl text-sm font-medium mb-6">{addSuccess}</div>}

        {/* Toolbar: heading + search + filters + create */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {/* Title */}
          <div className="flex flex-col shrink-0 justify-center mr-1">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider inline-flex items-center gap-1.5">
              Students
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent-primary/10 text-accent-primary text-[10px] font-bold normal-case tracking-normal">
                {assignedStudents.length}
              </span>
            </span>
            <span className="text-[10px] text-text-muted font-medium mt-0.5">Students are specific to this exam</span>
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Search */}
          <div className="relative flex-1 min-w-[140px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={12} />
            <input
              type="text"
              placeholder="Search students..."
              value={assignedSearchQuery}
              onChange={(e) => setAssignedSearchQuery(e.target.value)}
              className="w-full h-8 pl-7 pr-6 bg-surface border border-border rounded-lg text-text-main text-[12px] focus:outline-none focus:border-accent-primary transition-all"
            />
            {assignedSearchQuery && (
              <button type="button" onClick={() => setAssignedSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-red-500 bg-transparent border-none cursor-pointer flex items-center p-0.5">
                <X size={10} />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={assignedCourseFilter}
              onChange={(e) => setAssignedCourseFilter(e.target.value)}
              className={`inline-flex items-center gap-1.5 px-2 h-8 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover text-[12px] font-medium transition-all cursor-pointer focus:outline-none focus:border-accent-primary ${uniqueAssignedCourses.length === 0 ? 'appearance-none bg-none cursor-default opacity-50' : ''}`}
            >
              <option value="">All Courses</option>
              {uniqueAssignedCourses.map((course: any) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={assignedBatchFilter}
              onChange={(e) => setAssignedBatchFilter(e.target.value)}
              className={`inline-flex items-center gap-1.5 px-2 h-8 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover text-[12px] font-medium transition-all cursor-pointer focus:outline-none focus:border-accent-primary ${uniqueAssignedBatches.length === 0 ? 'appearance-none bg-none cursor-default opacity-50' : ''}`}
            >
              <option value="">All Batches</option>
              {uniqueAssignedBatches.map((batch: any) => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          </div>

          {/* Active filter chips */}
          {(assignedSearchQuery || assignedCourseFilter !== '' || assignedBatchFilter !== '') && (
            <button
              onClick={() => { setAssignedSearchQuery(''); setAssignedCourseFilter(''); setAssignedBatchFilter(''); }}
              className="inline-flex items-center gap-1 px-2 h-8 rounded-lg text-[11px] text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent border-none"
            >
              <X size={10} /> Clear
            </button>
          )}

          {/* Bulk Delete */}
          {!isExamOver && role !== 'teacher' && !isReadOnly && selectedStudents.length > 0 && (
            <button
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: 'Remove Students',
                  message: `Are you sure you want to remove ${selectedStudents.length} students?`,
                  confirmText: 'Remove',
                  confirmColor: 'bg-red-600 hover:bg-red-700 border-red-800 text-white',
                  onConfirm: async () => {
                    setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
                    setAssignedStudents(prev => prev.filter(as => !selectedStudents.includes(as.student_id)));
                    await supabase.from('students').delete().in('id', selectedStudents);
                    setSelectedStudents([]);
                  }
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-red-500 text-white text-[12px] font-medium transition-all cursor-pointer shadow-sm hover:bg-red-600 animate-in fade-in ml-1"
            >
              <Trash2 size={12} /> Remove ({selectedStudents.length})
            </button>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            {isExamOver && (
              <button
                onClick={downloadResultsPDF}
                disabled={generatingPDF}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover text-[12px] font-medium transition-all cursor-pointer disabled:opacity-50"
              >
                {generatingPDF ? <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Download size={12} />}
                {generatingPDF ? 'Generating...' : 'Download PDF'}
              </button>
            )}

            {!isExamOver && role !== "teacher" && !isReadOnly && (
              <button
                onClick={onAddStudentsClick}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-accent-primary text-white text-[12px] font-bold hover:bg-accent-primary/80 transition-all shrink-0 cursor-pointer"
              >
                <Plus size={12} />
                Add Students
              </button>
            )}
          </div>
        </div>

        {assignedStudents.length === 0 ? (
          <div className="text-center py-10 sm:py-12 border-2 border-dashed border-border rounded-2xl bg-bg/50 px-4">
            <Users size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-main text-sm sm:text-base font-bold">No students added yet.</p>
            <p className="text-text-muted text-xs sm:text-sm font-medium mt-1">Students are specific to this exam. Add them using the buttons above.</p>
          </div>
        ) : filteredAssignedStudents.length === 0 ? (
          <div className="text-center py-10 sm:py-12 border-2 border-dashed border-border rounded-2xl bg-bg/50 px-4">
            <p className="text-text-muted text-xs sm:text-sm font-medium mt-1">No students found matching your search.</p>
          </div>
        ) : (
          <>
            {/* Mobile: Select All */}
            {!isExamOver && role !== 'teacher' && !isReadOnly && filteredAssignedStudents.length > 0 && (
              <div className="sm:hidden mb-3 flex items-center justify-between bg-surface border border-border p-3 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                    checked={filteredAssignedStudents.length > 0 && selectedStudents.length === filteredAssignedStudents.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedStudents(filteredAssignedStudents.map((as: any) => as.student_id));
                      else setSelectedStudents([]);
                    }}
                  />
                  <span className="text-[12px] font-bold text-text-main">Select All</span>
                </label>
              </div>
            )}

            {/* Mobile: cards */}
            <div className="sm:hidden space-y-3 mb-6">
              {filteredAssignedStudents.map((as: any) => {
                const badge = getStatusBadge(as);
                return (
                  <div key={as.id} className={`bg-surface rounded-xl border p-4 shadow-sm relative ${selectedStudents.includes(as.student_id) ? 'border-accent-primary ring-1 ring-accent-primary/20' : 'border-border hover:border-accent-primary/30'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {!isExamOver && role !== 'teacher' && !isReadOnly && (
                          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                              checked={selectedStudents.includes(as.student_id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedStudents(prev => 
                                  prev.includes(as.student_id) ? prev.filter(id => id !== as.student_id) : [...prev, as.student_id]
                                );
                              }}
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex items-baseline gap-1.5">
                          <h4 className="text-text-main text-xs font-bold truncate max-w-[140px]" title={as.students?.full_name}>
                            {as.students?.full_name}
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-text-muted bg-surface border border-border px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
                          Roll {as.students?.roll_number}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {isExamOver ? (
                        <div className="flex items-center gap-1.5 bg-surface border border-border rounded-md px-2 py-1">
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Score</span>
                          <span className="text-[11px] font-bold text-text-main">
                            {as.result ? <span className="text-accent-primary">{as.result.total_marks}</span> : <span className="text-gray-400">Absent</span>}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-md px-2 py-1">
                            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">DOB</span>
                            <span className="text-[11px] font-bold text-text-main">{as.students?.date_of_birth || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-md px-2 py-1">
                            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Course</span>
                            <span className="text-[11px] font-bold text-text-main">{as.students?.course || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-surface border border-border rounded-md px-2 py-1">
                            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Batch</span>
                            <span className="text-[11px] font-bold text-text-main">{as.students?.batch || '—'}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        {badge.text && (
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border whitespace-nowrap ${badge.colorClass}`}>
                            {badge.text}
                          </span>
                        )}
                      </div>
                      {!isExamOver && role !== 'teacher' && !isReadOnly && (
                        <div className="flex items-center gap-2">
                          {(as.status === 'in_progress' || as.status === 'submitted') && (
                            <button
                              onClick={() => handleResetClick(as)}
                              className="inline-flex items-center gap-1 text-amber-600 bg-amber-500/10 hover:bg-amber-500 hover:text-white px-2 py-1 rounded-md text-[11px] font-bold transition-all border border-amber-500/20"
                            >
                              <RotateCcw size={12} /> Reset
                            </button>
                          )}
                          {as.status === 'assigned' && (
                            <button
                              onClick={() => handleRemoveStudent(as.id, as.student_id)}
                              className="inline-flex items-center gap-1 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white px-2 py-1 rounded-md text-[11px] font-bold transition-all border border-red-500/20"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-hover/50">
                      {!isExamOver && role !== 'teacher' && !isReadOnly && (
                        <th className="py-2 px-3 w-[40px] text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                            checked={filteredAssignedStudents.length > 0 && selectedStudents.length === filteredAssignedStudents.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedStudents(filteredAssignedStudents.map((as: any) => as.student_id));
                              else setSelectedStudents([]);
                            }}
                          />
                        </th>
                      )}
                      <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide">Student</th>
                      <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide">Roll no</th>
                      <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide">DOB</th>
                      {isExamOver ? (
                        <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide">Score</th>
                      ) : (
                        <>
                          <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide">Course</th>
                          <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide">Batch</th>
                        </>
                      )}
                      <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide">Status</th>
                      {!isExamOver && role !== 'teacher' && (
                        <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignedStudents.map((as: any) => {
                      const badge = getStatusBadge(as);
                      return (
                        <tr
                          key={as.id}
                          className={`group border-b border-border/40 last:border-b-0 transition-colors cursor-pointer ${selectedStudents.includes(as.student_id) ? 'bg-accent-primary/5' : 'even:bg-bg hover:bg-surface-hover'}`}
                          onClick={() => {
                            if (!isExamOver && role !== 'teacher' && !isReadOnly) {
                              setSelectedStudents(prev => 
                                prev.includes(as.student_id) ? prev.filter(id => id !== as.student_id) : [...prev, as.student_id]
                              );
                            }
                          }}
                        >
                          {!isExamOver && role !== 'teacher' && !isReadOnly && (
                            <td className="py-2 px-3 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                                checked={selectedStudents.includes(as.student_id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setSelectedStudents(prev => 
                                    prev.includes(as.student_id) ? prev.filter(id => id !== as.student_id) : [...prev, as.student_id]
                                  );
                                }}
                              />
                            </td>
                          )}
                          <td className="py-2 px-3 align-middle">
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-text-main text-[12px] truncate group-hover:text-accent-primary transition-colors max-w-[240px]" title={as.students?.full_name}>
                                {as.students?.full_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 align-middle">
                            <span className="font-mono text-text-muted bg-bg border border-border px-1.5 py-0.5 rounded text-[11px] font-bold whitespace-nowrap">
                              {as.students?.roll_number}
                            </span>
                          </td>
                          <td className="py-2 px-3 align-middle">
                            <span className="font-mono text-text-muted bg-bg border border-border px-1.5 py-0.5 rounded text-[11px] font-bold whitespace-nowrap">
                              {as.students?.date_of_birth || '—'}
                            </span>
                          </td>
                          {isExamOver ? (
                            <td className="py-2 px-3 align-middle font-bold text-[12px]">
                              {as.result ? (
                                <span className="text-accent-primary">{as.result.total_marks}</span>
                              ) : (
                                <span className="text-gray-400 font-medium">{as.status === 'assigned' ? 'Absent' : 'N/A'}</span>
                              )}
                            </td>
                          ) : (
                            <>
                              <td className="py-2 px-3 align-middle text-[12px] text-text-muted font-semibold">{as.students?.course || '—'}</td>
                              <td className="py-2 px-3 align-middle text-[12px] text-text-muted font-semibold">{as.students?.batch || '—'}</td>
                            </>
                          )}
                          <td className="py-2 px-3 align-middle">
                            {badge.text ? (
                              <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${badge.colorClass}`}>
                                {badge.text}
                              </span>
                            ) : (
                              <span className="text-text-muted text-[12px]">—</span>
                            )}
                          </td>
                          {!isExamOver && role !== 'teacher' && !isReadOnly && (
                            <td className="py-2 px-3 align-middle text-right">
                              <div className="flex items-center justify-end gap-1">
                                {(as.status === 'in_progress' || as.status === 'submitted') && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleResetClick(as); }}
                                    aria-label="Reset exam attempt"
                                    title="Reset exam attempt"
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all border border-amber-500/20 cursor-pointer"
                                  >
                                    <RotateCcw size={12} />
                                  </button>
                                )}
                                {as.status === 'assigned' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveStudent(as.id, as.student_id); }}
                                    aria-label="Remove student"
                                    title="Remove student"
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 cursor-pointer"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}