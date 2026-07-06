'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ResultsPage() {
  const supabase = createClient();
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      if (!profile?.school_id) return;
      setSchoolId(profile.school_id);

      const { data } = await supabase
        .from('exams')
        .select('*')
        .eq('school_id', profile.school_id)
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
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Exam Results</h2>
        <p className="text-gray-500 mt-1">View student performance and subject-wise score breakdown</p>
      </div>

      {/* Select Exam */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
        {loadingExams ? (
          <div className="text-gray-400 text-sm">Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="text-gray-400 text-sm">No exams created yet.</div>
        ) : (
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full max-w-md px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
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
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        {loadingResults ? (
          <div className="p-12 text-center text-gray-500">Loading results...</div>
        ) : !selectedExamId ? (
          <div className="p-12 text-center text-gray-500">Please select an exam to view results.</div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-gray-900 font-semibold text-lg">No submissions yet</h3>
            <p className="text-gray-500 mt-1">Results will appear here once students submit their exams.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Rank</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Roll No.</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Student Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Score</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Subject Breakdown</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Time Taken</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, index) => (
                <tr key={res.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-amber-500/20 text-amber-400' :
                      index === 1 ? 'bg-slate-400/20 text-gray-700' :
                      index === 2 ? 'bg-amber-700/20 text-amber-600' :
                      'text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-700">{res.students?.roll_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 font-medium">{res.students?.full_name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-indigo-400 font-bold">{res.total_marks ?? 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs">
                      {Array.isArray(res.section_scores) ? (
                        res.section_scores.map((score: any, idx: number) => (
                          <div key={idx} className="text-gray-500">
                            <span className="font-medium text-gray-700">{score.subject_name}:</span> {score.marks} marks ({score.correct}C/{score.wrong}W)
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {formatTime(res.time_taken_seconds)}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(res.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                    {new Date(res.submitted_at).toLocaleDateString()}
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
