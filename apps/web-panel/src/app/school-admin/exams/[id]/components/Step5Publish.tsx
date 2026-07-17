'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle, CheckCircle2, CreditCard, Play, Calendar, Clock, Users, BookOpen, Award, Monitor,
  Search, ChevronLeft, ChevronRight, Filter, ArrowUpDown, ArrowUp, X, FileBarChart2, FileText, Loader2, Download,
} from 'lucide-react';

interface Step5PublishProps {
  exam: any;
  allStepsComplete: boolean;
  publishing: boolean;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  durationMinutes: number;
  mcqCorrect: number | string;
  mcqWrong: number | string;
  natCorrect: number | string;
  natWrong: number | string;
  subjects: any[];
  questionCounts: Record<string, number>;
  assignedStudentsCount: number;
  examFee: number | null;
  onNavigateToStep: (step: number) => void;
  handlePublish: (bypassPayment: boolean) => void;
  handlePayment: () => void;
  supabase: any;
}

export default function Step5Publish({
  exam,
  allStepsComplete,
  publishing,
  startTime,
  endTime,
  title,
  description,
  durationMinutes,
  mcqCorrect,
  mcqWrong,
  natCorrect,
  natWrong,
  subjects,
  questionCounts,
  assignedStudentsCount,
  examFee,
  onNavigateToStep,
  handlePublish,
  handlePayment,
  supabase,
}: Step5PublishProps) {
  if (!exam) return null;

  // ---- Exam results table (shown once published) ----
  const [results, setResults] = useState<any[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsSearchQuery, setResultsSearchQuery] = useState('');
  const [resultsCourseFilter, setResultsCourseFilter] = useState('');
  const [resultsBatchFilter, setResultsBatchFilter] = useState('');
  const [resultsPage, setResultsPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(8);
  const [resultsSortBy, setResultsSortBy] = useState('rank');
  const [isResultsFilterOpen, setIsResultsFilterOpen] = useState(false);
  const [isGeneratingResultsPdf, setIsGeneratingResultsPdf] = useState(false);

  const isPublishedForFetch = exam.status !== 'draft';

  useEffect(() => {
    if (!isPublishedForFetch || !exam?.id || !supabase) return;
    let cancelled = false;
    const fetchResults = async () => {
      setLoadingResults(true);
      try {
        const { data, error } = await supabase
          .from('results')
          .select('*, students:student_id(full_name, roll_number, course, batch)')
          .eq('exam_id', exam.id)
          .order('total_marks', { ascending: false });
        if (error) throw error;
        if (!cancelled) setResults(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoadingResults(false);
      }
    };
    fetchResults();
    return () => { cancelled = true; };
  }, [isPublishedForFetch, exam?.id, supabase]);

  const toggleResultsSort = (field: string) => {
    setResultsSortBy((prev) => (prev === field ? 'rank' : field));
  };

  const getResultsSortIcon = (field: string) => {
    if (resultsSortBy === field) return <ArrowUp size={14} />;
    return <ArrowUpDown size={14} className="opacity-30" />;
  };

  const filteredResultsRows = results.filter((res) => {
    const term = resultsSearchQuery.toLowerCase();
    const name = res.students?.full_name?.toLowerCase() || '';
    const rollNo = res.students?.roll_number?.toLowerCase() || '';
    const matchesSearch = !resultsSearchQuery || name.includes(term) || rollNo.includes(term);
    const matchesCourse = !resultsCourseFilter || res.students?.course === resultsCourseFilter;
    const matchesBatch = !resultsBatchFilter || res.students?.batch === resultsBatchFilter;
    return matchesSearch && matchesCourse && matchesBatch;
  }).sort((a, b) => {
    if (resultsSortBy === 'name') return (a.students?.full_name || '').localeCompare(b.students?.full_name || '');
    return (b.total_marks ?? 0) - (a.total_marks ?? 0);
  });

  const resultsTotalPages = Math.max(1, Math.ceil(filteredResultsRows.length / resultsPerPage));
  const resultsSafePage = Math.min(resultsPage, resultsTotalPages);
  const pagedResultsRows = filteredResultsRows.slice(
    (resultsSafePage - 1) * resultsPerPage,
    resultsSafePage * resultsPerPage
  );

  const getResultsPaginationPages = () => {
    if (resultsTotalPages <= 3) return Array.from({ length: resultsTotalPages }, (_, i) => i + 1);
    if (resultsSafePage === resultsTotalPages) return [1, '...', resultsTotalPages];
    if (resultsSafePage === resultsTotalPages - 1) return [resultsSafePage - 1, resultsSafePage, resultsTotalPages];
    return [resultsSafePage, '...', resultsTotalPages];
  };

  const uniqueResultsCourses = Array.from(new Set(results.map((r) => r.students?.course).filter(Boolean)));
  const uniqueResultsBatches = Array.from(new Set(results.map((r) => r.students?.batch).filter(Boolean)));

  const formatTimeTaken = (seconds: number | null) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleDownloadAllResults = async () => {
    if (!exam?.id) return;
    if (filteredResultsRows.length === 0) {
      alert('No results to download for the current filters.');
      return;
    }
    try {
      setIsGeneratingResultsPdf(true);
      const formattedDate = startTime ? new Date(startTime).toLocaleDateString() : 'N/A';
      const batchText = resultsBatchFilter ? `Batch: ${resultsBatchFilter}` : 'All Batches';
      const courseText = resultsCourseFilter ? `Course: ${resultsCourseFilter}` : 'All Courses';
      const filterText = `${courseText} | ${batchText}`;

      let html = `
        <div style="font-family: Arial, sans-serif; padding: 30px; color: #1a2e2e;">
          <h1 style="text-align: center; color: #008080; margin-bottom: 5px;">${title}</h1>
          <h3 style="text-align: center; color: #555555; margin-top: 0; margin-bottom: 5px;">Exam Results</h3>
          <div style="text-align: center; color: #777777; margin-bottom: 30px; font-size: 14px;">
            <strong>Date:</strong> ${formattedDate} | <strong>${filterText}</strong>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; text-align: left;">
            <thead>
              <tr style="background-color: #f5f9f9;">
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Roll No</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Name</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Course</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Batch</th>
                <th style="padding: 10px; border: 1px solid #e0f2f2; color: #555555;">Score</th>
              </tr>
            </thead>
            <tbody>
      `;

      for (const row of filteredResultsRows) {
        const score = row.total_marks ?? 'N/A';
        html += `
          <tr>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.roll_number || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.full_name || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.course || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2;">${row.students?.batch || ''}</td>
            <td style="padding: 8px 10px; border: 1px solid #e0f2f2; font-weight: bold; color: #008080;">${score}</td>
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
        filename: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results${resultsBatchFilter ? `_${resultsBatchFilter.replace(/[^a-z0-9]/gi, '_').toLowerCase()}` : ''}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      await html2pdf().set(opt).from(html).save();
    } catch (err: any) {
      alert('Failed to generate results PDF: ' + err.message);
    } finally {
      setIsGeneratingResultsPdf(false);
    }
  };

  const handleDownloadStudentAnswerKey = (studentResult: any) => {
    if (!studentResult.id) return;
    const link = document.createElement('a');
    link.href = `/api/download/answer-key?resultId=${studentResult.id}`;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSetupComplete =
    title.trim() !== '' &&
    description.trim() !== '' &&
    durationMinutes > 0 &&
    String(mcqCorrect).trim() !== '' &&
    String(mcqWrong).trim() !== '' &&
    String(natCorrect).trim() !== '' &&
    String(natWrong).trim() !== '' &&
    subjects.length > 0;
  const isStudentsComplete = assignedStudentsCount > 0;
  const isQuestionsComplete =
    subjects.length > 0 &&
    subjects.every((subject) => (questionCounts[subject.id] || 0) >= subject.question_count);
  const isScheduleComplete = startTime !== '' && endTime !== '';

  const setupMissing = [
    title.trim() === '' ? 'Add exam title' : null,
    description.trim() === '' ? 'Add exam description' : null,
    durationMinutes <= 0 ? 'Set exam duration' : null,
    String(mcqCorrect).trim() === '' ? 'Set MCQ correct marks' : null,
    String(mcqWrong).trim() === '' ? 'Set MCQ wrong marks' : null,
    String(natCorrect).trim() === '' ? 'Set NAT correct marks' : null,
    String(natWrong).trim() === '' ? 'Set NAT wrong marks' : null,
    subjects.length === 0 ? 'Add at least one subject' : null,
  ].filter(Boolean) as string[];

  const incompleteSubjects = subjects
    .filter((subject) => (questionCounts[subject.id] || 0) < subject.question_count)
    .map((subject) => {
      const added = questionCounts[subject.id] || 0;
      return `${subject.subject_name}: ${added}/${subject.question_count} questions`;
    });

  const requirements = [
    {
      step: 1,
      title: 'Setup',
      complete: isSetupComplete,
      details: setupMissing.length > 0 ? setupMissing : ['Complete'],
    },
    {
      step: 2,
      title: 'Students',
      complete: isStudentsComplete,
      details: isStudentsComplete
        ? [`${assignedStudentsCount} assigned`]
        : ['Assign students'],
    },
    {
      step: 3,
      title: 'Questions',
      complete: isQuestionsComplete,
      details: isQuestionsComplete
        ? ['Complete']
        : subjects.length === 0
          ? ['Add subjects']
          : incompleteSubjects,
    },
    {
      step: 4,
      title: 'Schedule',
      complete: isScheduleComplete,
      details: isScheduleComplete
        ? ['Complete']
        : [
          !startTime ? 'Add start time' : null,
          !endTime ? 'Add end time' : null,
        ].filter(Boolean) as string[],
    },
  ];

  const missingCount = requirements.filter((item) => !item.complete).length;
  const canPublish = allStepsComplete && isScheduleComplete;
  const isFeeLoaded = examFee != null;
  const isPublished = exam.status !== 'draft';

  const formatDateTime = (value: string) => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const totalQuestions = subjects.reduce((sum, s) => sum + (s.question_count || 0), 0);

  if (isPublished) {
    const statusLabel = exam.status.charAt(0).toUpperCase() + exam.status.slice(1);
    return (
      <div className="bg-bg border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <span className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="text-emerald-600" size={24} />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-text-main">Exam Published</h3>
              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-700">
                {statusLabel}
              </span>
            </div>
            <p className="text-text-muted text-sm font-medium mt-1">
              {title} is set up and ready. Students will take it on the lockdown desktop app during the scheduled window — no link to share.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-text-muted mb-1.5">
              <Calendar size={15} />
              <p className="text-[11px] font-bold uppercase tracking-wide">Starts</p>
            </div>
            <p className="text-sm font-bold text-text-main">{formatDateTime(startTime)}</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-text-muted mb-1.5">
              <Calendar size={15} />
              <p className="text-[11px] font-bold uppercase tracking-wide">Ends</p>
            </div>
            <p className="text-sm font-bold text-text-main">{formatDateTime(endTime)}</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-text-muted mb-1.5">
              <Clock size={15} />
              <p className="text-[11px] font-bold uppercase tracking-wide">Duration</p>
            </div>
            <p className="text-sm font-bold text-text-main">{durationMinutes} min</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-text-muted mb-1.5">
              <BookOpen size={15} />
              <p className="text-[11px] font-bold uppercase tracking-wide">Subjects &amp; Questions</p>
            </div>
            <p className="text-sm font-bold text-text-main">{subjects.length} subjects · {totalQuestions} questions</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-text-muted mb-1.5">
              <Users size={15} />
              <p className="text-[11px] font-bold uppercase tracking-wide">Students</p>
            </div>
            <p className="text-sm font-bold text-text-main">{assignedStudentsCount} assigned</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 text-text-muted mb-1.5">
              <Award size={15} />
              <p className="text-[11px] font-bold uppercase tracking-wide">Marking</p>
            </div>
            <p className="text-sm font-bold text-text-main">MCQ +{mcqCorrect}/{mcqWrong} · NAT +{natCorrect}/{natWrong}</p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border bg-surface px-4 py-3 text-text-muted">
          <Monitor size={15} className="mt-0.5 shrink-0" />
          <p className="text-xs font-semibold">
            Exams run through the lockdown desktop app. Assigned students will see this exam there once the scheduled window opens.
          </p>
        </div>

        {/* Results Section */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h4 className="text-base font-bold text-text-main flex items-center gap-2">
              <FileBarChart2 size={18} className="text-accent-primary" />
              Results
            </h4>
          </div>

          {!loadingResults && results.length > 0 && (
            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border mb-4">
              {/* Search Box */}
              <div className="relative w-full md:max-w-[260px] shrink-0">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Search Results..."
                  value={resultsSearchQuery}
                  onChange={(e) => { setResultsSearchQuery(e.target.value); setResultsPage(1); }}
                  className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                />
              </div>

              {/* Inline Active Filters */}
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
                {(resultsSearchQuery || resultsCourseFilter || resultsBatchFilter || resultsSortBy !== 'rank') ? (
                  <>
                    <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
                    {resultsSearchQuery && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                        "{resultsSearchQuery}"
                        <button type="button" onClick={() => setResultsSearchQuery('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                      </span>
                    )}
                    {resultsCourseFilter && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                        {resultsCourseFilter}
                        <button type="button" onClick={() => setResultsCourseFilter('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                      </span>
                    )}
                    {resultsBatchFilter && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                        {resultsBatchFilter}
                        <button type="button" onClick={() => setResultsBatchFilter('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                      </span>
                    )}
                    {resultsSortBy !== 'rank' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                        {resultsSortBy === 'name' ? 'Name' : resultsSortBy}
                        <button type="button" onClick={() => setResultsSortBy('rank')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => { setResultsSearchQuery(''); setResultsCourseFilter(''); setResultsBatchFilter(''); setResultsSortBy('rank'); setResultsPage(1); }}
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
                <button type="button" onClick={() => setResultsPage((p) => Math.max(1, p - 1))} disabled={resultsSafePage === 1} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                  <ChevronLeft size={14} />
                </button>
                <div className="flex items-center justify-center gap-1 w-[80px]">
                  {getResultsPaginationPages().map((p, i) => p === '...' ? (
                    <div key={`ellipsis-${i}`} className="w-6 h-6 flex items-center justify-center text-[11px] text-text-muted">…</div>
                  ) : (
                    <button type="button" key={p} onClick={() => setResultsPage(p as number)} className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-semibold transition-colors border-none cursor-pointer ${resultsSafePage === p ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-surface-hover bg-transparent'}`}>{p as number}</button>
                  ))}
                </div>
                <button type="button" onClick={() => setResultsPage((p) => Math.min(resultsTotalPages, p + 1))} disabled={resultsSafePage === resultsTotalPages} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Controls and Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                <select value={resultsPerPage} onChange={(e) => { setResultsPerPage(Number(e.target.value)); setResultsPage(1); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer flex-1 md:flex-none">
                  {[8, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
                <div className="relative group flex-1 md:flex-none">
                  <button
                    type="button"
                    onClick={() => setIsResultsFilterOpen(!isResultsFilterOpen)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium"
                  >
                    <Filter size={14} className="text-accent-primary" /> Filter
                  </button>
                  <div className={`absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col p-3 space-y-3 ${isResultsFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Course</label>
                      <select value={resultsCourseFilter} onChange={(e) => { setResultsCourseFilter(e.target.value); setResultsPage(1); }} className="w-full p-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-main focus:outline-none">
                        <option value="">All Courses</option>
                        {uniqueResultsCourses.map((c: any) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Batch</label>
                      <select value={resultsBatchFilter} onChange={(e) => { setResultsBatchFilter(e.target.value); setResultsPage(1); }} className="w-full p-1.5 bg-surface-hover border border-border rounded-lg text-xs text-text-main focus:outline-none">
                        <option value="">All Batches</option>
                        {uniqueResultsBatches.map((b: any) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadAllResults}
                  disabled={isGeneratingResultsPdf}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors text-[12px] font-semibold disabled:opacity-50 flex-1 md:flex-none"
                >
                  {isGeneratingResultsPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Download PDF
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            {loadingResults ? (
              <table className="w-full animate-pulse">
                <tbody>
                  {[...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-b-0">
                      <td className="py-3 px-4"><div className="h-3 w-full bg-border/40 rounded" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : results.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-3">
                  <FileBarChart2 size={28} />
                </div>
                <h3 className="text-text-main font-bold text-base">No submissions yet</h3>
                <p className="text-text-muted mt-1 text-sm font-medium">Results will appear here once students submit their exam.</p>
              </div>
            ) : filteredResultsRows.length === 0 ? (
              <div className="p-12 text-center text-text-muted font-medium text-sm">
                No students found matching "{resultsSearchQuery}"
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full whitespace-nowrap min-w-[720px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent text-center w-[8%]">Rank</th>
                      <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent text-center w-[14%]">Roll No.</th>
                      <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[28%]" onClick={() => toggleResultsSort('name')}>
                        <div className="flex items-center gap-2">Student Name {getResultsSortIcon('name')}</div>
                      </th>
                      <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors text-center w-[12%]" onClick={() => toggleResultsSort('score')}>
                        <div className="flex items-center gap-2 justify-center">Score {getResultsSortIcon('score')}</div>
                      </th>
                      <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent text-center w-[12%]">Time Taken</th>
                      <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent text-center w-[16%]">Submitted At</th>
                      <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent text-center w-[10%]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedResultsRows.map((res, index) => {
                      const globalIndex = (resultsSafePage - 1) * resultsPerPage + index;
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
                            <span className="text-accent-primary font-bold text-base">{res.total_marks ?? 0}</span>
                          </td>
                          <td className="py-2.5 px-4 align-middle text-text-muted text-[13px] text-center font-medium">
                            {formatTimeTaken(res.time_taken_seconds)}
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
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface hover:bg-accent-primary/10 text-accent-primary font-semibold text-[11px] rounded-lg transition-all hover:scale-105 active:scale-95 border-none cursor-pointer"
                              >
                                <FileText size={12} />
                                Answer Key
                              </button>
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
      </div>
    );
  }

  return (
    <div className="bg-bg border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-text-main mb-2">Publish Exam</h3>
      <p className="text-text-muted text-sm font-medium mb-6">
        {canPublish
          ? 'Ready to publish.'
          : `${missingCount} pending`}
      </p>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-text-main">Checklist</h4>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${canPublish ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}
            >
              {canPublish ? 'Ready to publish' : 'Needs fixes'}
            </span>
          </div>

          <div className="space-y-4">
            {requirements.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => onNavigateToStep(item.step)}
                className="w-full border-b border-border/70 pb-4 text-left transition-colors hover:bg-bg/40 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  {item.complete ? (
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                  ) : (
                    <AlertCircle className="mt-0.5 shrink-0 text-red-600" size={18} />
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${item.complete ? 'text-emerald-700' : 'text-red-700'}`}>
                      {item.title}
                    </p>
                    <ul className={`mt-1 space-y-1 text-xs font-semibold ${item.complete ? 'text-emerald-700/85' : 'text-red-700/90'}`}>
                      {item.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-5">
            <h4 className="text-sm font-bold text-text-main">Publish actions</h4>
          </div>

          <div className="flex flex-col gap-3">
            {exam.is_paid ? (
              <button
                onClick={() => handlePublish(false)}
                disabled={!canPublish || publishing}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-primary hover:bg-accent-primary/80 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
              >
                <Play size={16} />
                {publishing ? 'Publishing...' : 'Publish Exam'}
              </button>
            ) : (
              <>
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
                  <p className="text-xs font-bold uppercase">Price</p>
                  <p className="mt-1 text-lg font-bold">
                    {isFeeLoaded ? `Rs ${examFee}` : 'Loading...'}
                  </p>
                </div>
                <button
                  onClick={handlePayment}
                  disabled={!canPublish || publishing || !isFeeLoaded}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                >
                  <CreditCard size={16} />
                  Pay & Publish
                </button>

              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}