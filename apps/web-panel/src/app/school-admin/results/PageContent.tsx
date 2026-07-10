'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileBarChart2 } from 'lucide-react';

export function ResultsListContent({ schoolIdProp }: { schoolIdProp?: string }) {
  const supabase = createClient();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(schoolIdProp || null);

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
    }
  }, [selectedExamId]);

  const fetchResults = async () => {
    setLoadingResults(true);
    const { data, error } = await supabase
      .from('results')
      .select('*, students:student_id(full_name, roll_number)')
      .eq('exam_id', selectedExamId)
      .order('total_marks', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setResults(data || []);
    }
    setLoadingResults(false);
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#1a2e2e]">Exam Results</h2>
        <p className="text-[#555555] mt-1 text-sm font-medium">View student performance and subject-wise score breakdown</p>
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
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#f5f9f9] border-b border-[#e0f2f2]">
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Rank</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Roll No.</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Student Name</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Score</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Subject Breakdown</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Time Taken</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, index) => (
                <tr key={res.id} className="border-b border-[#e0f2f2] hover:bg-[#f5f9f9]/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                      index === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                      index === 2 ? 'bg-orange-100 text-orange-600 border border-orange-200' :
                      'text-[#8ab8b8] bg-[#f5f9f9]'
                    }`}>
                      #{index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold bg-[#f5f9f9] text-[#008080] px-2 py-1 rounded-md border border-[#e0f2f2]">{res.students?.roll_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#1a2e2e] font-semibold">{res.students?.full_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#008080] font-bold text-lg">{res.total_marks ?? 0}</span>
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4 text-[#555555] text-sm font-medium">
                    {formatTime(res.time_taken_seconds)}
                  </td>
                  <td className="px-6 py-4 text-[#555555] text-xs font-medium">
                    {new Date(res.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br/>
                    <span className="text-[#8ab8b8]">{new Date(res.submitted_at).toLocaleDateString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return <ResultsListContent />;
}
