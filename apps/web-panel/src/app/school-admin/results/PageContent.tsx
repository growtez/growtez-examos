'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getSchoolBaseUrl } from '@/lib/utils';
import { FileBarChart2, Download, FileText, Loader2, Search, ChevronLeft, ChevronRight, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, Calendar, Clock, Users, CalendarDays, Share2, Check } from 'lucide-react';

const CustomCalendar = ({ exams, selectedDate, onSelectDate }: { exams: any[], selectedDate: Date | null, onSelectDate: (d: Date | null) => void }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());
  
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  // Set of date strings (YYYY-MM-DD) that have completed exams
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
        className={`relative w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all border-none cursor-pointer ${
          isSelected ? 'bg-accent-primary text-white shadow-md' : 
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

  // Exams list filters
  const [examSearchQuery, setExamSearchQuery] = useState('');
  const [examDateFilter, setExamDateFilter] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
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

  const getPaginationPages = () => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safePage === totalPages) {
      return [1, '...', totalPages];
    }
    if (safePage === totalPages - 1) {
      return [safePage - 1, safePage, totalPages];
    }
    return [safePage, '...', totalPages];
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
        .select(`*, results(id)`)
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

      const examsList = (data || []).map(e => ({
        ...e,
        submissionCount: e.results ? e.results.length : 0
      }));
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
      // 1. Fetch assigned students directly from students table
      const { data: studentsData, error: sError } = await supabase
        .from('students')
        .select('id, full_name, roll_number, course, batch')
        .eq('exam_id', examId);
      if (sError) throw sError;

      // 2. Fetch results
      const { data: resData, error: resError } = await supabase
        .from('results')
        .select('*, exams:exam_id(title, total_marks, start_time)')
        .eq('exam_id', examId);
      if (resError) throw resError;

      // Get exam details from existing state or fallback
      let examDetails = exams.find(e => e.id === examId);
      if (!examDetails) {
        const { data: examData } = await supabase
          .from('exams')
          .select('title, total_marks, start_time, status')
          .eq('id', examId)
          .single();
        examDetails = examData;
      }

      // 4. Merge results with assigned students
      let merged = [];
      if (examDetails?.status === 'completed') {
        merged = studentIds.map((sid: any) => {
          const studentResult = (resData || []).find((r: any) => r.student_id === sid);
          const studentInfo = studentsData.find((s: any) => s.id === sid);
          return {
            id: studentResult?.id || `no-res-${sid}`,
            student_id: sid,
            exam_id: examId,
            total_marks: studentResult ? (studentResult.total_marks ?? 0) : null,
            time_taken_seconds: studentResult?.time_taken_seconds || null,
            submitted_at: studentResult?.submitted_at || null,
            answers: studentResult?.answers || null,
            section_scores: studentResult?.section_scores || null,
            students: studentInfo || null,
            exams: studentResult?.exams || {
              title: examDetails?.title || '',
              total_marks: examDetails?.total_marks || 0,
              start_time: examDetails?.start_time || null
            },
            isAbsent: !studentResult
          };
        });
      } else {
        // If ongoing, only show students who have a result entry
        merged = (resData || []).map((studentResult: any) => {
          const studentInfo = studentsData.find((s: any) => s.id === studentResult.student_id);
          return {
            id: studentResult.id,
            student_id: studentResult.student_id,
            exam_id: examId,
            total_marks: studentResult.total_marks ?? 0,
            time_taken_seconds: studentResult.time_taken_seconds || null,
            submitted_at: studentResult.submitted_at || null,
            answers: studentResult.answers || null,
            section_scores: studentResult.section_scores || null,
            students: studentInfo || null,
            exams: studentResult.exams || {
              title: examDetails?.title || '',
              total_marks: examDetails?.total_marks || 0,
              start_time: examDetails?.start_time || null
            },
            isAbsent: false
          };
        });
      }

      // Sort by total marks descending (placing absent/null at the end)
      merged.sort((a: any, b: any) => {
        if (a.isAbsent && !b.isAbsent) return 1;
        if (!a.isAbsent && b.isAbsent) return -1;
        return (b.total_marks ?? 0) - (a.total_marks ?? 0);
      });

      setResults(merged);

      const { data: qData } = await supabase
        .from('questions')
        .select('*, exam_subjects(subject_name)')
        .eq('exam_id', examId)
        .order('question_number', { ascending: true });
      setQuestions(qData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResults(false);
    }
  };

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

      let html = `
        <div style="font-family: Arial, sans-serif; padding: 30px; color: #1a2e2e;">
          <h1 style="text-align: center; color: #008080; margin-bottom: 5px;">${exam.title}</h1>
          <h3 style="text-align: center; color: #555555; margin-top: 0; margin-bottom: 5px;">Exam Results</h3>
          <div style="text-align: center; color: #777777; margin-bottom: 30px; font-size: 14px;">
            <strong>Date:</strong> ${formattedDate} | <strong>Total Marks:</strong> ${totalExamMarks} | <strong>${filterText}</strong>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; text-align: left;">
            <thead>
              <tr style="background-color: #f5f9f9;">
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Roll No</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Name</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Course</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Batch</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Session</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Status</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Score</th>
              </tr>
            </thead>
            <tbody>
      `;

      for (const row of filteredResults) {
        let statusText = 'Completed';
        const score = row.total_marks ?? 'N/A';
        const scoreColor = score === 'Absent' || score === 'N/A' ? '#999' : '#008080';

        html += `
          <tr>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.roll_number || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.full_name || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.course || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.batch || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.session || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${statusText}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2; font-weight: bold; color: ${scoreColor};">${score}</td>
          </tr>
        `;
      }

      html += `
            </tbody>
          </table>
        </div>
      `;

      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin: 10,
        filename: `${exam.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results${batchFilter ? `_${batchFilter.replace(/[^a-z0-9]/gi, '_').toLowerCase()}` : ''}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(html).save();
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

  if (viewMode === 'exams_list') {
    const filteredExams = exams.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(examSearchQuery.toLowerCase());
      let matchesDate = true;
      if (examDateFilter && e.start_time) {
        matchesDate = new Date(e.start_time).toLocaleDateString('en-CA') === examDateFilter.toLocaleDateString('en-CA');
      } else if (examDateFilter && !e.start_time) {
        matchesDate = false;
      }
      return matchesSearch && matchesDate;
    });

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-text-main tracking-tight">Exam Results</h1>
            <p className="text-text-muted mt-1.5 font-medium">Select an exam to view detailed student performance and analytics.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                type="text"
                placeholder="Search Exams..."
                value={examSearchQuery}
                onChange={(e) => setExamSearchQuery(e.target.value)}
                className="w-full py-2 pl-9 pr-4 bg-surface-hover border border-border rounded-xl text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all shadow-sm"
              />
            </div>
            <div className="relative" ref={calendarRef}>
              <button 
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all cursor-pointer ${
                  examDateFilter ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/20' : 'bg-surface border-border text-text-main hover:bg-surface-hover'
                }`}
              >
                <CalendarDays size={16} />
                {examDateFilter ? examDateFilter.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Filter by Date'}
              </button>
              {isCalendarOpen && (
                <div className="absolute right-0 top-full mt-2 z-50">
                  <CustomCalendar 
                    exams={exams} 
                    selectedDate={examDateFilter} 
                    onSelectDate={(d) => { setExamDateFilter(d); setIsCalendarOpen(false); }} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {loadingExams ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-[220px] bg-surface border border-border rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-5">
              <FileBarChart2 size={36} />
            </div>
            <h3 className="text-text-main font-bold text-2xl mb-2">No Exams Found</h3>
            <p className="text-text-muted text-base font-medium max-w-md">Once exams are created and students submit their answers, the results will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredExams.map(exam => (
              <div 
                key={exam.id} 
                onClick={() => router.push(`/results/${exam.id}`)}
                className="bg-surface border border-border hover:border-accent-primary p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      exam.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {exam.status === 'completed' ? 'Completed' : 'Ongoing'}
                    </span>
                    {exam.total_marks && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted bg-surface-hover px-2 py-1 rounded-md border border-border/50">
                        {exam.total_marks} Marks
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-text-main group-hover:text-accent-primary transition-colors line-clamp-2 leading-snug">{exam.title}</h3>
                  
                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-2.5 text-text-muted text-xs font-semibold bg-surface-hover px-3 py-1.5 rounded-lg border border-border/50">
                      <Calendar size={14} className="text-accent-primary/70" />
                      {exam.start_time ? new Date(exam.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set'}
                    </div>
                    <div className="flex items-center gap-2.5 text-text-muted text-xs font-semibold bg-surface-hover px-3 py-1.5 rounded-lg border border-border/50">
                      <Clock size={14} className="text-accent-primary/70" />
                      {exam.start_time ? (
                        exam.duration_minutes ? (
                          `${new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${getEndTime(exam.start_time, exam.duration_minutes)}`
                        ) : (
                          new Date(exam.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        )
                      ) : '—'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-5 border-t border-border flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-text-muted">
                    <Users size={16} />
                    <span className="text-xs font-bold"><span className="text-text-main">{exam.submissionCount}</span> Submissions</span>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-colors">
                    <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-7xl mx-auto mt-4">
      {/* Control Panel */}
      {!loadingResults && (
        <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border mb-4">
          {/* Search Box */}
          <div className="relative w-full md:max-w-[260px] shrink-0">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search Results..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
            />
          </div>

          {/* Inline Active Filters */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
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

          {/* Pagination Controls */}
          <div className="flex items-center justify-between md:justify-start gap-1 shrink-0 md:border-x md:border-border/50 px-3 py-1.5 md:py-0 w-full md:w-auto">
            <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center justify-center gap-1 w-[80px]">
              {getPaginationPages().map((p, i) => p === '...' ? (
                <div key={`ellipsis-${i}`} className="w-6 h-6 flex items-center justify-center text-[11px] text-text-muted">…</div>
              ) : (
                <button type="button" key={p} onClick={() => setPage(p as number)} className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-semibold transition-colors border-none cursor-pointer ${safePage === p ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-surface-hover bg-transparent'}`}>{p as number}</button>
              ))}
            </div>
            <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Controls and Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer flex-1 md:flex-none">
              {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
            <div className="relative group flex-1 md:flex-none">
              <button 
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium"
              >
                <Filter size={14} className="text-accent-primary" /> Filter
              </button>
              <div className={`absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col p-3 space-y-3 ${
                isFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
              }`}>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Course</label>
                  <select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }} className="w-full p-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-main focus:outline-none">
                    <option value="">All Courses</option>
                    {uniqueCourses.map((c: any) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Batch</label>
                  <select value={batchFilter} onChange={(e) => { setBatchFilter(e.target.value); setPage(1); }} className="w-full p-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-main focus:outline-none">
                    <option value="">All Batches</option>
                    {uniqueBatches.map((b: any) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>
            
            {results.length > 0 && exams.find(e => e.id === selectedExamId)?.status === 'completed' && (
              <>
                <button 
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface border border-border hover:bg-surface-hover text-text-main transition-all text-[12px] font-medium cursor-pointer flex-1 md:flex-none shadow-sm"
                >
                  {isCopied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} className="text-accent-primary" />}
                  {isCopied ? 'Copied!' : 'Share Result Link'}
                </button>
                <button 
                  type="button"
                  onClick={handleDownloadAllResults}
                  disabled={isGeneratingPdf}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-primary hover:bg-accent-primary/80 text-white transition-all text-[12px] font-medium disabled:opacity-75 cursor-pointer border-none flex-1 md:flex-none shadow-sm"
                >
                  {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  PDF Results
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {loadingResults ? (
          <table className="w-full animate-pulse">
            <thead>
              <tr className="bg-bg">
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
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
          <div className="overflow-x-auto w-full">
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
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ${
                          globalIndex === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' :
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
                        ) : (
                          <span className="text-accent-primary font-bold text-base">{res.total_marks ?? 0}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 align-middle">
                        <div className="flex flex-col gap-0.5 text-[11px]">
                          {res.isAbsent ? (
                            <span className="text-text-muted">—</span>
                          ) : Array.isArray(res.section_scores) ? (
                            res.section_scores.map((score: any, idx: number) => (
                              <div key={idx} className="text-text-muted">
                                <span className="font-semibold text-text-main">{score.subject_name}:</span> {score.marks} marks ({score.correct}C/{score.wrong}W)
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
                            <span className="font-medium text-text-main">{new Date(res.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><br/>
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">Absent</span>
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
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return <ResultsListContent />;
}
