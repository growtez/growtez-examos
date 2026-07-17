import { useState, useEffect } from 'react';
import Login from './components/Login';
import ExamInterface from './components/ExamInterface';
import WaitingRoom from './components/WaitingRoom';
import { supabase } from './lib/supabase';
import { getDeviceId } from './lib/deviceId';
import parikshaLogo from '../public/ParikshaOS_logo.png';

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
 * The session-aware version inside App handles clearing the DB session first.
 */
const closeAppWindow = async () => {
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

  // ── Session Heartbeat ───────────────────────────────────────────────────────
  // Sends a heartbeat every 20 seconds to keep the single-session lock alive.
  // Stops when the student is on the login or submitted screen.
  useEffect(() => {
    if (!studentProfile?.id || step === 'login' || step === 'submitted') return;

    const devId = getDeviceId();
    const interval = setInterval(async () => {
      try {
        const { data: isSuccess, error } = await supabase.rpc('heartbeat_student_session', {
          p_student_id: studentProfile.id,
          p_device_id: devId,
        });
        if (error || !isSuccess) {
          console.warn('[Session] Heartbeat failed — session may have been taken over or expired.');
        }
      } catch (e) {
        console.error('[Session] Failed to send heartbeat', e);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [studentProfile, step]);

  // ── Session-aware app close ─────────────────────────────────────────────────
  const handleCloseApp = async () => {
    try {
      if (studentProfile?.id) {
        await supabase.rpc('clear_student_session', {
          p_student_id: studentProfile.id,
          p_device_id: getDeviceId(),
        });
      }
    } catch (e) {
      console.warn('[Session] Failed to clear session on close:', e);
    }
    await closeAppWindow();
  };

  const handleLoginSuccess = async (profile: any, exam: any, initialStep: Step = 'exam') => {
    try {
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
    <div className="h-screen w-screen flex flex-col items-center justify-center font-sans overflow-hidden relative bg-white">
      {/* Decorative background circles */}
      <div className="absolute top-[-80px] left-[-80px] w-64 h-64 rounded-full bg-[#008080]/5" />
      <div className="absolute bottom-[-60px] right-[-60px] w-80 h-80 rounded-full bg-[#008080]/5" />
      <div className="absolute top-1/2 left-[-120px] w-48 h-48 rounded-full bg-[#008080]/5" />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-lg">

        {/* Logo at the top (bigger, w-36 h-36) */}
        <div className="mb-6">
          <img src={parikshaLogo} alt="ParikshaOS Logo" className="w-36 h-36 object-contain" />
        </div>

        {/* Success icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#008080]/10 border-2 border-[#008080]/30 mb-6 shadow-sm">
          <svg className="w-10 h-10 text-[#008080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-[#1D2939] text-2xl font-extrabold uppercase tracking-wider mb-3">Exam Submitted!</h2>

        {/* Thank you message */}
        <p className="text-[#344054] text-base font-medium mb-2 leading-relaxed">
          Thank you for using <span className="font-bold text-[#008080]">ParikshaOS</span>.
        </p>
        <p className="text-[#667085] text-sm mb-8 leading-relaxed">
          Your answers have been securely saved and uploaded.<br />
          You may now close this application.
        </p>

        {/* Close button */}
        <button
          id="close-application-btn"
          onClick={handleCloseApp}
          className="flex items-center gap-2 px-10 py-3 bg-[#008080] hover:bg-[#006666] text-white font-extrabold text-sm uppercase tracking-widest rounded-none shadow-lg active:scale-95 transition-all mb-10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Close Application
        </button>

        {/* Footer with Text Logo */}
        <div className="flex flex-col items-center gap-1 mt-4">
          <h1 className="text-[#008080] text-lg font-black tracking-widest uppercase leading-none">ParikshaOS</h1>
          <p className="text-[#667085] text-[10px] uppercase tracking-widest font-semibold leading-none">Powered by Growtez</p>
          <p className="text-[#98A2B3] text-[9px] uppercase tracking-widest mt-2 font-semibold">
            &copy; {new Date().getFullYear()} Growtez · All Rights Reserved
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;
