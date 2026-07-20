'use client';

import React from 'react';
import { Users, Download, Plus } from 'lucide-react';

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

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 mb-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-text-main">Students ({assignedStudents.length})</h3>
          <p className="text-text-muted text-sm font-medium mt-1">Students are specific to this exam</p>
        </div>
        {!isExamOver && role !== "teacher" && !isReadOnly && (
          <button
            onClick={onAddStudentsClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all active:scale-95 shadow-sm whitespace-nowrap"
          >
            <Plus size={14} />
            Add Students
          </button>
        )}
      </div>

      {isReadOnly && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-600">
          This exam is published — student assignments are read-only.
        </div>
      )}

      <div className={isReadOnly ? 'pointer-events-none select-none opacity-75' : ''}>

        {addSuccess && <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-4 rounded-xl text-sm font-medium mb-6">{addSuccess}</div>}

        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search assigned students..."
            value={assignedSearchQuery}
            onChange={(e) => setAssignedSearchQuery(e.target.value)}
            className="w-full sm:w-80 px-4 py-2 bg-bg border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-sm font-medium"
          />

          <select
            value={assignedCourseFilter}
            onChange={(e) => setAssignedCourseFilter(e.target.value)}
            className={`px-4 py-2 bg-bg border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-sm font-medium w-full sm:w-40 ${uniqueAssignedCourses.length === 0 ? 'appearance-none bg-none cursor-default' : ''}`}
          >
            <option value="">All Courses</option>
            {uniqueAssignedCourses.map((course: any) => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>

          <select
            value={assignedBatchFilter}
            onChange={(e) => setAssignedBatchFilter(e.target.value)}
            className={`px-4 py-2 bg-bg border border-border rounded-xl text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-sm font-medium w-full sm:w-40 ${uniqueAssignedBatches.length === 0 ? 'appearance-none bg-none cursor-default' : ''}`}
          >
            <option value="">All Batches</option>
            {uniqueAssignedBatches.map((batch: any) => (
              <option key={batch} value={batch}>{batch}</option>
            ))}
          </select>

          {isExamOver && (
            <button
              onClick={downloadResultsPDF}
              disabled={generatingPDF}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-surface text-text-main text-sm font-semibold border border-border rounded-xl hover:border-accent-primary hover:text-accent-primary hover:bg-bg transition-all shadow-sm w-full sm:w-auto disabled:opacity-50 whitespace-nowrap"
            >
              {generatingPDF ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Download size={16} />}
              {generatingPDF ? 'Generating...' : 'Download PDF'}
            </button>
          )}
        </div>

        {assignedStudents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-bg/50">
            <Users size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-main text-base font-bold">No students added yet.</p>
            <p className="text-text-muted text-sm font-medium mt-1">Students are specific to this exam. Add them using the buttons above.</p>
          </div>
        ) : filteredAssignedStudents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-bg/50">
            <p className="text-text-muted text-sm font-medium mt-1">No students found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              <table className="w-full min-w-[640px]">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-bg border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Roll No.</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                    {isExamOver && <th className="text-left px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Score</th>}
                    {!isExamOver && <th className="text-right px-4 py-3 text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignedStudents.map((as: any) => (
                    <tr key={as.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-accent-primary bg-bg border border-border px-2 py-1 rounded-md text-xs font-bold">{as.students?.roll_number}</span>
                      </td>
                      <td className="px-4 py-3 text-text-main text-sm font-semibold">{as.students?.full_name}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          let colorClass = '';
                          let text = '';
                          if (isExamOver) {
                            if (as.status === 'assigned') {
                              colorClass = 'bg-red-50 text-red-600 border-red-200';
                              text = 'Absent';
                            } else {
                              colorClass = 'bg-accent-primary/10 text-accent-primary border-accent-primary/20';
                              text = '✓ Completed';
                            }
                          } else {
                            if (as.status === 'submitted') {
                              colorClass = 'bg-accent-primary/10 text-accent-primary border-accent-primary/20';
                              text = '✓ Submitted';
                            } else if (as.status === 'in_progress') {
                              colorClass = 'bg-amber-100 text-amber-700 border-amber-200';
                              text = '▶ In Progress';
                            } else {
                              colorClass = 'bg-gray-100 text-gray-600 border-gray-200';
                              text = 'Assigned';
                            }
                          }
                          return (
                            <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border ${colorClass}`}>
                              {text}
                            </span>
                          );
                        })()}
                      </td>
                      {isExamOver && (
                        <td className="px-4 py-3 text-text-main text-sm font-bold">
                          {as.result ? (
                            <span className="text-accent-primary">{as.result.total_marks}</span>
                          ) : (
                            <span className="text-gray-400 font-medium">{as.status === 'assigned' ? 'Absent' : 'N/A'}</span>
                          )}
                        </td>
                      )}
                      {!isExamOver && (
                        <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                          {(as.status === 'in_progress' || as.status === 'submitted') && role !== 'teacher' && (
                            <button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Reset Exam Attempt',
                                  message: "Are you sure you want to reset this student's exam? This will completely delete their current progress and results so they can retake it.",
                                  confirmText: 'Reset Exam',
                                  confirmColor: 'bg-amber-600 hover:bg-amber-700 text-white',
                                  onConfirm: async () => {
                                    setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
                                    setAssignedStudents(prev => prev.map(s =>
                                      s.student_id === as.student_id
                                        ? { ...s, status: 'assigned', result: null }
                                        : s
                                    ));
                                    const { error } = await supabase.rpc('reset_student_exam', { p_exam_id: paramsId, p_student_id: as.student_id });
                                    if (error) {
                                      alert('Failed to reset: ' + error.message);
                                      setAssignedStudents(prev => prev.map(s =>
                                        s.student_id === as.student_id
                                          ? { ...s, status: as.status, result: as.result }
                                          : s
                                      ));
                                    }
                                  }
                                });
                              }}
                              className="text-amber-600 hover:text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                            >
                              Reset
                            </button>
                          )}
                          {as.status === 'assigned' && role !== 'teacher' && (
                            <button
                              onClick={() => handleRemoveStudent(as.id, as.student_id)}
                              className="text-red-500 hover:text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}