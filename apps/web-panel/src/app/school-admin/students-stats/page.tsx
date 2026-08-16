'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { Search, TrendingUp, TrendingDown, Minus, BarChart2, User } from 'lucide-react';

export default function StudentStatsPage() {
  const supabase = createClient();

  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Filter state
  const [rollNumber, setRollNumber] = useState('');
  const [session, setSession] = useState('');
  const [batch, setBatch] = useState('');
  const [course, setCourse] = useState('');

  // Dropdown options from DB
  const [existingCourses, setExistingCourses] = useState<string[]>([]);
  const [existingBatches, setExistingBatches] = useState<string[]>([]);
  const [existingSessions, setExistingSessions] = useState<string[]>([]);

  // Results
  const [studentName, setStudentName] = useState('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [avgScore, setAvgScore] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const user = authSession?.user;
      if (!user) return;
      const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      if (!profile?.school_id) return;
      setSchoolId(profile.school_id);

      // Load distinct values from exams for smart dropdowns
      const { data: exams } = await supabase
        .from('exams')
        .select('course, batch, session')
        .eq('school_id', profile.school_id)
        .not('course', 'is', null);

      if (exams) {
        setExistingCourses([...new Set(exams.map((e: any) => e.course).filter(Boolean))]);
        setExistingBatches([...new Set(exams.map((e: any) => e.batch).filter(Boolean))]);
        setExistingSessions([...new Set(exams.map((e: any) => e.session).filter(Boolean))]);
      }
    };
    init();
  }, []);

  const handleSearch = async () => {
    if (!rollNumber.trim() || !session.trim() || !batch.trim() || !course.trim()) return;
    setLoading(true);
    setSearched(true);
    setChartData([]);
    setTableData([]);
    setStudentName('');
    setAvgScore(null);

    try {
      // Find all student rows matching roll_number + session + batch + course in this school
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, exam_id, status, started_at, last_active_at, submitted_at')
        .eq('school_id', schoolId)
        .eq('roll_number', rollNumber.trim())
        .eq('session', session.trim())
        .eq('batch', batch.trim())
        .eq('course', course.trim());

      if (!students || students.length === 0) {
        setLoading(false);
        return;
      }

      setStudentName(students[0].full_name);
      const studentIds = students.map((s: any) => s.id);
      const examIds = students.map((s: any) => s.exam_id);

      // Fetch results, exams and questions in parallel
      const [resultsRes, examsRes, questionsRes] = await Promise.all([
        supabase
          .from('results')
          .select('student_id, exam_id, total_marks, submitted_at')
          .in('student_id', studentIds),
        supabase
          .from('exams')
          .select('id, title, total_marks, start_time')
          .in('id', examIds)
          .order('start_time', { ascending: true }),
        supabase
          .from('questions')
          .select('exam_id, positive_marks, marks')
          .in('exam_id', examIds)
      ]);

      const results = resultsRes.data || [];
      const exams = examsRes.data || [];
      const questionsData = questionsRes.data || [];

      // Calculate max marks per exam from questions if needed
      const examMaxMarks: Record<string, number> = {};
      questionsData.forEach((q: any) => {
        if (!examMaxMarks[q.exam_id]) examMaxMarks[q.exam_id] = 0;
        examMaxMarks[q.exam_id] += (q.positive_marks ?? q.marks ?? 0);
      });

      // Map exam_id -> student object for the results join
      const examToStudentObj: Record<string, any> = {};
      students.forEach((s: any) => { examToStudentObj[s.exam_id] = s; });

      const rows = exams.map((exam: any) => {
        const studentObj = examToStudentObj[exam.id];
        const studentId = studentObj?.id;
        const result = results.find((r: any) => r.student_id === studentId && r.exam_id === exam.id);
        const hasLoggedIn = !!(
          result ||
          (studentObj && (
            studentObj.status === 'in_progress' ||
            studentObj.status === 'submitted' ||
            studentObj.started_at ||
            studentObj.last_active_at ||
            studentObj.submitted_at
          ))
        );

        const obtained = result?.total_marks ?? (hasLoggedIn ? 0 : null);

        let max = exam.total_marks;
        if (!max || max === 0) {
          max = examMaxMarks[exam.id] || 0;
        }

        const pct = (obtained !== null && max > 0) ? Math.round((obtained / max) * 100 * 10) / 10 : (hasLoggedIn ? 0 : null); 
        return {
          examTitle: exam.title,
          date: exam.start_time ? new Date(exam.start_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—',
          rawDate: exam.start_time,
          obtained,
          max,
          percentage: pct,
          attempted: hasLoggedIn,
        };
      });

      setTableData(rows);
      setChartData(rows.filter(r => r.attempted));

      const attempted = rows.filter(r => r.attempted && r.percentage !== null);
      if (attempted.length > 0) {
        setAvgScore(Math.round(attempted.reduce((s, r) => s + (r.percentage ?? 0), 0) / attempted.length * 10) / 10);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const trend = chartData.length >= 2
    ? chartData[chartData.length - 1].percentage - chartData[0].percentage
    : null;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-main">Student Statistics</h2>
        <p className="text-sm text-text-muted mt-1">Track a student&apos;s performance across all exams in a session</p>
      </div>

      {/* Filter Panel */}
      <div className="bg-surface border border-border rounded-xl p-5 mb-6">
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Search Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Roll Number *</label>
            <input
              type="text"
              value={rollNumber}
              onChange={e => setRollNumber(e.target.value)}
              placeholder="e.g. 101"
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Session *</label>
            <select
              value={session}
              onChange={e => setSession(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 appearance-none"
            >
              <option value="" disabled>Select Session</option>
              {existingSessions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Batch *</label>
            <select
              value={batch}
              onChange={e => setBatch(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 appearance-none"
            >
              <option value="" disabled>Select Batch</option>
              {existingBatches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">Course *</label>
            <select
              value={course}
              onChange={e => setCourse(e.target.value)}
              className="w-full px-3 py-2.5 bg-bg border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 appearance-none"
            >
              <option value="" disabled>Select Course</option>
              {existingCourses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !rollNumber || !session || !batch || !course}
          className="mt-4 flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl transition-all"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {searched && !loading && tableData.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No student found</p>
          <p className="text-sm mt-1">Check the roll number, session, batch and course and try again.</p>
        </div>
      )}

      {tableData.length > 0 && (
        <>
          {/* Student Header */}
          <div className="bg-surface border border-border rounded-xl p-5 mb-5 flex flex-wrap items-center gap-5">
            <div className="flex-1">
              <p className="text-xs text-text-muted font-semibold uppercase tracking-widest">Student</p>
              <p className="text-xl font-bold text-text-main mt-0.5">{studentName}</p>
              <p className="text-sm text-text-muted">{course} · {batch} · {session}</p>
            </div>
            <div className="flex gap-5 flex-wrap">
              <div className="text-center">
                <p className="text-xs text-text-muted font-semibold">Exams Taken</p>
                <p className="text-2xl font-black text-accent-primary">{chartData.length}</p>
              </div>
              {avgScore !== null && (
                <div className="text-center">
                  <p className="text-xs text-text-muted font-semibold">Avg Score</p>
                  <p className="text-2xl font-black text-accent-primary">{avgScore}%</p>
                </div>
              )}
              {trend !== null && (
                <div className="text-center">
                  <p className="text-xs text-text-muted font-semibold">Trend</p>
                  <div className={`flex items-center justify-center gap-1 text-xl font-black ${trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-500' : 'text-text-muted'}`}>
                    {trend > 0 ? <TrendingUp className="w-5 h-5" /> : trend < 0 ? <TrendingDown className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                    {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chart */}
          {chartData.length >= 2 && (
            <div className="bg-surface border border-border rounded-xl p-5 mb-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-accent-primary" />
                <h3 className="text-sm font-bold text-text-main">Score Trend</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="examTitle"
                      tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '…' : v}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(value: any) => [`${value}%`, 'Score']}
                    />
                    {avgScore && <ReferenceLine y={avgScore} stroke="var(--color-accent-primary)" strokeDasharray="4 4" label={{ value: `Avg ${avgScore}%`, fill: 'var(--color-accent-primary)', fontSize: 11, position: 'right' }} />}
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="var(--color-accent-primary)"
                      strokeWidth={2.5}
                      dot={{ fill: 'var(--color-accent-primary)', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold text-text-main">Exam-wise Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-bg text-xs text-text-muted uppercase tracking-widest font-semibold">
                    <th className="text-left px-5 py-3">Exam</th>
                    <th className="text-center px-4 py-3">Date</th>
                    <th className="text-center px-4 py-3">Score</th>
                    <th className="text-center px-4 py-3">Percentage</th>
                    <th className="text-center px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, i) => (
                    <tr key={i} className="border-t border-border hover:bg-bg/50 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-text-main">{row.examTitle}</td>
                      <td className="px-4 py-3 text-sm text-text-muted text-center">{row.date}</td>
                      <td className="px-4 py-3 text-sm text-center font-bold text-text-main">
                        {row.attempted ? `${row.obtained} / ${row.max}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.percentage !== null ? (
                          <span className={`text-sm font-bold ${row.percentage >= 75 ? 'text-emerald-500' : row.percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                            {row.percentage}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.attempted ? (
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600">Attempted</span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-500/10 text-red-500">Not Attempted</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
