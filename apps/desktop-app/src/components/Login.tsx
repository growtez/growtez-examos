import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess: (studentData: any, selectedExam: any, initialStep?: string) => void;
  serverTimeOffset?: number;
}

export default function Login({ onLoginSuccess, serverTimeOffset = 0 }: LoginProps) {
  const [schools, setSchools] = useState<any[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
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
      setSchoolsLoading(true);
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
      setSchoolsLoading(false);
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
    <div className="min-h-screen flex flex-col bg-white text-black font-sans selection:bg-[#475fa6] selection:text-white">
      {/* Premium Header */}
      <header className="py-6 px-10 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#475fa6] text-white flex items-center justify-center rounded-xl shadow-md">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
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
          
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold mb-2 tracking-tight">Welcome</h2>
            <p className="text-gray-500 text-sm">Sign in to access your examinations</p>
          </div>

          {!authSuccess ? (
            /* Credentials Form */
            <form onSubmit={handleStudentAuth} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">School / Center</label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  disabled={schoolsLoading}
                  className="w-full px-4 py-3.5 bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#475fa6] focus:border-transparent transition-all rounded-xl text-sm font-medium disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  {schoolsLoading ? (
                    <option value="">Loading centers...</option>
                  ) : schools.length === 0 ? (
                    <option value="">No centers available</option>
                  ) : (
                    schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Roll Number</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required
                  placeholder="Enter your roll number"
                  className="w-full px-4 py-3.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#475fa6] focus:border-transparent transition-all rounded-xl text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#475fa6] focus:border-transparent transition-all rounded-xl text-sm font-medium"
                />
              </div>

              {error && (
                <div className="bg-red-50/80 border border-red-100 p-3 rounded-xl text-red-600 text-sm font-semibold text-center">
                  {error}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#475fa6] hover:bg-[#394c86] text-white font-bold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-lg hover:shadow-xl active:scale-[0.98]"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </div>
            </form>
          ) : (
            /* Exam Selection Form */
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center shadow-sm">
                <div className="w-14 h-14 bg-[#475fa6] text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <span className="font-bold text-xl">{rollNumber.charAt(0).toUpperCase()}</span>
                </div>
                <p className="text-gray-900 text-lg font-bold">Candidate Verified</p>
                <p className="text-gray-500 text-sm mt-1 font-medium">Roll No: {rollNumber}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Available Examinations</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#475fa6] focus:border-transparent transition-all rounded-xl text-sm font-medium"
                >
                  {assignedExams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} ({exam.duration_minutes} mins)
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50/80 border border-red-100 p-3 rounded-xl text-red-600 text-sm font-semibold text-center">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={handleStartExam}
                  disabled={loading}
                  className="w-full py-4 bg-[#475fa6] hover:bg-[#394c86] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] text-sm"
                >
                  {loading ? 'Preparing Exam...' : 'Start Examination'}
                </button>
                <button
                  onClick={() => { setAuthSuccess(false); setAssignedExams([]); }}
                  className="w-full py-4 bg-white hover:bg-gray-50 text-[#475fa6] font-bold rounded-xl border border-gray-200 transition-all text-sm"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom Spacer (Expands to push card up) */}
        <div className="flex-1 min-h-[40px]"></div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-400 text-xs bg-white font-medium tracking-wide">
        &copy; {new Date().getFullYear()} ParikshaOS. All rights reserved.
      </footer>
    </div>
  );
}
