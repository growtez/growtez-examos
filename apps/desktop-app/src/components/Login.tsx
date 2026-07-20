import { useState, useEffect, useRef } from 'react';
import { supabase, setStudentToken } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';

type Step = 'login' | 'waiting_room' | 'exam' | 'submitted';

interface LoginProps {
  onLoginSuccess: (studentData: any, selectedExam: any, initialStep?: Step) => void;
  serverTimeOffset: number;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  // States and refs for searchable dropdown
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCloseApp = async () => {
    try {
      const { appWindow } = await import('@tauri-apps/api/window');
      await appWindow.close();
    } catch (e) {
      console.error('[KioskMode] Failed to close application window.', e);
    }
  };

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
        } else {
          setSearchTerm('');
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        const currentSchool = schools.find((s) => s.id === selectedSchoolId);
        if (currentSchool) {
          setSearchTerm(currentSchool.name);
        } else {
          setSearchTerm('');
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
        } else {
          console.warn('No schools found or query failed');
        }
      } catch (err) {
        console.warn('Failed to fetch schools', err);
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

    // Track authenticated user ID so the catch block can clear the session lock
    // if something fails after check_and_set_student_session has already fired.
    let authedUserId: string | null = null;

    try {
      if (!selectedSchoolId) throw new Error('Please select your school');
      if (!rollNumber.trim()) throw new Error('Please enter your roll number');
      if (!dob) throw new Error('Please select your date of birth');

      // Call the custom JWT endpoint
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const loginRes = await fetch(`${apiUrl}/api/auth/student-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: selectedSchoolId,
          roll_number: rollNumber.trim(),
          dob: dob
        })
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.error || 'Authentication failed');

      const { access_token, student } = loginData;
      
      // Inject token into the local supabase client
      setStudentToken(access_token);

      authedUserId = student.id;

      // 1. Check and lock the device session — prevents simultaneous logins on other devices
      const devId = getDeviceId();
      const { data: isSessionValid, error: sessionError } = await supabase.rpc(
        'check_and_set_student_session',
        { p_student_id: student.id, p_device_id: devId }
      );

      if (sessionError || !isSessionValid) {
        throw new Error(
          'This student is already logged in on another device. ' +
          'Please wait for the active session to expire or contact your administrator.'
        );
      }

      // 2. Fetch student profile details
      const { data: profile, error: profileError } = await supabase
        .from('students')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Student profile not found. Please contact school admin.');
      }

      // 3. Auto-select the student's exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', profile.exam_id)
        .single();

      if (examError) throw examError;

      const activeAssignments = [
        {
          ...profile,
          exams: examData
        }
      ].filter(
        (assignment: any) => assignment.exams && (assignment.exams.status === 'published' || assignment.exams.status === 'active')
      );

      if (activeAssignments.length === 0) {
        throw new Error('No active exams assigned to you at this moment.');
      }

      const selectedAssignment = activeAssignments[0];
      const selectedExam = {
        ...selectedAssignment.exams,
        student_exam_status: selectedAssignment.status,
        student_started_at: selectedAssignment.started_at,
      };

      // 4. Redirect directly to the Exam Interface if already in_progress, else to the Waiting Room
      if (selectedAssignment.status === 'in_progress') {
        onLoginSuccess(profile, selectedExam, 'exam');
      } else {
        onLoginSuccess(profile, selectedExam, 'waiting_room');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      try {
        // If the session was already locked before the error, release it
        if (authedUserId) {
          await supabase.rpc('clear_student_session', {
            p_student_id: authedUserId,
            p_device_id: getDeviceId(),
          });
        }
        await supabase.auth.signOut();
      } catch (signOutErr) {
        console.warn('Signout/session clear failed', signOutErr);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#F9FAFB] font-sans text-[#1D2939]">

      {/* Top Header - White */}
      <header className="border-b border-[#008080] flex items-center justify-between bg-white px-6 h-[90px] shrink-0">
        <div className="flex items-center gap-3">
          <img src="/ParikshaOS_logo.png" alt="ParikshaOS Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-[#008080] text-[20px] font-extrabold tracking-widest m-0 leading-tight">ParikshaOS</h1>
            <p className="text-[9px] text-[#667085] uppercase tracking-wider font-semibold">Powered by Growtez</p>
          </div>
        </div>
        <div>
          <button
            onClick={handleCloseApp}
            className="flex items-center gap-2 px-4 py-2 bg-[#F04438] hover:bg-[#d13b30] active:bg-[#b83029] text-white font-bold rounded-none transition-all text-xs uppercase tracking-wider shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Exit Application
          </button>
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

        <div className="bg-white w-full max-w-2xl mx-auto border border-[#E4E7EC] rounded-none shadow-xl overflow-hidden shrink-0">
          {/* Card header bar */}
          <div className="bg-[#008080] py-4 px-6 text-center">
            <span className="text-white font-extrabold text-sm uppercase tracking-widest">CANDIDATE LOGIN</span>
          </div>

          <div className="p-8">
            {/* Credentials Form — single-step login, redirects directly to Waiting Room */}
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

                <div className="grid grid-cols-1 gap-5">
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
                </div>

                {error && (
                  <div className="border border-[#F04438]/20 bg-[#F04438]/10 p-3 rounded-none text-[#F04438] text-sm font-semibold flex items-center gap-2">
                    {error}
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


              </form>
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
