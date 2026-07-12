'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileBarChart2, Download, FileText, Loader2, Search } from 'lucide-react';

export function ResultsListContent({ schoolIdProp }: { schoolIdProp?: string }) {
  const supabase = createClient();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(schoolIdProp || null);
  const [schoolName, setSchoolName] = useState<string>('');
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatingStudentId, setGeneratingStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');

  const filteredResults = results.filter(res => {
    const term = searchQuery.toLowerCase();
    const name = res.students?.full_name?.toLowerCase() || '';
    const rollNo = res.students?.roll_number?.toLowerCase() || '';
    const matchesSearch = !searchQuery || name.includes(term) || rollNo.includes(term);
    const matchesCourse = !courseFilter || res.students?.course === courseFilter;
    const matchesBatch = !batchFilter || res.students?.batch === batchFilter;
    return matchesSearch && matchesCourse && matchesBatch;
  });

  const uniqueCourses = Array.from(new Set(results.map(r => r.students?.course).filter(Boolean)));
  const uniqueBatches = Array.from(new Set(results.map(r => r.students?.batch).filter(Boolean)));

  useEffect(() => {
    const fetchExams = async () => {
      let activeSchoolId: string | undefined = schoolIdProp;
      if (!activeSchoolId) {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;
        const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
        if (!profile?.school_id) return;
        activeSchoolId = profile.school_id;
      }
      setSchoolId(activeSchoolId || null);

      if (activeSchoolId) {
        const { data: schoolData } = await supabase.from('schools').select('name').eq('id', activeSchoolId).single();
        if (schoolData) setSchoolName(schoolData.name);
      }

      const { data } = await supabase
        .from('exams')
        .select('*')
        .eq('school_id', activeSchoolId)
        .order('created_at', { ascending: false });

      setExams(data || []);
      setLoadingExams(false);

      if (data && data.length > 0) {
        setSelectedExamId(data[0].id);
      }
    };
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchResults();
    } else {
      setResults([]);
      setQuestions([]);
    }
  }, [selectedExamId]);

  const fetchResults = async () => {
    setLoadingResults(true);
    
    // Fetch Results
    const { data: resultsData, error } = await supabase
      .from('results')
      .select('*, students:student_id(full_name, roll_number, course, batch)')
      .eq('exam_id', selectedExamId)
      .order('total_marks', { ascending: false });

    if (!error) {
      setResults(resultsData || []);
    } else {
      console.error(error);
    }

    // Fetch Questions
    const { data: questionsData } = await supabase
      .from('questions')
      .select('*, exam_subjects(subject_name)')
      .eq('exam_id', selectedExamId)
      .order('question_number', { ascending: true });
      
    if (questionsData) {
      setQuestions(questionsData);
    }

    setLoadingResults(false);
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

  const handleDownloadStudentAnswerKey = (studentResult: any) => {
    if (!studentResult.id) return;
    const link = document.createElement('a');
    link.href = `/api/download/answer-key?resultId=${studentResult.id}`;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1a2e2e]">Exam Results</h2>
          <p className="text-[#555555] mt-1 text-sm font-medium">View student performance and subject-wise score breakdown</p>
        </div>
        {results.length > 0 && exams.find(e => e.id === selectedExamId)?.status === 'completed' && (
          <button 
            onClick={handleDownloadAllResults}
            disabled={isGeneratingPdf}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-[#008080]/20 disabled:opacity-70 whitespace-nowrap"
          >
            {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isGeneratingPdf ? 'Generating...' : 'Download Results PDF'}
          </button>
        )}
      </div>

      {/* Select Exam */}
      <div className="bg-[#f5f9f9] border border-[#e0f2f2] rounded-2xl p-6 mb-6">
        <label className="block text-sm font-semibold text-[#1a2e2e] mb-2">Select Exam</label>
        {loadingExams ? (
          <div className="h-12 bg-white/50 animate-pulse rounded-xl w-full max-w-md border border-[#e0f2f2]"></div>
        ) : exams.length === 0 ? (
          <div className="text-[#8ab8b8] text-sm font-medium">No exams created yet.</div>
        ) : (
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full max-w-md px-4 py-3 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium"
          >
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} ({exam.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Search & Actions */}
      {results.length > 0 && !loadingResults && (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-[#8ab8b8]" />
              </div>
              <input
                type="text"
                placeholder="Search by student name or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium placeholder:text-[#8ab8b8]"
              />
            </div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium w-full sm:w-40 appearance-none"
            >
              <option value="">All Courses</option>
              {uniqueCourses.map((c: any) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-[#e0f2f2] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all text-sm font-medium w-full sm:w-40 appearance-none"
            >
              <option value="">All Batches</option>
              {uniqueBatches.map((b: any) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white border border-[#e0f2f2] rounded-2xl overflow-hidden shadow-sm">
        {loadingResults ? (
          <table className="w-full animate-pulse">
            <thead>
              <tr className="bg-[#f5f9f9]">
                <th className="px-6 py-4"></th>
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
                <tr key={i} className="border-b border-[#e0f2f2]">
                  <td className="px-6 py-4"><div className="w-6 h-6 rounded-full bg-[#f5f9f9]"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-[#f5f9f9] rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-[#f5f9f9] rounded w-40"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-[#f5f9f9] rounded w-12"></div></td>
                  <td className="px-6 py-4">
                    <div className="h-3 bg-[#f5f9f9] rounded w-32 mb-1.5"></div>
                    <div className="h-3 bg-white border border-[#e0f2f2] rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 bg-[#f5f9f9] rounded w-20"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-[#f5f9f9] rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-8 bg-[#f5f9f9] rounded w-24"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : !selectedExamId ? (
          <div className="p-16 text-center text-[#8ab8b8] font-medium">Please select an exam to view results.</div>
        ) : results.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#008080]/10 flex items-center justify-center text-[#008080] mb-4">
              <FileBarChart2 size={32} />
            </div>
            <h3 className="text-[#1a2e2e] font-bold text-lg">No submissions yet</h3>
            <p className="text-[#555555] mt-1 text-sm font-medium">Results will appear here once students submit their exams.</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-16 text-center text-[#8ab8b8] font-medium">
            No students found matching "{searchQuery}"
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="bg-[#f5f9f9] border-b border-[#e0f2f2]">
                  <th className="text-center px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Rank</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Roll No.</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Student Name</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Score</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Subject Breakdown</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Time Taken</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Submitted At</th>
                  <th className="text-center px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((res, index) => (
                  <tr key={res.id} className="border-b border-[#e0f2f2] hover:bg-[#f5f9f9]/50 transition-colors">
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                        index === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                        index === 2 ? 'bg-orange-100 text-orange-600 border border-orange-200' :
                        'text-[#8ab8b8] bg-[#f5f9f9]'
                      }`}>
                        #{index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-xs font-bold bg-[#f5f9f9] text-[#008080] px-2 py-1 rounded-md border border-[#e0f2f2]">{res.students?.roll_number}</span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <span className="text-[#1a2e2e] font-semibold">{res.students?.full_name}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[#008080] font-bold text-lg">{res.total_marks ?? 0}</span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex flex-col gap-1.5 text-xs">
                        {Array.isArray(res.section_scores) ? (
                          res.section_scores.map((score: any, idx: number) => (
                            <div key={idx} className="text-[#555555]">
                              <span className="font-semibold text-[#1a2e2e]">{score.subject_name}:</span> {score.marks} marks ({score.correct}C/{score.wrong}W)
                            </div>
                          ))
                        ) : (
                          <span className="text-[#8ab8b8]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#555555] text-sm font-medium text-center">
                      {formatTime(res.time_taken_seconds)}
                    </td>
                    <td className="px-6 py-4 text-[#555555] text-xs font-medium text-center">
                      {res.submitted_at ? (
                        <>
                          {new Date(res.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br/>
                          <span className="text-[#8ab8b8]">{new Date(res.submitted_at).toLocaleDateString()}</span>
                        </>
                      ) : (
                        <span className="text-[#8ab8b8]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {res.submitted_at ? (
                        <button 
                          onClick={() => handleDownloadStudentAnswerKey(res)}
                          disabled={generatingStudentId === res.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e0f2f2] hover:bg-[#f5f9f9] text-[#008080] font-medium text-xs rounded-lg transition-colors disabled:opacity-50"
                        >
                          {generatingStudentId === res.id ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                          Answer Key
                        </button>
                      ) : (
                        <span className="text-[#8ab8b8] text-xs font-medium">In Progress</span>
                      )}
                    </td>
                  </tr>
                ))}
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
