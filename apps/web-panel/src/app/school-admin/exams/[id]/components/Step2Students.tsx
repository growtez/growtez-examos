'use client';

import React from 'react';
import { Users, Download, Plus, Trash2, RotateCcw, Search, X } from 'lucide-react';
import { formatDOB } from '@/lib/utils';

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

  const handleDownloadStudentsCsv = () => {
    const csvRows = [
      "name,roll_number,dob,course,batch,session",
      ...assignedStudents.map((r: any) => {
        const s = r.students;
        if (!s) return null;
        const escapeCSV = (val: any) => {
          if (!val) return '';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };
        return `${escapeCSV(s.full_name)},${escapeCSV(s.roll_number)},${escapeCSV(s.date_of_birth)},${escapeCSV(s.course)},${escapeCSV(s.batch)},${escapeCSV(s.session)}`;
      }).filter(Boolean)
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${(exam?.title || 'exam').replace(/\s+/g, '_')}_students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mb-6 animate-in fade-in duration-300">
      <div className={isReadOnly ? 'opacity-90' : ''}>
        {isReadOnly && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-600">
            This exam is published — student assignments are read-only.
          </div>
        )}

        {addSuccess && <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-4 rounded-xl text-sm font-medium mb-6">{addSuccess}</div>}

        {/* Toolbar: heading + search + filters + create */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 mb-3.5 bg-surface p-2.5 rounded-xl border border-border shadow-sm">
          {/* Title & Mobile Add Button Header */}
          <div className="flex items-center justify-between gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-text-main flex items-center gap-1.5 whitespace-nowrap">
                Students
                <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-accent-primary/10 text-accent-primary text-[11px] font-bold">
                  {assignedStudents.length}
                </span>
              </span>
              <span className="hidden lg:inline-block text-[11px] text-text-muted font-normal border-l border-border pl-2 whitespace-nowrap">
                Specific to this exam
              </span>
            </div>

            {/* Mobile Add Students Button (Top Right on Mobile) */}
            {!isExamOver && role !== 'teacher' && !isReadOnly && (
              <button
                type="button"
                onClick={onAddStudentsClick}
                className="md:hidden inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-primary text-white text-xs font-bold shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <Plus size={13} /> Add Students
              </button>
            )}
          </div>

          {/* Search, Filters & Actions Container */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[150px] md:w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={14} />
              <input
                type="text"
                placeholder={`Search Students (${filteredAssignedStudents.length})...`}
                value={assignedSearchQuery}
                onChange={(e) => setAssignedSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-7 bg-bg border border-border rounded-lg text-text-main text-xs focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/20 transition-all shadow-sm"
              />
              {assignedSearchQuery && (
                <button
                  type="button"
                  onClick={() => setAssignedSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-red-500 bg-transparent border-none cursor-pointer flex items-center p-1"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Courses Filter */}
            <select
              value={assignedCourseFilter}
              onChange={(e) => setAssignedCourseFilter(e.target.value)}
              className={`h-8 px-2 rounded-lg border border-border bg-bg text-text-main text-xs font-medium focus:outline-none focus:border-accent-primary transition-all cursor-pointer ${uniqueAssignedCourses.length === 0 ? 'opacity-50' : ''}`}
            >
              <option value="">All Courses</option>
              {uniqueAssignedCourses.map((course: any) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>

            {/* Batches Filter */}
            <select
              value={assignedBatchFilter}
              onChange={(e) => setAssignedBatchFilter(e.target.value)}
              className={`h-8 px-2 rounded-lg border border-border bg-bg text-text-main text-xs font-medium focus:outline-none focus:border-accent-primary transition-all cursor-pointer ${uniqueAssignedBatches.length === 0 ? 'opacity-50' : ''}`}
            >
              <option value="">All Batches</option>
              {uniqueAssignedBatches.map((batch: any) => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>

            {/* Active filter clear button */}
            {(assignedSearchQuery || assignedCourseFilter !== '' || assignedBatchFilter !== '') && (
              <button
                onClick={() => { setAssignedSearchQuery(''); setAssignedCourseFilter(''); setAssignedBatchFilter(''); }}
                className="inline-flex items-center gap-1 px-2 h-8 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer bg-transparent border-none"
              >
                <X size={12} /> Clear
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
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-red-500 text-white text-xs font-medium transition-all cursor-pointer shadow-sm hover:bg-red-600 animate-in fade-in"
              >
                <Trash2 size={12} /> Remove ({selectedStudents.length})
              </button>
            )}

            {/* PDF Button */}
            {isExamOver && (
              <button
                onClick={downloadResultsPDF}
                disabled={generatingPDF}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border bg-bg text-text-main hover:bg-surface-hover text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
              >
                {generatingPDF ? <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Download size={12} />}
                {generatingPDF ? 'Generating...' : 'Download PDF'}
              </button>
            )}

            {/* CSV Download Button */}
            {assignedStudents.length > 0 && (
              <button
                onClick={handleDownloadStudentsCsv}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border bg-bg text-text-main hover:bg-surface-hover text-xs font-medium transition-all cursor-pointer"
              >
                <Download size={12} />
                Download CSV
              </button>
            )}

            {/* Desktop Add Students Button */}
            {!isExamOver && role !== "teacher" && !isReadOnly && (
              <button
                onClick={onAddStudentsClick}
                className="hidden md:inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-accent-primary text-white text-xs font-bold hover:bg-accent-primary/90 transition-all shrink-0 cursor-pointer shadow-sm ml-auto"
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
              <div className="sm:hidden mb-2.5 flex items-center justify-between px-1">
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
                        <div className="min-w-0 flex flex-col">
                          <h4 className="text-text-main text-xs font-bold break-words" title={as.students?.full_name}>
                            {as.students?.full_name}
                          </h4>
                          <span className="text-[11px] text-text-muted font-semibold">
                            Roll: {as.students?.roll_number}
                          </span>
                        </div>
                      </div>

                      {!isExamOver && role !== 'teacher' && !isReadOnly && (
                        <div className="flex items-center gap-1.5 shrink-0">
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
                              aria-label="Remove student"
                              title="Remove student"
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      {isExamOver ? (
                        <div className="text-[11px] text-text-muted font-medium">
                          Score: {as.result ? <span className="text-accent-primary font-bold">{as.result.total_marks}</span> : <span className="text-gray-400 font-semibold">Absent</span>}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-text-muted font-medium">
                          <span>DOB: <span className="text-text-main font-semibold">{formatDOB(as.students?.date_of_birth)}</span></span>
                          <span className="text-text-muted/40">•</span>
                          <span>Course: <span className="text-text-main font-semibold">{as.students?.course || '—'}</span></span>
                          <span className="text-text-muted/40">•</span>
                          <span>Batch: <span className="text-text-main font-semibold">{as.students?.batch || '—'}</span></span>
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
                      {!isExamOver && role !== 'teacher' && (
                        <th className="py-2 px-3 text-[11px] font-bold text-text-muted uppercase tracking-wide text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignedStudents.map((as: any) => {
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
                          <td className="py-2 px-3 align-middle whitespace-normal">
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-text-main text-[12px] break-words group-hover:text-accent-primary transition-colors" title={as.students?.full_name}>
                                {as.students?.full_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-3 align-middle text-[12px] text-text-muted font-semibold">
                            {as.students?.roll_number}
                          </td>
                          <td className="py-2 px-3 align-middle text-[12px] text-text-muted font-semibold">
                            {formatDOB(as.students?.date_of_birth)}
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