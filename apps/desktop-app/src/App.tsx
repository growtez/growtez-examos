import { useState } from 'react';
import Login from './components/Login';
import ExamInterface from './components/ExamInterface';
import WaitingRoom from './components/WaitingRoom';

type Step = 'login' | 'waiting_room' | 'exam' | 'submitted';

function App() {
  const [step, setStep] = useState<Step>('login');
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);

  const handleLoginSuccess = async (profile: any, exam: any, initialStep: Step = 'exam') => {
    try {
      const { supabase } = await import('./lib/supabase');
      const { data, error } = await supabase.rpc('get_server_time');
      if (!error && data) {
        const serverTime = new Date(data).getTime();
        const localTime = Date.now();
        setServerTimeOffset(serverTime - localTime);
      }
    } catch (e) {
      console.error('Failed to sync server time', e);
    }
    
    setStudentProfile(profile);
    setSelectedExam(exam);
    setStep(initialStep);
  };

  const handleExamSubmitted = () => {
    setStep('submitted');
  };

  const handleStartFromWaitingRoom = () => {
    setStep('exam');
  };

  const handleReset = () => {
    setStudentProfile(null);
    setSelectedExam(null);
    setStep('login');
  };

  if (step === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} serverTimeOffset={serverTimeOffset} />;
  }

  if (step === 'waiting_room') {
    return (
      <WaitingRoom 
        studentProfile={studentProfile} 
        exam={selectedExam} 
        onStartExam={handleStartFromWaitingRoom} 
        onGoBack={handleReset} 
        serverTimeOffset={serverTimeOffset}
      />
    );
  }

  if (step === 'exam') {
    return (
      <ExamInterface
        studentProfile={studentProfile}
        exam={selectedExam}
        onExamSubmitted={handleExamSubmitted}
        serverTimeOffset={serverTimeOffset}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f9f9] px-4 font-sans text-[#1a2e2e]">
      <div className="w-full max-w-md bg-white border-2 border-[#008080] shadow-[4px_4px_0px_#004d4d] text-center">
        {/* Header bar */}
        <div className="bg-[#008080] px-8 py-3">
          <span className="text-white font-extrabold text-sm uppercase tracking-widest">Submission Complete</span>
        </div>
        <div className="p-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#e0f2f2] border-2 border-[#008080] text-[#008080] mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-[#1a2e2e] mb-2 uppercase tracking-wide">Test Submitted Successfully!</h2>
          <p className="text-[#555555] text-sm mb-6">
            Your answers have been uploaded. You can safely close this application or return to the login screen.
          </p>
          <button
            onClick={handleReset}
            className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white font-bold transition-colors text-sm uppercase tracking-wider border-b-4 border-[#004d4d] active:border-b-0 active:translate-y-1"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
