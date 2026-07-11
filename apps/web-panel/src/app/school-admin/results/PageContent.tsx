'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileBarChart2, Download, FileText, Loader2, Search } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const filteredResults = results.filter(res => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    const name = res.students?.full_name?.toLowerCase() || '';
    const rollNo = res.students?.roll_number?.toLowerCase() || '';
    return name.includes(term) || rollNo.includes(term);
  });

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
      .select('*, students:student_id(full_name, roll_number)')
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

  const handleDownloadAllResults = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      const exam = exams.find(e => e.id === selectedExamId);
      const testName = exam?.title || 'Exam Results';
      const totalStudents = results.length;

      // Header
      doc.setFontSize(18);
      doc.setTextColor(26, 46, 46);
      doc.text(schoolName || 'Results Report', 40, 40);
      
      doc.setFontSize(11);
      doc.setTextColor(85, 85, 85);
      doc.text(`Test Name: ${testName}`, 40, 60);
      doc.text(`Total Students Appeared: ${totalStudents}`, 40, 75);

      // Collect all unique subjects from the results
      const subjectSet = new Set<string>();
      results.forEach(r => {
        if (Array.isArray(r.section_scores)) {
          r.section_scores.forEach((s: any) => subjectSet.add(s.subject_name));
        }
      });
      const subjects = Array.from(subjectSet);

      const tableColumn = ["Sl No", "Roll No", "Student Name", "Total Score", ...subjects.map(s => `${s} (Correct)`)];
      const tableRows: any[] = [];

      results.forEach((res, index) => {
        const rowData = [
          index + 1,
          res.students?.roll_number || 'N/A',
          res.students?.full_name || 'Unknown',
          res.total_marks ?? 0
        ];

        // Subject wise correct answers
        subjects.forEach(sub => {
          let correctAnswers = 0;
          if (Array.isArray(res.section_scores)) {
             const score = res.section_scores.find((s: any) => s.subject_name === sub);
             if (score) correctAnswers = score.correct;
          }
          rowData.push(correctAnswers);
        });

        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 95,
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [0, 128, 128], textColor: 255 }, // Teal color
        alternateRowStyles: { fillColor: [245, 249, 249] },
      });

      doc.save(`${testName.replace(/[^a-zA-Z0-9]/g, '_')}_Results.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadStudentAnswerKey = (studentResult: any) => {
    setGeneratingStudentId(studentResult.id);
    // Use a small timeout so the UI updates to show loading state before the synchronous JS blocks thread
    setTimeout(() => {
      try {
        const exam = exams.find(e => e.id === selectedExamId);
        const testName = exam?.title || 'Exam';
        const studentName = studentResult.students?.full_name || 'Unknown';
        const rollNo = studentResult.students?.roll_number || 'N/A';
        const marks = studentResult.total_marks ?? 0;
        const studentAnswers = studentResult.answers || {};

        const html = `
          <div style="font-family: 'Inter', sans-serif; padding: 20px; color: #1a2e2e; max-width: 800px; margin: 0 auto; background: #ffffff;">
            <h1 style="color: #008080; font-size: 24px; margin-bottom: 5px;">${schoolName || 'Student Answer Key'}</h1>
            <div style="margin-bottom: 20px; color: #555555; border-bottom: 2px solid #e0f2f2; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <p style="margin: 3px 0;"><strong>Test Name:</strong> ${testName}</p>
                <p style="margin: 3px 0;"><strong>Student Name:</strong> ${studentName}</p>
                <p style="margin: 3px 0;"><strong>Roll Number:</strong> ${rollNo}</p>
              </div>
              <h3 style="color: #008080; margin: 0; font-size: 18px;">Total Score: ${marks}</h3>
            </div>
            
            ${questions.map((q, index) => {
              const studentAns = studentAnswers[q.id]?.answer;
              const correctAns = q.correct_option;
              
              let marksAwarded = 0;
              if (studentAns !== undefined && studentAns !== null && studentAns !== '') {
                  if (String(studentAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase()) {
                      marksAwarded = q.positive_marks || q.marks || 1;
                  } else {
                      marksAwarded = q.negative_marks ? -Math.abs(q.negative_marks) : (q.question_type === 'mcq' ? -1 : 0);
                  }
              }
              
              let qText = q.question_text || 'Image Based Question';
              
              let optionsHtml = '';
              if (q.options && typeof q.options === 'object') {
                optionsHtml = '<div style="margin-top: 15px; display: flex; flex-direction: column; gap: 8px;">';
                for (const [key, val] of Object.entries(q.options)) {
                   let borderStyle = '1px solid #e0f2f2';
                   let bgStyle = 'transparent';
                   
                   if (key === correctAns) {
                     borderStyle = '2px solid #22c55e'; // Green
                     bgStyle = '#f0fdf4';
                   } else if (key === studentAns) {
                     borderStyle = '2px solid #ef4444'; // Red
                     bgStyle = '#fef2f2';
                   }
                   
                   optionsHtml += `
                     <div style="padding: 12px 15px; border-radius: 8px; border: ${borderStyle}; background-color: ${bgStyle}; font-size: 14px;">
                       <strong>${key})</strong> ${val}
                       ${key === correctAns ? '<span style="color: #22c55e; font-weight: bold; float: right; font-size: 13px;">✓ Correct Answer</span>' : ''}
                       ${key === studentAns && key !== correctAns ? '<span style="color: #ef4444; font-weight: bold; float: right; font-size: 13px;">✗ Your Answer</span>' : ''}
                     </div>
                   `;
                }
                optionsHtml += '</div>';
              }

              return `
                <div style="margin-bottom: 25px; page-break-inside: avoid; background: #fff; padding: 20px; border: 1px solid #e0f2f2; border-radius: 12px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #f5f9f9; padding-bottom: 10px;">
                    <span style="font-weight: bold; color: #008080; font-size: 14px;">Q.${q.question_number || index + 1} | ${q.exam_subjects?.subject_name || 'General'}</span>
                    <span style="font-weight: bold; font-size: 14px; color: ${marksAwarded > 0 ? '#22c55e' : marksAwarded < 0 ? '#ef4444' : '#8ab8b8'};">
                      Marks: ${marksAwarded > 0 ? '+' : ''}${marksAwarded}
                    </span>
                  </div>
                  <div style="font-size: 15px; line-height: 1.6; color: #333333;">
                    ${qText}
                  </div>
                  ${optionsHtml}
                </div>
              `;
            }).join('')}
          </div>
        `;

        import('html2pdf.js').then((html2pdfModule) => {
          const html2pdf = html2pdfModule.default || html2pdfModule;
          html2pdf().from(html).set({
            margin: 10,
            filename: `${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_AnswerKey.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          }).save().then(() => {
            setGeneratingStudentId(null);
          }).catch((err: any) => {
            console.error('Error in html2pdf:', err);
            setGeneratingStudentId(null);
          });
        }).catch((err: any) => {
          console.error('Error importing html2pdf:', err);
          setGeneratingStudentId(null);
        });

      } catch (error) {
        console.error('Error generating answer key:', error);
        setGeneratingStudentId(null);
      }
    }, 50);
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
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-[#008080]/20 disabled:opacity-70"
          >
            {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isGeneratingPdf ? 'Generating PDF...' : 'Download Results PDF'}
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
          <div className="relative w-full sm:w-96">
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
          <div className="overflow-x-auto">
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
