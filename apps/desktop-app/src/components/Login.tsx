import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess: (studentData: any, selectedExam: any, initialStep?: string) => void;
  serverTimeOffset?: number;
}

export default function Login({ onLoginSuccess, serverTimeOffset = 0 }: LoginProps) {
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [assignedExams, setAssignedExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [error, setError] = useState('');

  // Fetch active schools on mount
  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name, domain')
        .eq('is_active', true);

      if (!error && data) {
        setSchools(data);
        if (data.length > 0) {
          setSelectedSchoolId(data[0].id);
        }
      }
    };
    fetchSchools();
  }, []);

  const formatDobPassword = (dateStr: string) => {
    // YYYY-MM-DD to DDMMYYYY
    const parts = dateStr.split('-');
    return `${parts[2]}${parts[1]}${parts[0]}`;
  };

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!selectedSchoolId) throw new Error('Please select your school');
      if (!rollNumber.trim()) throw new Error('Please enter your roll number');
      if (!dob) throw new Error('Please select your date of birth');

      const email = `${rollNumber.trim()}@${selectedSchoolId}.student.examos.local`;
      const password = formatDobPassword(dob);

      // Sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Fetch student profile details
      const { data: profile, error: profileError } = await supabase
        .from('students')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Student profile not found. Please contact school admin.');
      }

      // Fetch exams assigned to this student
      const { data: examAssignments, error: examError } = await supabase
        .from('exam_students')
        .select('*, exams:exam_id(*)')
        .eq('student_id', authData.user.id)
        .eq('status', 'assigned'); // only fetch exams that are assigned and not already submitted

      if (examError) throw examError;

      const activeExams = (examAssignments || [])
        .map((assignment: any) => assignment.exams)
        .filter((exam: any) => exam && (exam.status === 'published' || exam.status === 'active'));

      if (activeExams.length === 0) {
        throw new Error('No active exams assigned to you at this moment.');
      }

      setAssignedExams(activeExams);
      setSelectedExamId(activeExams[0].id);
      setAuthSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    setLoading(true);
    try {
      const selectedExam = assignedExams.find(e => e.id === selectedExamId);
      if (!selectedExam) throw new Error('Please select an exam');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single();

      const now = new Date(Date.now() + serverTimeOffset);
      const startTime = selectedExam.start_time ? new Date(selectedExam.start_time) : null;
      const endTime = selectedExam.end_time ? new Date(selectedExam.end_time) : null;

      // Check if we are outside the exam boundary
      if ((startTime && now < startTime) || (endTime && now > endTime)) {
        // Direct to waiting room if too early or too late
        onLoginSuccess(profile, selectedExam, 'waiting_room');
        return;
      }

      // If we are within time boundary, update student exam status to 'in_progress'
      await supabase
        .from('exam_students')
        .update({
          status: 'in_progress',
          started_at: new Date(now.getTime() - serverTimeOffset).toISOString(),
        })
        .eq('exam_id', selectedExamId)
        .eq('student_id', user.id);

      onLoginSuccess(profile, selectedExam, 'exam');
    } catch (err: any) {
      setError(err.message || 'Failed to start exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">

      {/* Premium Header */}
      <header className="py-6 px-10 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Growtez Logo" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ParikshaOS</h1>
          </div>
        </div>
      </header>

      {/* Login Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
        {/* Small top spacer keeps the card positioned high up */}
        <div className="shrink-0 h-[3vh] md:h-[5vh] min-h-[20px]"></div>

        <div className="bg-white w-full max-w-md mx-auto rounded-[24px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-200 shrink-0">
          <div className="bg-[#008080] text-white py-3 px-6 text-center font-bold text-lg border-b border-[#006666] rounded-t-[24px] -mt-8 -mx-10 mb-8">
            CANDIDATE LOGIN
          </div>

          <div className="p-8">
            {!authSuccess ? (
              /* Credentials Form */
              <form onSubmit={handleStudentAuth} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select School / Center</label>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-400 text-gray-900 focus:outline-none focus:border-[#ea580c] transition-colors text-sm rounded-none"
                  >
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Roll Number / Application No</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    required
                    placeholder="Enter your roll number"
                    className="w-full px-4 py-2.5 bg-white border border-gray-400 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#ea580c] transition-colors text-sm rounded-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-gray-400 text-gray-900 focus:outline-none focus:border-[#ea580c] transition-colors text-sm rounded-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 p-3 text-red-600 text-sm font-medium text-center">
                    {error}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#4ade80] hover:bg-[#22c55e] text-white font-bold transition-colors disabled:opacity-50 text-sm border border-[#16a34a] shadow-[1px_1px_3px_rgba(0,0,0,0.3)] rounded-none"
                  >
                    {loading ? 'AUTHENTICATING...' : 'LOGIN'}
                  </button>
                </div>
              </form>
            ) : (
              /* Exam Selection Form */
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 p-4 text-center">
                  <p className="text-[#008080] text-base font-bold">Welcome, Candidate</p>
                  <p className="text-gray-600 text-sm mt-1">Roll No: {rollNumber}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Examination</label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-400 text-gray-900 focus:outline-none focus:border-[#ea580c] transition-colors text-sm rounded-none"
                  >
                    {assignedExams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title} ({exam.duration_minutes} mins)
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 p-3 text-red-600 text-sm font-medium text-center">
                    {error}
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={handleStartExam}
                    disabled={loading}
                    className="flex-1 py-3 bg-[#4ade80] hover:bg-[#22c55e] text-white font-bold transition-colors shadow-[1px_1px_3px_rgba(0,0,0,0.3)] border border-[#16a34a] text-sm rounded-none"
                  >
                    {loading ? 'LOADING...' : 'START EXAM'}
                  </button>
                  <button
                    onClick={() => { setAuthSuccess(false); setAssignedExams([]); }}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold border border-gray-400 transition-colors text-sm rounded-none"
                  >
                    BACK
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500 text-xs border-t border-gray-300 bg-white">
        v1.0.0 | ParikshaOS Simulation
      </footer>
    </div>
  );
}
