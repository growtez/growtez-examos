import { useState, useEffect } from 'react';
import Login from './components/Login';
import ExamInterface from './components/ExamInterface';
import WaitingRoom from './components/WaitingRoom';

type Step = 'login' | 'waiting_room' | 'exam' | 'submitted';

/**
 * Activates kiosk-mode OS-level protections when the student moves past the login screen.
 * Window decorations and always-on-top are already enforced from startup via tauri.conf.json.
 * This call triggers the Rust keyboard hook and anti-cheat monitor.
 */
const activateKioskMode = async () => {
  try {
    const { invoke } = await import('@tauri-apps/api/tauri');
    await invoke('enable_kiosk_mode');
  } catch (e) {
    // Running in browser dev mode — Tauri APIs not available, silently skip.
    console.info('[KioskMode] Tauri APIs unavailable, skipping kiosk activation.', e);
  }
};

/**
 * Closes the application via Tauri's window API.
 * Only callable after exam submission when all data has been saved.
 */
const handleCloseApp = async () => {
  try {
    const { appWindow } = await import('@tauri-apps/api/window');
    await appWindow.close();
  } catch (e) {
    console.error('[KioskMode] Failed to close application window.', e);
  }
};

function App() {
  const [step, setStep] = useState<Step>('login');
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  // Tracks whether JS-level keyboard blocking is active (after login)
  const [kioskActive, setKioskActive] = useState(false);

  // ── Global JS keyboard blocker ─────────────────────────────────────────────
  // Runs as a second layer on top of the Rust WH_KEYBOARD_LL hook.
  // Prevents any in-browser keyboard input once the student leaves the login screen.
  useEffect(() => {
    if (!kioskActive) return;
    const blockKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', blockKey, true);
    window.addEventListener('keyup', blockKey, true);
    window.addEventListener('keypress', blockKey, true);
    return () => {
      window.removeEventListener('keydown', blockKey, true);
      window.removeEventListener('keyup', blockKey, true);
      window.removeEventListener('keypress', blockKey, true);
    };
  }, [kioskActive]);

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
    
    // Activate OS-level kiosk mode (Rust hook) and JS-level keyboard block.
    await activateKioskMode();
    setKioskActive(true);
    
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


  if (step === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} serverTimeOffset={serverTimeOffset} />;
  }

  if (step === 'waiting_room') {
    return (
      <WaitingRoom 
        studentProfile={studentProfile} 
        exam={selectedExam} 
        onStartExam={handleStartFromWaitingRoom}
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

  // ── Submission Complete Screen ─────────────────────────────────────────────
  return (
    <div 
      className="h-screen w-screen flex items-center justify-center bg-[#F9FAFB] px-4 py-8 font-sans text-[#1D2939] overflow-y-auto"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#008080 rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="w-full max-w-md bg-white border border-[#E4E7EC] rounded-xl shadow-xl overflow-hidden text-center">
        {/* Header bar */}
        <div className="bg-[#008080] py-4 px-6">
          <span className="text-white font-extrabold text-sm uppercase tracking-widest">Submission Complete</span>
        </div>
        <div className="p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#12B76A]/10 border border-[#12B76A]/20 rounded-full text-[#12B76A] mb-4 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-[#1D2939] mb-2 uppercase tracking-wider">Test Submitted Successfully!</h2>
          <p className="text-[#667085] text-sm mb-6 font-medium">
            Your answers have been uploaded. You may now safely close this application.
          </p>
          <button
            id="close-application-btn"
            onClick={handleCloseApp}
            className="w-full py-3 bg-[#F04438] hover:bg-[#d13b30] active:bg-[#b83029] text-white font-bold rounded-lg transition-colors text-sm uppercase tracking-wider shadow-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close Application
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
