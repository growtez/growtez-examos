'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SchoolRegistrationForm({ params, school, onSuccess }: { params: { school_id: string }, school: any, onSuccess: (roll: string) => void }) {
  const searchParams = useSearchParams();
  const pParam = searchParams.get('p');
  
  let courseParam: string | undefined, batchParam: string | undefined, sessionParam: string | undefined;
  if (pParam) {
    try {
      const decoded = JSON.parse(atob(pParam));
      courseParam = decoded.c;
      batchParam = decoded.b;
      sessionParam = decoded.s;
    } catch (e) {
      // Ignore if decoding fails
    }
  } else {
    // Fallback to legacy parameters just in case
    courseParam = searchParams.get('course') || undefined;
    batchParam = searchParams.get('batch') || undefined;
    sessionParam = searchParams.get('session') || undefined;
  }

  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [dob, setDob] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDobPassword = (dateStr: string) => {
    const parts = dateStr.split('-');
    return `${parts[2]}${parts[1]}${parts[0]}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      const dobStr = dob.replace(/-/g, '');
      const studentEmail = `${rollNumber.trim()}_${dobStr}@${params.school_id}.student.examos.local`;
      const studentPassword = formatDobPassword(dob);

      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: studentEmail,
          password: studentPassword,
          full_name: name,
          role: 'student',
          school_id: params.school_id,
          roll_number: rollNumber,
          date_of_birth: dob,
          course: courseParam || 'General',
          batch: batchParam || 'Main',
          session: sessionParam || '2026-27',
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      onSuccess(rollNumber);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-6">
        <p className="text-[#1a2e2e] text-sm font-medium text-center mb-4">
          Enter your details below to register as a student for {school.name}.
        </p>
        
        {(courseParam || batchParam || sessionParam) && (
          <div className="bg-[#f5f9f9] border border-[#b2d8d8] p-4 rounded-xl mb-6">
            <p className="text-[#1a2e2e] text-xs font-bold uppercase tracking-wider text-center mb-3">Registration Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {courseParam && (
                <div className="bg-white border border-[#e0f2f2] rounded-lg p-2.5 text-center shadow-sm">
                  <p className="text-[#8aacac] text-[10px] font-bold uppercase tracking-wider mb-0.5">Course</p>
                  <p className="text-[#008080] text-sm font-black">{courseParam}</p>
                </div>
              )}
              {batchParam && (
                <div className="bg-white border border-[#e0f2f2] rounded-lg p-2.5 text-center shadow-sm">
                  <p className="text-[#8aacac] text-[10px] font-bold uppercase tracking-wider mb-0.5">Batch</p>
                  <p className="text-[#008080] text-sm font-black">{batchParam}</p>
                </div>
              )}
              {sessionParam && (
                <div className="bg-white border border-[#e0f2f2] rounded-lg p-2.5 text-center shadow-sm">
                  <p className="text-[#8aacac] text-[10px] font-bold uppercase tracking-wider mb-0.5">Session</p>
                  <p className="text-[#008080] text-sm font-black">{sessionParam}</p>
                </div>
              )}
            </div>
            <p className="text-[#8aacac] text-[10px] text-center mt-3">These fields have been pre-filled by your school administrator.</p>
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#008080] mb-1.5 uppercase tracking-wider">Full Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#f0f7f7] border-2 border-[#b2d8d8] rounded-xl text-[#1a2e2e] placeholder-[#8aacac] focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-sm font-bold shadow-sm"
              placeholder="e.g. Aarav Patel" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-[#008080] mb-1.5 uppercase tracking-wider">Roll Number</label>
            <input type="text" required value={rollNumber} onChange={e => setRollNumber(e.target.value)}
              className="w-full px-4 py-3 bg-[#f0f7f7] border-2 border-[#b2d8d8] rounded-xl text-[#1a2e2e] placeholder-[#8aacac] focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-sm font-bold shadow-sm"
              placeholder="e.g. 2024001" />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#008080] mb-1.5 uppercase tracking-wider">Date of Birth</label>
            <input type="date" required value={dob} onChange={e => setDob(e.target.value)}
              className="w-full px-4 py-3 bg-[#f0f7f7] border-2 border-[#b2d8d8] rounded-xl text-[#1a2e2e] focus:outline-none focus:border-[#008080] focus:bg-white transition-all text-sm font-bold shadow-sm" />
            <p className="text-[#8aacac] text-[10px] font-bold mt-1.5 ml-1">Your DOB (DDMMYYYY) will be set as your password.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[#fff0f0] border-2 border-[#ffcccc] p-4 rounded-xl text-center">
          <p className="text-[#cc0000] text-sm font-bold">{error}</p>
        </div>
      )}

      <button type="submit" disabled={formLoading}
        className="w-full py-4 bg-[#008080] hover:bg-[#006666] text-white font-black uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_#004d4d] hover:shadow-[2px_2px_0px_#004d4d] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-[4px]">
        {formLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Processing...
          </span>
        ) : (
          'Register for School'
        )}
      </button>
    </form>
  );
}

export default function StudentSchoolRegistration({ params }: { params: { school_id: string } }) {
  const supabase = createClient();
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [registeredRoll, setRegisteredRoll] = useState('');

  useEffect(() => {
    const fetchSchool = async () => {
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .select('*')
        .eq('id', params.school_id)
        .single();
        
      if (!schoolError && schoolData) {
        setSchool(schoolData);
      }
      setLoading(false);
    };
    fetchSchool();
  }, [params.school_id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f9f9] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#008080] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#008080] font-bold tracking-wider uppercase text-sm">Loading Registration...</p>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-[#f5f9f9] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-[#b2d8d8] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#1a2e2e] mb-2 uppercase">School Not Found</h2>
          <p className="text-[#555555] text-sm">This registration link is invalid or the school does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f9f9] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#1a2e2e] tracking-tight uppercase mb-2">Parikshaos</h1>
          <p className="text-[#008080] font-bold text-sm tracking-widest uppercase">Student Portal</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white border-2 border-[#008080] shadow-[8px_8px_0px_#004d4d] mb-8">
          <div className="bg-[#008080] p-6 border-b-2 border-[#004d4d]">
            <h2 className="text-xl font-bold text-white uppercase tracking-wide leading-tight">Student Registration</h2>
            <p className="text-[#b3e0e0] text-sm mt-1 font-medium">{school.name}</p>
          </div>
          
          <div className="p-6 md:p-8">
            {success ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-[#e0f2f2] text-[#008080] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#008080]">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1a2e2e] mb-2 uppercase">Registration Successful!</h3>
                <p className="text-[#555555] text-sm mb-6">
                  You are now registered as a student at <strong>{school.name}</strong>.
                </p>
                <div className="bg-[#f5f9f9] border border-[#b2d8d8] p-4 text-left">
                  <p className="text-[#1a2e2e] text-xs font-bold mb-3 uppercase tracking-wider text-center">Your Login Credentials</p>
                  <div className="flex justify-between items-center mb-2 border-b border-[#e0f2f2] pb-2">
                    <span className="text-[#555555] text-sm font-medium">Username (Roll No):</span>
                    <span className="text-[#008080] font-bold font-mono bg-[#e0f2f2] px-2 py-0.5">{registeredRoll}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#555555] text-sm font-medium">Password:</span>
                    <span className="text-[#008080] font-bold font-mono bg-[#e0f2f2] px-2 py-0.5">Your DOB (DDMMYYYY)</span>
                  </div>
                </div>
                
                <div className="mt-8">
                  <Link href="/login" className="inline-block w-full py-3 bg-[#008080] hover:bg-[#006666] text-white font-bold uppercase tracking-wider rounded-lg text-center transition-colors">
                    Go to Login
                  </Link>
                </div>
              </div>
            ) : (
              <Suspense fallback={<div className="text-center text-sm font-bold text-[#008080]">Loading form...</div>}>
                <SchoolRegistrationForm 
                  params={params} 
                  school={school} 
                  onSuccess={(roll) => {
                    setRegisteredRoll(roll);
                    setSuccess(true);
                  }} 
                />
              </Suspense>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-[#8ab8b8] text-xs font-bold uppercase tracking-wider">
          Powered by Parikshaos
        </div>
      </div>
    </div>
  );
}
