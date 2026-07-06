import { useState } from 'react';
import Login from './components/Login';
import ExamInterface from './components/ExamInterface';

type Step = 'login' | 'exam' | 'submitted';

function App() {
  const [step, setStep] = useState<Step>('login');
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);

  const handleLoginSuccess = (profile: any, exam: any) => {
    setStudentProfile(profile);
    setSelectedExam(exam);
    setStep('exam');
  };

  const handleExamSubmitted = () => {
    setStep('submitted');
  };

  const handleReset = () => {
    setStudentProfile(null);
    setSelectedExam(null);
    setStep('login');
  };

  if (step === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (step === 'exam') {
    return (
      <ExamInterface
        studentProfile={studentProfile}
        exam={selectedExam}
        onExamSubmitted={handleExamSubmitted}
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
