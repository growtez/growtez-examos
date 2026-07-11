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
    <div 
      className="h-screen w-screen flex items-center justify-center bg-[#F9FAFB] px-4 py-8 font-sans text-[#1D2939] overflow-y-auto"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#008080 rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="w-full max-w-md bg-white border border-[#E4E7EC] rounded-none shadow-xl overflow-hidden text-center">
        {/* Header bar */}
        <div className="bg-[#008080] py-4 px-6">
          <span className="text-white font-extrabold text-sm uppercase tracking-widest">Submission Complete</span>
        </div>
        <div className="p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#12B76A]/10 border border-[#12B76A]/20 rounded-none text-[#12B76A] mb-4 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-[#1D2939] mb-2 uppercase tracking-wider">Test Submitted Successfully!</h2>
          <p className="text-[#667085] text-sm mb-6 font-medium">
            Your answers have been uploaded. You can safely close this application or return to the login screen.
          </p>
          <button
            onClick={handleReset}
            className="w-full py-3 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-none transition-colors text-sm uppercase tracking-wider shadow-sm"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
