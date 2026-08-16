'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSchoolBaseUrl } from '@/lib/utils';
import { calculateSubjectBreakdown } from '@/lib/downloadAnswerKey';
import { FileBarChart2, Download, FileText, Loader2, Search, ChevronLeft, ChevronRight, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, Calendar, Clock, Users, CalendarDays, Share2, Check } from 'lucide-react';

const CustomCalendar = ({ exams, selectedDate, onSelectDate }: { exams: any[], selectedDate: Date | null, onSelectDate: (d: Date | null) => void }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const examDates = new Set(exams.map(e => e.start_time ? new Date(e.start_time).toLocaleDateString('en-CA') : null).filter(Boolean));

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
    const dateString = d.toLocaleDateString('en-CA');
    const hasExam = examDates.has(dateString);
    const isSelected = selectedDate && selectedDate.toLocaleDateString('en-CA') === dateString;
    const isToday = new Date().toLocaleDateString('en-CA') === dateString;

    days.push(
      <button
        key={i}
        type="button"
        onClick={() => onSelectDate(isSelected ? null : d)}
        className={`relative w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all border-none cursor-pointer ${isSelected ? 'bg-accent-primary text-white shadow-md' :
          isToday ? 'bg-surface-hover text-accent-primary' : 'text-text-main hover:bg-surface-hover bg-transparent'
          } ${hasExam && !isSelected ? 'ring-2 ring-accent-primary/60 ring-offset-1 ring-offset-surface' : ''}`}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl shadow-xl p-4 w-72 z-50">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={prevMonth} className="text-text-muted hover:text-text-main p-1 rounded hover:bg-surface-hover transition-colors bg-transparent border-none cursor-pointer"><ChevronLeft size={16} /></button>
        <span className="font-bold text-sm text-text-main">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <button type="button" onClick={nextMonth} className="text-text-muted hover:text-text-main p-1 rounded hover:bg-surface-hover transition-colors bg-transparent border-none cursor-pointer"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-[10px] font-bold text-text-muted uppercase">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-2 gap-x-1 place-items-center">
        {days}
      </div>
      {selectedDate && (
        <button type="button" onClick={() => onSelectDate(null)} className="mt-4 w-full py-2 text-xs font-semibold text-text-muted hover:text-red-500 bg-surface-hover hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors border-none cursor-pointer">
          Clear Date Filter
        </button>
      )}
    </div>
  );
};

export function ResultsListContent({ schoolIdProp, examIdProp }: { schoolIdProp?: string, examIdProp?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [viewMode, setViewMode] = useState<'exams_list' | 'exam_results'>(examIdProp ? 'exam_results' : 'exams_list');
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(examIdProp || '');
  const [results, setResults] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(schoolIdProp || null);
  const [schoolName, setSchoolName] = useState<string>('');

  // Results view filters
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [generatingStudentId, setGeneratingStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [sortBy, setSortBy] = useState('rank');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Exams list filters (now mirroring the teachers-page control panel)
  const [examSearchQuery, setExamSearchQuery] = useState('');
  const [examDateFilter, setExamDateFilter] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [examPage, setExamPage] = useState(1);
  const [examPerPage, setExamPerPage] = useState(8);
  const [examStatusFilter, setExamStatusFilter] = useState('all');
  const [isExamFilterOpen, setIsExamFilterOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const examFilterRef = useRef<HTMLDivElement>(null);
  const resultsFilterRef = useRef<HTMLDivElement>(null);
  const examSearchInputRef = useRef<HTMLInputElement>(null);
  const resultsSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMobileSearchOpen) {
      if (viewMode === 'exams_list') {
        examSearchInputRef.current?.focus();
      } else {
        resultsSearchInputRef.current?.focus();
      }
    }
  }, [isMobileSearchOpen, viewMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
      if (examFilterRef.current && !examFilterRef.current.contains(event.target as Node)) {
        setIsExamFilterOpen(false);
      }
      if (resultsFilterRef.current && !resultsFilterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSort = (newSort: string) => {
    if (sortBy === newSort) {
      setSortBy(newSort === 'rank' ? 'name' : newSort === 'rank' ? 'score' : 'rank');
    } else {
      setSortBy(newSort);
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy === field) return <ArrowUp size={14} />;
    return <ArrowUpDown size={14} className="opacity-30" />;
  };

  const filteredResults = results.filter(res => {
    const term = searchQuery.toLowerCase();
    const name = res.students?.full_name?.toLowerCase() || '';
    const rollNo = res.students?.roll_number?.toLowerCase() || '';
    const matchesSearch = !searchQuery || name.includes(term) || rollNo.includes(term);
    const matchesCourse = !courseFilter || res.students?.course === courseFilter;
    const matchesBatch = !batchFilter || res.students?.batch === batchFilter;
    return matchesSearch && matchesCourse && matchesBatch;
  }).sort((a, b) => {
    if (sortBy === 'name') return (a.students?.full_name || '').localeCompare(b.students?.full_name || '');
    if (sortBy === 'score') return (b.total_marks ?? 0) - (a.total_marks ?? 0);
    return (b.total_marks ?? 0) - (a.total_marks ?? 0);
  });

  const totalPages = Math.max(1, Math.ceil(filteredResults.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedResults = filteredResults.slice((safePage - 1) * perPage, safePage * perPage);

  const getPaginationPages = (current: number, total: number) => {
    if (total <= 3) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current === total) {
      return [1, '...', total];
    }
    if (current === total - 1) {
      return [current - 1, current, total];
    }
    return [current, '...', total];
  };

  const uniqueCourses = Array.from(new Set(results.map(r => r.students?.course).filter(Boolean)));
  const uniqueBatches = Array.from(new Set(results.map(r => r.students?.batch).filter(Boolean)));

  useEffect(() => {
    const fetchExams = async () => {
      let activeSchoolId: string | undefined = schoolIdProp;
      let isTeacher = false;
      let currentUserId = '';

      if (!activeSchoolId) {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;
        currentUserId = user.id;

        const role = user.user_metadata?.role;
        if (role === 'teacher') {
          isTeacher = true;
          const { data: profile } = await supabase.from('teachers').select('school_id').eq('id', user.id).single();
          if (profile?.school_id) activeSchoolId = profile.school_id;
        } else {
          activeSchoolId = user.user_metadata?.school_id;
          if (!activeSchoolId) {
            const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
            if (profile?.school_id) activeSchoolId = profile.school_id;
          }
        }

        if (!activeSchoolId) return;
      }

      setSchoolId(activeSchoolId || null);

      if (activeSchoolId) {
        const { data: schoolData } = await supabase.from('schools').select('name').eq('id', activeSchoolId).single();
        if (schoolData) setSchoolName(schoolData.name);
      }

      let query = supabase
        .from('exams')
        .select(`*, students(status, started_at, last_active_at, submitted_at)`)
        .eq('school_id', activeSchoolId)
        .in('status', ['completed', 'published', 'active'])
        .order('created_at', { ascending: false });

      if (isTeacher && currentUserId) {
        const { data: assignedSubjects } = await supabase.from('exam_subject_teachers').select('exam_subject_id').eq('teacher_id', currentUserId);
        const examSubjectIds = assignedSubjects?.map(s => s.exam_subject_id) || [];
        if (examSubjectIds.length > 0) {
          const { data: subjects } = await supabase.from('exam_subjects').select('exam_id').in('id', examSubjectIds);
          const uniqueExamIds = Array.from(new Set(subjects?.map(s => s.exam_id) || []));
          if (uniqueExamIds.length > 0) {
            query = query.in('id', uniqueExamIds);
          } else {
            setExams([]);
            setLoadingExams(false);
            return;
          }
        } else {
          setExams([]);
          setLoadingExams(false);
          return;
        }
      }

      const { data } = await query;

      const examsList = (data || []).map(e => {
        const attempts = (e.students || []).filter((s: any) => s.started_at || s.status === 'in_progress' || s.status === 'submitted');
        return {
          ...e,
          submissionCount: attempts.length
        };
      });
      setExams(examsList);
      setLoadingExams(false);
    };
    fetchExams();
  }, []);

  useEffect(() => {
    if (viewMode === 'exam_results' && selectedExamId) {
      fetchResults(selectedExamId);
    }
  }, [viewMode, selectedExamId]);

  const fetchResults = async (examId: string) => {
    setLoadingResults(true);
    try {
      const { data: studentsData, error: sError } = await supabase
        .from('students')
        .select('id, full_name, roll_number, course, batch, status, started_at, last_active_at, submitted_at')
        .eq('exam_id', examId);
      if (sError) throw sError;

      const { data: resData, error: resError } = await supabase
        .from('results')
        .select('*, exams:exam_id(title, total_marks, start_time, marking_scheme)')
        .eq('exam_id', examId);
      if (resError) throw resError;

      // Fetch exam subjects so we can generate synthetic section_scores (all 0)
      // for students who logged in but have no result row
      const { data: subjectsData } = await supabase
        .from('exam_subjects')
        .select('subject_name, total_marks')
        .eq('exam_id', examId)
        .order('sort_order', { ascending: true });
      const examSubjects = subjectsData || [];

      let examDetails = exams.find(e => e.id === examId);
      if (!examDetails) {
        const { data: examData } = await supabase
          .from('exams')
          .select('title, total_marks, start_time, status, marking_scheme')
          .eq('id', examId)
          .single();
        examDetails = examData;
      }

      const { data: qData } = await supabase
        .from('questions')
        .select('*, exam_subjects(subject_name)')
        .eq('exam_id', examId)
        .order('question_number', { ascending: true });
      const questionsList = qData || [];
      setQuestions(questionsList);

      const studentIds = (studentsData || []).map((s: any) => s.id);

      // Build synthetic section_scores (all 0) for logged-in students with no result
      const buildZeroSectionScores = () => {
        if (examSubjects.length > 0) {
          return examSubjects.map((subj: any) => ({
            subject_name: subj.subject_name,
            marks: 0,
            max_marks: subj.total_marks || 0
          }));
        }

        if (questionsList.length > 0) {
          const subjectSet = new Set<string>();
          questionsList.forEach((q: any) => {
            if (q.exam_subjects?.subject_name) {
              subjectSet.add(q.exam_subjects.subject_name);
            }
          });
          if (subjectSet.size > 0) {
            return Array.from(subjectSet).map(subj => ({
              subject_name: subj,
              marks: 0,
              max_marks: 0
            }));
          }
        }

        return [{
          subject_name: 'Overall',
          marks: 0,
          max_marks: examDetails?.total_marks || 0
        }];
      };

      let merged = studentIds.map((sid: any) => {
        const studentResult = (resData || []).find((r: any) => r.student_id === sid);
        const studentInfo = studentsData.find((s: any) => s.id === sid);
        const hasLoggedIn = !!(
          studentResult ||
          (studentInfo && (
            studentInfo.status === 'in_progress' ||
            studentInfo.status === 'submitted' ||
            studentInfo.started_at ||
            studentInfo.last_active_at ||
            studentInfo.submitted_at
          ))
        );
        return {
          id: studentResult?.id || `no-res-${sid}`,
          student_id: sid,
          exam_id: examId,
          total_marks: studentResult ? studentResult.total_marks : (hasLoggedIn ? 0 : null),
          time_taken_seconds: studentResult?.time_taken_seconds ?? (hasLoggedIn ? (studentInfo.last_active_at && studentInfo.started_at ? Math.max(0, Math.floor((new Date(studentInfo.last_active_at).getTime() - new Date(studentInfo.started_at).getTime()) / 1000)) : 0) : null),
          submitted_at: studentResult?.submitted_at || (hasLoggedIn ? (studentInfo.submitted_at || studentInfo.last_active_at || studentInfo.started_at) : null),
          answers: studentResult?.answers || (hasLoggedIn ? {} : null),
          // For logged-in students with no result or empty/invalid section_scores, generate 0-mark section scores
          section_scores: (Array.isArray(studentResult?.section_scores) && studentResult.section_scores.length > 0) 
            ? studentResult.section_scores 
            : (hasLoggedIn ? buildZeroSectionScores() : null),
          students: studentInfo || null,
          exams: studentResult?.exams || {
            title: examDetails?.title || '',
            total_marks: examDetails?.total_marks || 0,
            start_time: examDetails?.start_time || null,
            marking_scheme: examDetails?.marking_scheme || null
          },
          isAbsent: !hasLoggedIn
        };
      });

      merged.sort((a: any, b: any) => {
        if (a.isAbsent && !b.isAbsent) return 1;
        if (!a.isAbsent && b.isAbsent) return -1;
        return (b.total_marks ?? -Infinity) - (a.total_marks ?? -Infinity);
      });

      setResults(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResults(false);
    }
  };

  // Background calculation for missing scores
  useEffect(() => {
    const uncalculated = results.filter(r => !r.isAbsent && r.total_marks === null && r.answers);
    if (uncalculated.length === 0 || questions.length === 0) return;

    const calculateMissingScores = async () => {
      const updatedResults = [...results];
      let updatesNeeded = false;
      const updatesToSave: any[] = [];

      for (const res of updatedResults) {
        if (!res.isAbsent && res.total_marks === null && res.answers) {
          const breakdown = calculateSubjectBreakdown(questions, res.answers, res.exams?.marking_scheme);
          const totalScore = breakdown.reduce((acc: number, subj: any) => acc + subj.marks, 0);
          
          res.total_marks = totalScore;
          res.section_scores = breakdown;
          updatesNeeded = true;

          if (!res.id.startsWith('no-res-')) {
            updatesToSave.push({
              id: res.id,
              total_marks: totalScore,
              section_scores: breakdown
            });
          }
        }
      }

      if (updatesToSave.length > 0) {
        try {
          await fetch('/api/results/update-scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: updatesToSave })
          });
        } catch (err) {
          console.error('Failed to save calculated scores via API:', err);
        }
      }

      if (updatesNeeded) {
        updatedResults.sort((a: any, b: any) => {
          if (a.isAbsent && !b.isAbsent) return 1;
          if (!a.isAbsent && b.isAbsent) return -1;
          return (b.total_marks ?? -Infinity) - (a.total_marks ?? -Infinity);
        });
        setResults(updatedResults);
      }
    };

    calculateMissingScores();
  }, [results, questions, supabase]);

  const handleDownloadAllResults = async () => {
    if (!selectedExamId) return;

    const exam = exams.find(e => e.id === selectedExamId);
    if (!exam) return;

    if (filteredResults.length === 0) {
      alert("No results to download for the current filters.");
      return;
    }

    try {
      setIsGeneratingPdf(true);

      let calculatedTotal = 0;
      if (questions && questions.length > 0) {
        calculatedTotal = questions.reduce((sum, q) => sum + (q.positive_marks || 0), 0);
      }

      const formattedDate = exam.start_time ? new Date(exam.start_time).toLocaleDateString() : 'N/A';
      const totalExamMarks = calculatedTotal > 0 ? calculatedTotal : (exam.total_marks || 'N/A');
      const batchText = batchFilter ? `Batch: ${batchFilter}` : 'All Batches';
      const courseText = courseFilter ? `Course: ${courseFilter}` : 'All Courses';
      const filterText = `${courseText} | ${batchText}`;



      const resultsData = filteredResults.map(row => ({
        ...row,
        statusText: 'Completed',
        total_marks: row.total_marks ?? 'N/A'
      }));

      const pdfData = {
        examTitle: exam.title,
        formattedDate,
        totalExamMarks,
        filterText,
        results: resultsData
      };

      const { pdf } = await import('@react-pdf/renderer');
      const { ResultsDocument } = await import('@/components/pdf/ResultsDocument');

      const blob = await pdf(<ResultsDocument data={pdfData} /> as any).toBlob();
      const safeFilename = `${exam.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results${batchFilter ? `_${batchFilter.replace(/[^a-z0-9]/gi, '_').toLowerCase()}` : ''}.pdf`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = safeFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err: any) {
      alert('Failed to generate results PDF: ' + err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadStudentAnswerKey = async (studentResult: any) => {
    if (!studentResult.id) return;
    setGeneratingStudentId(studentResult.id);
    try {
      const { downloadAnswerKey } = await import('@/lib/downloadAnswerKey');
      await downloadAnswerKey(studentResult.id);
    } finally {
      setGeneratingStudentId(null);
    }
  };

  const handleCopyLink = () => {
    if (!selectedExamId) return;
    const url = `${getSchoolBaseUrl()}/result/${selectedExamId}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getEndTime = (startTime: string, durationMinutes: number) => {
    if (!startTime || !durationMinutes) return null;
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ---------------------------------------------------------------------
  // EXAMS LIST VIEW — teachers-page control panel + table (desktop),
  // cards (mobile)
  // ---------------------------------------------------------------------
  if (viewMode === 'exams_list') {
    const filteredExams = exams.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(examSearchQuery.toLowerCase());
      const matchesStatus = examStatusFilter === 'all' || e.status === examStatusFilter;
      let matchesDate = true;
      if (examDateFilter && e.start_time) {
        matchesDate = new Date(e.start_time).toLocaleDateString('en-CA') === examDateFilter.toLocaleDateString('en-CA');
      } else if (examDateFilter && !e.start_time) {
        matchesDate = false;
      }
      return matchesSearch && matchesStatus && matchesDate;
    });

    const examTotalPages = Math.max(1, Math.ceil(filteredExams.length / examPerPage));
    const examSafePage = Math.min(examPage, examTotalPages);
    const pagedExams = filteredExams.slice((examSafePage - 1) * examPerPage, examSafePage * examPerPage);

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
        <div className="mb-4">
          <p className="text-text-muted mt-1.5 font-medium">Select an exam to view analytics.</p>
        </div>

        {/* Control Panel — matches teachers page structure */}
        <div className="flex flex-row flex-wrap md:flex-nowrap items-center justify-between gap-2 md:gap-3 w-full bg-surface p-2 rounded-xl shadow-sm border border-border mb-4">
          {/* Search Box (Row 1 Left on Mobile) */}
          <div className="relative flex-1 md:flex-none md:w-[260px] order-1 md:order-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search Exams..."
              value={examSearchQuery}
              onChange={(e) => { setExamSearchQuery(e.target.value); setExamPage(1); }}
              className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
            />
          </div>

          {/* Action Buttons: Filter & Date (Row 1 Right on Mobile) */}
          <div className="flex items-center gap-2 order-2 md:order-4 shrink-0">
            <div className="relative" ref={examFilterRef}>
              <button
                type="button"
                onClick={() => setIsExamFilterOpen(!isExamFilterOpen)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium cursor-pointer"
              >
                <Filter size={14} className="text-accent-primary" /> <span className="hidden md:inline">Filter</span>
              </button>
              <div className={`absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col p-1.5 space-y-0.5 ${isExamFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">Filter</div>
                {[
                  { id: 'all', label: 'All Statuses' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'active', label: 'Ongoing' },
                  { id: 'published', label: 'Published' }
                ].map(status => (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => {
                      setExamStatusFilter(status.id);
                      setExamPage(1);
                      setIsExamFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-none flex items-center justify-between ${examStatusFilter === status.id ? 'bg-accent-primary/10 text-accent-primary font-bold' : 'text-text-main hover:bg-surface-hover'
                      }`}
                  >
                    <span>{status.label}</span>
                    {examStatusFilter === status.id && <Check size={14} className="text-accent-primary" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative shrink-0" ref={calendarRef}>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border transition-all cursor-pointer ${examDateFilter ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20' : 'bg-surface border-border text-text-main hover:bg-surface-hover'
                  }`}
              >
                <CalendarDays size={14} />
                <span className="hidden md:inline">{examDateFilter ? examDateFilter.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Date'}</span>
              </button>
              {isCalendarOpen && (
                <div className="absolute right-0 top-full mt-2 z-50">
                  <CustomCalendar
                    exams={exams}
                    selectedDate={examDateFilter}
                    onSelectDate={(d) => { setExamDateFilter(d); setExamPage(1); setIsCalendarOpen(false); }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Row 2 on Mobile: Page Navigation + Items Per Page Dropdown */}
          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto order-3 md:order-3 shrink-0 md:border-x md:border-border/50 px-1 md:px-3 py-1.5 md:py-0 border-t md:border-t-0 border-border/40">
            <select value={examPerPage} onChange={e => { setExamPerPage(Number(e.target.value)); setExamPage(1); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer">
              {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>

            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setExamPage(p => Math.max(1, p - 1))} disabled={examSafePage === 1} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                <ChevronLeft size={14} />
              </button>
              <div className="flex items-center justify-center gap-1 w-[80px]">
                {getPaginationPages(examSafePage, examTotalPages).map((p, i) => p === '...' ? (
                  <div key={`ellipsis-${i}`} className="w-6 h-6 flex items-center justify-center text-[11px] text-text-muted">…</div>
                ) : (
                  <button type="button" key={p} onClick={() => setExamPage(p as number)} className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-semibold transition-colors border-none cursor-pointer ${examSafePage === p ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-surface-hover bg-transparent'}`}>{p as number}</button>
                ))}
              </div>
              <button type="button" onClick={() => setExamPage(p => Math.min(examTotalPages, p + 1))} disabled={examSafePage === examTotalPages} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Row 3 on Mobile: Inline Active Filters */}
          <div className={`w-full md:w-auto md:flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0 order-4 md:order-2 border-t md:border-t-0 border-border/40 ${!(examSearchQuery || examStatusFilter !== 'all' || examDateFilter) ? 'hidden md:flex' : ''}`}>
            {(examSearchQuery || examStatusFilter !== 'all' || examDateFilter) ? (
              <>
                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
                {examSearchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                    "{examSearchQuery}"
                    <button type="button" onClick={() => setExamSearchQuery('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                  </span>
                )}
                {examStatusFilter !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                    {examStatusFilter}
                    <button type="button" onClick={() => setExamStatusFilter('all')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                  </span>
                )}
                {examDateFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                    {examDateFilter.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    <button type="button" onClick={() => setExamDateFilter(null)} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => { setExamSearchQuery(''); setExamStatusFilter('all'); setExamDateFilter(null); setExamPage(1); }}
                  className="text-[11px] text-text-muted hover:text-red-500 transition-colors ml-1 bg-transparent border-none cursor-pointer font-medium shrink-0"
                >
                  Clear
                </button>
              </>
            ) : (
              <span className="text-[11px] text-text-muted italic opacity-50">No active filters</span>
            )}
          </div>
        </div>

        {/* Table (desktop) / Cards (mobile) */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          {loadingExams ? (
            <table className="w-full animate-pulse">
              <thead><tr className="bg-bg"><th className="px-6 py-4"></th><th className="px-6 py-4"></th><th className="px-6 py-4"></th><th className="px-6 py-4"></th><th className="px-6 py-4"></th></tr></thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4"><div className="h-4 bg-bg rounded w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-bg rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-bg rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-bg rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-bg rounded w-16"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : filteredExams.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-4">
                <FileBarChart2 size={32} />
              </div>
              <h3 className="text-text-main font-bold text-lg">No Exams Found</h3>
              <p className="text-text-muted mt-1 text-sm font-medium max-w-md">Once exams are created and students submit their answers, the results will appear here.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto w-full">
                <table className="w-full min-w-[800px] text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[35%]">Exam Title</th>
                      <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[12%]">Status</th>
                      <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[18%]">Date &amp; Time</th>
                      <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%] text-center">Marks</th>
                      <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[15%] text-center">Submissions</th>
                      <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[10%] text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedExams.map((exam) => (
                      <tr key={exam.id} className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors cursor-pointer" onClick={() => router.push(`/results/${exam.id}`)}>
                        <td className="py-2.5 px-4 align-middle">
                          <span className="text-text-main font-semibold text-[13px] group-hover:text-accent-primary transition-colors">{exam.title}</span>
                        </td>
                        <td className="py-2.5 px-4 align-middle">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${exam.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                            {exam.status === 'completed' ? 'Completed' : 'Ongoing'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 align-middle text-text-muted text-[12px]">
                          {exam.start_time ? (
                            <>
                              <span className="font-medium text-text-main">{new Date(exam.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span><br />
                              <span className="opacity-80">
                                {exam.duration_minutes
                                  ? `${new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${getEndTime(exam.start_time, exam.duration_minutes)}`
                                  : new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          ) : '—'}
                        </td>
                        <td className="py-2.5 px-4 align-middle text-center text-text-muted text-[13px]">{exam.total_marks || '—'}</td>
                        <td className="py-2.5 px-4 align-middle text-center">
                          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-text-main"><Users size={12} className="text-text-muted" />{exam.submissionCount}</span>
                        </td>
                        <td className="py-2.5 px-4 align-middle text-center">
                          <span className="w-7 h-7 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors mx-auto">
                            <ChevronRight size={14} />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border/60">
                {pagedExams.map(exam => (
                  <div
                    key={exam.id}
                    onClick={() => router.push(`/results/${exam.id}`)}
                    className="p-4 flex flex-col gap-2.5 active:bg-surface-hover transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-text-main font-bold text-[14px] leading-snug">{exam.title}</span>
                      <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${exam.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {exam.status === 'completed' ? 'Completed' : 'Ongoing'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-text-muted font-medium flex-wrap">
                      <span className="inline-flex items-center gap-1"><Calendar size={12} className="text-accent-primary/70" />{exam.start_time ? new Date(exam.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}</span>
                      <span className="inline-flex items-center gap-1"><Clock size={12} className="text-accent-primary/70" />{exam.start_time ? new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                      <span className="inline-flex items-center gap-1"><Users size={12} className="text-accent-primary/70" />{exam.submissionCount} submissions</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[11px] font-semibold text-text-muted">{exam.total_marks ? `${exam.total_marks} Marks` : ''}</span>
                      <ChevronRight size={16} className="text-accent-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // EXAM RESULTS VIEW — teachers-page control panel + table (desktop),
  // cards (mobile)
  // ---------------------------------------------------------------------
  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-7xl mx-auto mt-4">
      {/* Control Panel */}
      {!loadingResults && (
        <div className="flex flex-row flex-wrap md:flex-nowrap items-center justify-between gap-2 md:gap-3 w-full bg-surface p-2 rounded-xl shadow-sm border border-border mb-4">
          {/* Search Box (Row 1 Left on Mobile) */}
          <div className="relative flex-1 md:flex-none md:w-[260px] order-1 md:order-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search Results..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
            />
          </div>

          {/* Action Buttons: Filter, Share & PDF (Row 1 Right on Mobile) */}
          <div className="flex items-center gap-2 order-2 md:order-4 shrink-0">
            <div className="relative" ref={resultsFilterRef}>
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium cursor-pointer"
              >
                <Filter size={14} className="text-accent-primary" /> <span className="hidden md:inline">Filter</span>
              </button>
              <div className={`absolute right-0 top-full mt-2 w-52 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col p-2 space-y-2 ${isFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">Course</div>
                  <button
                    type="button"
                    onClick={() => { setCourseFilter(''); setPage(1); setIsFilterOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-none flex items-center justify-between ${!courseFilter ? 'bg-accent-primary/10 text-accent-primary font-bold' : 'text-text-main hover:bg-surface-hover'}`}
                  >
                    <span>All Courses</span>
                    {!courseFilter && <Check size={14} className="text-accent-primary" />}
                  </button>
                  {uniqueCourses.map((c: any) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setCourseFilter(c); setPage(1); setIsFilterOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-none flex items-center justify-between ${courseFilter === c ? 'bg-accent-primary/10 text-accent-primary font-bold' : 'text-text-main hover:bg-surface-hover'}`}
                    >
                      <span>{c}</span>
                      {courseFilter === c && <Check size={14} className="text-accent-primary" />}
                    </button>
                  ))}
                </div>
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">Batch</div>
                  <button
                    type="button"
                    onClick={() => { setBatchFilter(''); setPage(1); setIsFilterOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-none flex items-center justify-between ${!batchFilter ? 'bg-accent-primary/10 text-accent-primary font-bold' : 'text-text-main hover:bg-surface-hover'}`}
                  >
                    <span>All Batches</span>
                    {!batchFilter && <Check size={14} className="text-accent-primary" />}
                  </button>
                  {uniqueBatches.map((b: any) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => { setBatchFilter(b); setPage(1); setIsFilterOpen(false); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-none flex items-center justify-between ${batchFilter === b ? 'bg-accent-primary/10 text-accent-primary font-bold' : 'text-text-main hover:bg-surface-hover'}`}
                    >
                      <span>{b}</span>
                      {batchFilter === b && <Check size={14} className="text-accent-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {results.length > 0 && exams.find(e => e.id === selectedExamId)?.status === 'completed' && (
              <>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-border hover:bg-surface-hover text-text-main transition-all text-[12px] font-medium cursor-pointer shrink-0 shadow-sm"
                >
                  {isCopied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} className="text-accent-primary" />}
                  <span className="hidden md:inline">{isCopied ? 'Copied!' : 'Share Result Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAllResults}
                  disabled={isGeneratingPdf}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-primary hover:bg-accent-primary/80 text-white transition-all text-[12px] font-medium disabled:opacity-75 cursor-pointer border-none shrink-0 shadow-sm"
                >
                  {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  <span className="hidden md:inline">PDF Results</span>
                </button>
              </>
            )}
          </div>

          {/* Row 2 on Mobile: Page Navigation + Items Per Page Dropdown */}
          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto order-3 md:order-3 shrink-0 md:border-x md:border-border/50 px-1 md:px-3 py-1.5 md:py-0 border-t md:border-t-0 border-border/40">
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer">
              {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>

            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                <ChevronLeft size={14} />
              </button>
              <div className="flex items-center justify-center gap-1 w-[80px]">
                {getPaginationPages(safePage, totalPages).map((p, i) => p === '...' ? (
                  <div key={`ellipsis-${i}`} className="w-6 h-6 flex items-center justify-center text-[11px] text-text-muted">…</div>
                ) : (
                  <button type="button" key={p} onClick={() => setPage(p as number)} className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-semibold transition-colors border-none cursor-pointer ${safePage === p ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-surface-hover bg-transparent'}`}>{p as number}</button>
                ))}
              </div>
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Row 3 on Mobile: Inline Active Filters */}
          <div className={`w-full md:w-auto md:flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0 order-4 md:order-2 border-t md:border-t-0 border-border/40 ${!(searchQuery || courseFilter || batchFilter || sortBy !== 'rank') ? 'hidden md:flex' : ''}`}>
            {(searchQuery || courseFilter || batchFilter || sortBy !== 'rank') ? (
              <>
                <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                    "{searchQuery}"
                    <button type="button" onClick={() => setSearchQuery('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                  </span>
                )}
                {courseFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                    {courseFilter}
                    <button type="button" onClick={() => setCourseFilter('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                  </span>
                )}
                {batchFilter && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                    {batchFilter}
                    <button type="button" onClick={() => setBatchFilter('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                  </span>
                )}
                {sortBy !== 'rank' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                    {sortBy === 'name' ? 'Name' : sortBy}
                    <button type="button" onClick={() => setSortBy('rank')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setCourseFilter(''); setBatchFilter(''); setSortBy('rank'); setPage(1); }}
                  className="text-[11px] text-text-muted hover:text-red-500 transition-colors ml-1 bg-transparent border-none cursor-pointer font-medium shrink-0"
                >
                  Clear
                </button>
              </>
            ) : (
              <span className="text-[11px] text-text-muted italic opacity-50">No active filters</span>
            )}
          </div>
        </div>
      )}

      {/* Results Table / Cards */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {loadingResults ? (
          <table className="w-full animate-pulse">
            <thead>
              <tr className="bg-bg">
                <th className="px-6 py-4"></th><th className="px-6 py-4"></th><th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th><th className="px-6 py-4"></th><th className="px-6 py-4"></th><th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-6 py-4"><div className="w-6 h-6 rounded-full bg-bg"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-bg rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-bg rounded w-40"></div></td>
                  <td className="px-6 py-4">
                    <div className="h-3 bg-bg rounded w-32 mb-1.5"></div>
                    <div className="h-3 bg-surface border border-border rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 bg-bg rounded w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-bg rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-8 bg-bg rounded w-24"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : results.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-4">
              <FileBarChart2 size={32} />
            </div>
            <h3 className="text-text-main font-bold text-lg">No submissions yet</h3>
            <p className="text-text-muted mt-1 text-sm font-medium">Results will appear here once students submit their exams.</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-16 text-center text-text-muted font-medium">
            No students found matching "{searchQuery}"
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full whitespace-nowrap min-w-[800px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent text-center w-[8%]">Rank</th>
                    <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent text-center w-[12%]">Roll No.</th>
                    <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[25%]" onClick={() => toggleSort('name')}>
                      <div className="flex items-center gap-2">Student Name {getSortIcon('name')}</div>
                    </th>
                    <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors text-center w-[10%]" onClick={() => toggleSort('score')}>
                      <div className="flex items-center gap-2 justify-center">Score {getSortIcon('score')}</div>
                    </th>
                    <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[20%]">Subject Breakdown</th>
                    <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent text-center w-[10%]">Time Taken</th>
                    <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent text-center w-[15%]">Submitted At</th>
                    <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent text-center w-[10%]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedResults.map((res, index) => {
                    const globalIndex = (safePage - 1) * perPage + index;
                    return (
                      <tr key={res.id} className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors">
                        <td className="py-2.5 px-4 align-middle text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${globalIndex === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                            globalIndex === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                              globalIndex === 2 ? 'bg-orange-100 text-orange-600 border border-orange-200' :
                                'text-text-muted bg-surface border border-border'
                            }`}>
                            #{globalIndex + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 align-middle text-center">
                          <span className="font-mono text-[11px] font-bold bg-surface text-accent-primary px-2 py-0.5 rounded-md border border-border">{res.students?.roll_number}</span>
                        </td>
                        <td className="py-2.5 px-4 align-middle">
                          <span className="text-text-main font-semibold text-[13px]">{res.students?.full_name}</span>
                        </td>
                        <td className="py-2.5 px-4 align-middle text-center">
                          {res.isAbsent ? (
                            <span className="text-text-muted font-medium text-[13px]">—</span>
                          ) : res.total_marks === null && res.answers ? (
                            <Loader2 size={16} className="animate-spin text-accent-primary mx-auto" />
                          ) : (
                            <span className="text-accent-primary font-bold text-base">{res.total_marks ?? 0}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 align-middle">
                          <div className="flex flex-col gap-0.5 text-[11px]">
                            {res.isAbsent ? (
                              <span className="text-text-muted">—</span>
                            ) : res.total_marks === null && res.answers ? (
                              <div className="flex items-center gap-1 text-text-muted">
                                <Loader2 size={10} className="animate-spin" /> Calculating...
                              </div>
                            ) : Array.isArray(res.section_scores) ? (
                              res.section_scores.map((score: any, idx: number) => (
                                <div key={idx} className="text-text-muted">
                                  <span className="font-semibold text-text-main">{score.subject_name}:</span> {score.marks} marks
                                </div>
                              ))
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 align-middle text-text-muted text-[13px] text-center font-medium">
                          {res.isAbsent ? '—' : formatTime(res.time_taken_seconds)}
                        </td>
                        <td className="py-2.5 px-4 align-middle text-text-muted text-[11px] text-center">
                          {res.submitted_at ? (
                            <>
                              <span className="font-medium text-text-main">{new Date(res.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><br />
                              <span className="text-text-muted opacity-80">{new Date(res.submitted_at).toLocaleDateString()}</span>
                            </>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 align-middle text-center">
                          {res.submitted_at ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadStudentAnswerKey(res)}
                              disabled={generatingStudentId === res.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface hover:bg-accent-primary/10 text-accent-primary font-semibold text-[11px] rounded-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100 border-none cursor-pointer"
                            >
                              {generatingStudentId === res.id ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                              Answer Key
                            </button>
                          ) : res.isAbsent ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">Not Attempted</span>
                          ) : (
                            <span className="text-text-muted text-[11px] font-medium">In Progress</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border/60">
              {pagedResults.map((res, index) => {
                const globalIndex = (safePage - 1) * perPage + index;
                return (
                  <div key={res.id} className="p-4 flex flex-col gap-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${globalIndex === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                          globalIndex === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                            globalIndex === 2 ? 'bg-orange-100 text-orange-600 border border-orange-200' :
                              'text-text-muted bg-surface border border-border'
                          }`}>
                          #{globalIndex + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="text-text-main font-bold text-[13px] truncate">{res.students?.full_name}</div>
                          <span className="font-mono text-[10px] font-bold bg-surface text-accent-primary px-1.5 py-0.5 rounded-md border border-border">{res.students?.roll_number}</span>
                        </div>
                      </div>
                      {res.isAbsent ? (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">Not Attempted</span>
                      ) : res.total_marks === null && res.answers ? (
                        <Loader2 size={16} className="animate-spin text-accent-primary shrink-0" />
                      ) : (
                        <span className="shrink-0 text-accent-primary font-bold text-lg">{res.total_marks ?? 0}</span>
                      )}
                    </div>

                    {!res.isAbsent && res.total_marks === null && res.answers ? (
                      <div className="flex items-center gap-1 text-text-muted bg-surface-hover rounded-lg p-2 text-[11px]">
                        <Loader2 size={10} className="animate-spin" /> Calculating...
                      </div>
                    ) : !res.isAbsent && Array.isArray(res.section_scores) && res.section_scores.length > 0 && (
                      <div className="flex flex-col gap-0.5 text-[11px] bg-surface-hover rounded-lg p-2">
                        {res.section_scores.map((score: any, idx: number) => (
                          <div key={idx} className="text-text-muted">
                            <span className="font-semibold text-text-main">{score.subject_name}:</span> {score.marks} marks
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-text-muted font-medium">
                      <span>{res.isAbsent ? '' : `Time: ${formatTime(res.time_taken_seconds)}`}</span>
                      <span>
                        {res.submitted_at ? `${new Date(res.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${new Date(res.submitted_at).toLocaleDateString()}` : ''}
                      </span>
                    </div>

                    {res.submitted_at && (
                      <button
                        type="button"
                        onClick={() => handleDownloadStudentAnswerKey(res)}
                        disabled={generatingStudentId === res.id}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-surface hover:bg-accent-primary/10 text-accent-primary font-semibold text-[11px] rounded-lg transition-all disabled:opacity-50 border border-border cursor-pointer"
                      >
                        {generatingStudentId === res.id ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                        Answer Key
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return <ResultsListContent />;
}