import { useState, useEffect, useRef } from 'react';
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

  // States and refs for searchable dropdown
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Compute filtered list of schools based on search term
  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside and Escape key to close the dropdown and revert search term
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const currentSchool = schools.find((s) => s.id === selectedSchoolId);
        if (currentSchool) {
          setSearchTerm(currentSchool.name);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        const currentSchool = schools.find((s) => s.id === selectedSchoolId);
        if (currentSchool) {
          setSearchTerm(currentSchool.name);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedSchoolId, schools]);

  // Synchronize searchTerm when selectedSchoolId or schools list changes
  useEffect(() => {
    const currentSchool = schools.find((s) => s.id === selectedSchoolId);
    if (currentSchool) {
      setSearchTerm(currentSchool.name);
    } else {
      setSearchTerm('');
    }
  }, [selectedSchoolId, schools]);

  // Fetch active schools on mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id, name, domain')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          setSchools(data);
          setSelectedSchoolId(data[0].id);
        } else {
          // Fallback if no schools found or query fails
          setSchools([{ id: 'dev-school', name: 'Dev School (Offline Fallback)' }]);
          setSelectedSchoolId('dev-school');
        }
      } catch (err) {
        console.warn('Failed to fetch schools, using offline fallback', err);
        setSchools([{ id: 'dev-school', name: 'Dev School (Offline Fallback)' }]);
        setSelectedSchoolId('dev-school');
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

      let email = `${rollNumber.trim()}@${selectedSchoolId}.student.examos.local`;
      const password = formatDobPassword(dob);

      // Attempt 1: Sign in with legacy email format
      let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Attempt 2: If failed due to invalid credentials, try new unique email format (Roll + DOB)
      if (authError && authError.message.toLowerCase().includes('invalid login credentials')) {
        const formattedDobForEmail = dob.replace(/-/g, '');
        email = `${rollNumber.trim()}_${formattedDobForEmail}@${selectedSchoolId}.student.examos.local`;
        
        const retryAuth = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        authData = retryAuth.data;
        authError = retryAuth.error;
      }

      if (authError) throw authError;
      if (!authData || !authData.user) throw new Error('Authentication failed: user not found');

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
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.warn('Signout failed', signOutErr);
      }
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
    <div className="h-screen overflow-hidden flex flex-col bg-[#F9FAFB] font-sans text-[#1D2939]">

      {/* Top Header - White */}
      <header className="border-b border-[#008080] flex items-center justify-between bg-white px-6 h-[90px] shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="ParikshaOS Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-[#008080] text-[20px] font-extrabold tracking-widest m-0 leading-tight uppercase">ParikshaOS</h1>
            <p className="text-[9px] text-[#667085] uppercase tracking-wider font-semibold">Powered by Growtez</p>
          </div>
        </div>
      </header>

      {/* Login Container */}
      <div 
        className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#008080 rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="shrink-0 h-[3vh] md:h-[5vh] min-h-[20px]"></div>

        <div className="bg-white w-full max-w-md mx-auto border border-[#E4E7EC] rounded-none shadow-xl overflow-hidden shrink-0">
          {/* Card header bar */}
          <div className="bg-[#008080] py-4 px-6 text-center">
            <span className="text-white font-extrabold text-sm uppercase tracking-widest">CANDIDATE LOGIN</span>
          </div>

          <div className="p-8">
            {!authSuccess ? (
              /* Credentials Form */
              <form onSubmit={handleStudentAuth} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#667085] mb-2 uppercase tracking-wider">Select School / Center</label>
                  <div className="relative" ref={dropdownRef}>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                      }}
                      onFocus={(e) => {
                        e.target.select();
                        setIsOpen(true);
                      }}
                      onClick={() => setIsOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                          setIsOpen(false);
                          const currentSchool = schools.find((s) => s.id === selectedSchoolId);
                          if (currentSchool) {
                            setSearchTerm(currentSchool.name);
                          }
                        } else if (e.key === 'Enter') {
                          if (isOpen) {
                            if (filteredSchools.length > 0) {
                              e.preventDefault();
                              setSelectedSchoolId(filteredSchools[0].id);
                              setSearchTerm(filteredSchools[0].name);
                              setIsOpen(false);
                            }
                          }
                        }
                      }}
                      placeholder="Search school / center..."
                      className="w-full px-4 py-2.5 bg-white border border-[#E4E7EC] rounded-none text-[#1D2939] placeholder-[#98A2B3] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] transition-all text-sm shadow-sm pr-10"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-[#667085]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {isOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-[#E4E7EC] rounded-none shadow-lg max-h-60 overflow-y-auto">
                        {filteredSchools.length > 0 ? (
                          filteredSchools.map((school) => (
                            <div
                              key={school.id}
                              onClick={() => {
                                setSelectedSchoolId(school.id);
                                setSearchTerm(school.name);
                                setIsOpen(false);
                              }}
                              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                                school.id === selectedSchoolId
                                  ? 'bg-[#008080]/10 text-[#008080] font-semibold'
                                  : 'text-[#1D2939] hover:bg-[#F9FAFB]'
                              }`}
                            >
                              {school.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-[#667085] text-center italic">
                            No schools found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#667085] mb-2 uppercase tracking-wider">Roll Number / Application No</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    required
                    placeholder="Enter your roll number"
                    className="w-full px-4 py-2.5 bg-white border border-[#E4E7EC] rounded-none text-[#1D2939] placeholder-[#98A2B3] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] transition-all text-sm shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#667085] mb-2 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-white border border-[#E4E7EC] rounded-none text-[#1D2939] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] transition-all text-sm shadow-sm"
                  />
                </div>

                {error && (
                  <div className="border border-[#F04438]/20 bg-[#F04438]/10 p-3 rounded-none text-[#F04438] text-sm font-semibold flex items-center gap-2">
                    <span>⚠</span> {error}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-none transition-colors disabled:opacity-50 text-sm uppercase tracking-wider shadow-sm"
                  >
                    {loading ? 'AUTHENTICATING...' : 'LOGIN'}
                  </button>
                </div>
                
                {/* DEV BYPASS BUTTON FOR TESTING */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      const mockStudent = { id: 'dev-student', full_name: 'Dev Student' };
                      const mockExam = { id: 'dev-exam', title: 'Dev Exam', duration_minutes: 60 };
                      onLoginSuccess(mockStudent, mockExam, 'exam');
                    }}
                    className="w-full py-2 bg-[#7A5AF8]/10 hover:bg-[#7A5AF8]/20 text-[#7A5AF8] font-bold border border-[#7A5AF8]/20 rounded-none transition-colors text-xs uppercase tracking-wider"
                  >
                    DEV: SKIP LOGIN
                  </button>
                </div>
              </form>
            ) : (
              /* Exam Selection Form */
              <div className="space-y-5">
                <div className="bg-[#12B76A]/10 border border-[#12B76A]/20 p-4 rounded-none text-center">
                  <p className="text-[#12B76A] text-sm font-bold uppercase tracking-wider">✓ Authentication Successful</p>
                  <p className="text-[#667085] text-sm mt-1">Roll No: <span className="font-bold text-[#1D2939]">{rollNumber}</span></p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#667085] mb-2 uppercase tracking-wider">Select Examination</label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#E4E7EC] rounded-none text-[#1D2939] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] transition-all text-sm shadow-sm"
                  >
                    {assignedExams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.title} ({exam.duration_minutes} mins)
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="border border-[#F04438]/20 bg-[#F04438]/10 p-3 rounded-none text-[#F04438] text-sm font-semibold flex items-center gap-2">
                    <span>⚠</span> {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleStartExam}
                    disabled={loading}
                    className="flex-1 py-3 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-none transition-colors text-sm uppercase tracking-wider shadow-sm"
                  >
                    {loading ? 'LOADING...' : 'START EXAM'}
                  </button>
                  <button
                    onClick={() => { setAuthSuccess(false); setAssignedExams([]); }}
                    className="px-6 py-3 bg-white hover:bg-[#F9FAFB] text-[#667085] font-bold border border-[#E4E7EC] rounded-none transition-colors text-sm uppercase shadow-sm"
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
      <footer className="text-center py-4 text-[#667085] text-xs border-t border-[#E4E7EC] bg-white uppercase tracking-widest font-semibold shrink-0">
        v1.0.0 · ParikshaOS · Growtez
      </footer>
    </div>
  );
}
