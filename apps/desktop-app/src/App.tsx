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
    <div className="min-h-screen flex items-center justify-center bg-[#070b13] px-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Test Submitted Successfully!</h2>
        <p className="text-slate-400 text-sm mb-6">
          Your answers have been uploaded. You can safely close this application or return to the login screen.
        </p>
        <button
          onClick={handleReset}
          className="w-full py-3 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors text-sm"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}

export default App;
