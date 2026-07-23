import { useState, useEffect, useRef } from 'react';
import { supabase, setStudentToken } from '../lib/supabase';
import { getDeviceId } from '../lib/deviceId';
import VirtualKeyboard from './VirtualKeyboard';

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
  const [activeInput, setActiveInput] = useState<'school' | 'roll' | 'dob' | null>(null);

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
      const vk = document.getElementById('virtual-keyboard');
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        (!vk || !vk.contains(event.target as Node))
      ) {
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

  const formatDob = (val: string) => {
    // If it's already YYYY-MM-DD from native calendar picker
    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = val.split('-');
      return `${d}/${m}/${y}`;
    }
    
    let clean = val.replace(/[^\d]/g, '');
    if (clean.length > 8) clean = clean.substring(0, 8);
    
    let formatted = clean;
    if (clean.length >= 3) {
      formatted = clean.substring(0, 2) + '/' + clean.substring(2);
    }
    if (clean.length >= 5) {
      formatted = formatted.substring(0, 5) + '/' + clean.substring(4);
    }
    return formatted;
  };

  const handleKeyPress = (key: string) => {
    if (activeInput === 'school') {
      setSearchTerm(prev => prev + key);
      setIsOpen(true);
    } else if (activeInput === 'roll') {
      setRollNumber(prev => prev + key);
    } else if (activeInput === 'dob') {
      setDob(prev => formatDob(prev + key));
    }
  };

  const handleBackspace = () => {
    if (activeInput === 'school') {
      setSearchTerm(prev => prev.slice(0, -1));
      setIsOpen(true);
    } else if (activeInput === 'roll') {
      setRollNumber(prev => prev.slice(0, -1));
    } else if (activeInput === 'dob') {
      setDob(prev => {
        const clean = prev.replace(/[^\d]/g, '');
        return formatDob(clean.slice(0, -1));
      });
    }
  };

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let authedUserId: string | null = null;

    try {
      if (!selectedSchoolId) throw new Error('Please select your school');
      if (!rollNumber.trim()) throw new Error('Please enter your roll number');
      if (!dob) throw new Error('Please select your date of birth');

      // convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
      let formattedDob = dob.trim();
      if (formattedDob.includes('/')) {
        const parts = formattedDob.split('/');
        if (parts.length === 3 && parts[2].length === 4) {
          formattedDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else if (formattedDob.includes('-')) {
        const parts = formattedDob.split('-');
        if (parts.length === 3 && parts[0].length !== 4) {
          formattedDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const loginRes = await fetch(`${apiUrl}/api/auth/student-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: selectedSchoolId,
          roll_number: rollNumber.trim(),
          dob: formattedDob
        })
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(`Login API Error: ${loginData.error || 'Authentication failed'}`);

      const { access_token, student } = loginData;
      
      setStudentToken(access_token);
      authedUserId = student.id;

      const devId = getDeviceId();
      const { data: isSessionValid, error: sessionError } = await supabase.rpc(
        'check_and_set_student_session',
        { p_student_id: student.id, p_device_id: devId }
      );

      if (sessionError) {
        throw new Error(`Session Check Error: ${sessionError.message} (Hint: ${sessionError.hint || 'none'})`);
      }
      if (!isSessionValid) {
        throw new Error(
          'This student is already logged in on another device. ' +
          'Please wait for the active session to expire or contact your administrator.'
        );
      }

      const { data: profile, error: profileError } = await supabase
        .from('students')
        .select('*')
        .eq('id', student.id)
        .single();

      if (profileError || !profile) {
        throw new Error(`Profile Error: ${profileError?.message || 'Not found'}`);
      }

      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', profile.exam_id)
        .single();

      if (examError) throw new Error(`Exam Fetch Error: ${examError.message} (Hint: ${examError.hint || 'No hint'})`);

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

      if (selectedAssignment.status === 'in_progress') {
        onLoginSuccess(profile, selectedExam, 'exam');
      } else {
        onLoginSuccess(profile, selectedExam, 'waiting_room');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || JSON.stringify(err));
      try {
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

      <div 
        className="flex-1 overflow-y-auto p-4 md:p-12 flex flex-col md:flex-row items-center justify-center max-w-6xl mx-auto w-full gap-8 md:gap-24"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#008080 rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="w-full max-w-sm flex flex-col shrink-0">
          <div className="bg-white w-full border border-[#E4E7EC] rounded-none shadow-xl shrink-0">
          <div className="bg-[#008080] py-3 px-4 text-center">
            <span className="text-white font-extrabold text-sm uppercase tracking-widest">CANDIDATE LOGIN</span>
          </div>

          <div className="p-5 sm:p-6">
              <form onSubmit={handleStudentAuth} className="space-y-4">
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
                        setActiveInput('school');
                      }}
                      onClick={() => {
                        setIsOpen(true);
                        setActiveInput('school');
                      }}
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
                      className="w-full px-3 py-2 bg-white border border-[#E4E7EC] rounded-none text-[#1D2939] placeholder-[#98A2B3] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] transition-all text-sm shadow-sm pr-24"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-10">
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSearchTerm('');
                            setSelectedSchoolId('');
                            if (activeInput === 'school') setIsOpen(true); // Re-open dropdown if typing
                          }}
                          className="p-1 text-[#98A2B3] hover:text-[#F04438] transition-colors focus:outline-none"
                          title="Clear field"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      )}
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-[#667085]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {isOpen && (
                      <div className="absolute z-[110] mt-1 w-full bg-white border border-[#E4E7EC] rounded-none shadow-lg max-h-60 overflow-y-auto">
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

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#667085] mb-2 uppercase tracking-wider">Roll Number / Application No</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        onFocus={() => setActiveInput('roll')}
                        onClick={() => setActiveInput('roll')}
                        required
                        placeholder="Enter your roll number"
                        className="w-full px-3 py-2 bg-white border border-[#E4E7EC] rounded-none text-[#1D2939] placeholder-[#98A2B3] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] transition-all text-sm shadow-sm pr-10"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {rollNumber && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setRollNumber('');
                            }}
                            className="p-1 text-[#98A2B3] hover:text-[#F04438] transition-colors focus:outline-none"
                            title="Clear field"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#667085] mb-2 uppercase tracking-wider">Date of Birth</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={dob}
                        onChange={(e) => setDob(formatDob(e.target.value))}
                        onFocus={() => setActiveInput('dob')}
                        onClick={() => setActiveInput('dob')}
                        required
                        placeholder="DD/MM/YYYY"
                        className="w-full px-3 py-2 bg-white border border-[#E4E7EC] rounded-none text-[#1D2939] placeholder-[#98A2B3] focus:outline-none focus:border-[#008080] focus:ring-1 focus:ring-[#008080] transition-all text-sm shadow-sm pr-16"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                        {dob && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDob('');
                            }}
                            className="p-1 text-[#98A2B3] hover:text-[#F04438] transition-colors focus:outline-none"
                            title="Clear field"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        )}
                        <div className="relative flex items-center justify-center w-7 h-7" title="Pick from Calendar">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#98A2B3] hover:text-[#008080] transition-colors"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          <input 
                            type="date"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                setDob(formatDob(val));
                                setActiveInput('dob');
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
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
                    className="w-full py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-none transition-colors disabled:opacity-50 text-sm uppercase tracking-wider shadow-sm"
                  >
                    {loading ? 'AUTHENTICATING...' : 'LOGIN'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Virtual Keyboard */}
        <div className="flex flex-col items-center justify-center shrink-0 mt-8 md:mt-0">
          <VirtualKeyboard 
            onKeyPress={handleKeyPress} 
            onBackspace={handleBackspace} 
          />
        </div>
      </div>

      <footer className="text-center py-4 text-[#667085] text-xs border-t border-[#E4E7EC] bg-white uppercase tracking-widest font-semibold shrink-0">
        v1.0.0 · ParikshaOS · Growtez
      </footer>
    </div>
  );
}
