import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Step = 'login' | 'waiting_room' | 'exam' | 'submitted';

interface LoginProps {
  onLoginSuccess: (studentData: any, selectedExam: any, initialStep?: Step) => void;
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
    <div className="min-h-screen flex flex-col bg-[#f5f9f9] font-sans">

      {/* Header */}
      <header className="py-4 px-6 flex items-center justify-between bg-white border-b-2 border-[#008080] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#008080] flex items-center justify-center">
            <img src="/logo.png" alt="Growtez Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#1a2e2e] tracking-wide uppercase">ParikshaOS</h1>
            <p className="text-[10px] text-[#555555] font-medium uppercase tracking-widest">Powered by Growtez</p>
          </div>
        </div>
        <div className="h-8 w-px bg-[#b2d8d8]" />
      </header>

      {/* Login Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
        <div className="shrink-0 h-[3vh] md:h-[5vh] min-h-[20px]"></div>

        <div className="bg-white w-full max-w-md mx-auto border-2 border-[#008080] shadow-[4px_4px_0px_#004d4d] shrink-0">
          {/* Card header bar */}
          <div className="bg-[#008080] py-3 px-6 text-center">
            <span className="text-white font-extrabold text-sm uppercase tracking-widest">CANDIDATE LOGIN</span>
          </div>

          <div className="p-8">
            {!authSuccess ? (
              /* Credentials Form */
              <form onSubmit={handleStudentAuth} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#1a2e2e] mb-2 uppercase tracking-wider">Select School / Center</label>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:bg-white transition-colors text-sm"
                  >
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1a2e2e] mb-2 uppercase tracking-wider">Roll Number / Application No</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    required
                    placeholder="Enter your roll number"
                    className="w-full px-4 py-2.5 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] placeholder-[#8aacac] focus:outline-none focus:border-[#008080] focus:bg-white transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1a2e2e] mb-2 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:bg-white transition-colors text-sm"
                  />
                </div>

                {error && (
                  <div className="border border-red-400 bg-red-50 p-3 text-red-600 text-sm font-medium">
                    ⚠ {error}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white font-extrabold transition-colors disabled:opacity-50 text-sm uppercase tracking-widest border-b-4 border-[#004d4d] active:border-b-0 active:translate-y-1"
                  >
                    {loading ? 'AUTHENTICATING...' : 'LOGIN'}
                  </button>
                </div>
              </form>
            ) : (
              /* Exam Selection Form */
              <div className="space-y-5">
                <div className="bg-[#e0f2f2] border border-[#b2d8d8] p-4 text-center">
                  <p className="text-[#008080] text-sm font-extrabold uppercase tracking-wider">✓ Authentication Successful</p>
                  <p className="text-[#555555] text-sm mt-1">Roll No: <span className="font-bold text-[#1a2e2e]">{rollNumber}</span></p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1a2e2e] mb-2 uppercase tracking-wider">Select Examination</label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#f5f9f9] border border-[#b2d8d8] text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:bg-white transition-colors text-sm"
                  >
                    {assignedExams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title} ({exam.duration_minutes} mins)
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="border border-red-400 bg-red-50 p-3 text-red-600 text-sm font-medium">
                    ⚠ {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleStartExam}
                    disabled={loading}
                    className="flex-1 py-3 bg-[#008080] hover:bg-[#006666] text-white font-extrabold transition-colors border-b-4 border-[#004d4d] text-sm uppercase tracking-widest active:border-b-0 active:translate-y-1"
                  >
                    {loading ? 'LOADING...' : 'START EXAM'}
                  </button>
                  <button
                    onClick={() => { setAuthSuccess(false); setAssignedExams([]); }}
                    className="px-6 py-3 bg-white hover:bg-[#f5f9f9] text-[#1a2e2e] font-bold border-2 border-[#b2d8d8] hover:border-[#008080] transition-colors text-sm uppercase"
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
      <footer className="text-center py-3 text-[#8aacac] text-xs border-t-2 border-[#b2d8d8] bg-white uppercase tracking-widest">
        v1.0.0 · ParikshaOS · Growtez
      </footer>
    </div>
  );
}
