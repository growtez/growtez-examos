import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface WaitingRoomProps {
  studentProfile: any;
  exam: any;
  onStartExam: () => void;
  onGoBack: () => void;
  serverTimeOffset: number;
}

export default function WaitingRoom({ studentProfile, exam, onStartExam, onGoBack, serverTimeOffset }: WaitingRoomProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [canStart, setCanStart] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!exam) return;

    const calculateTime = () => {
      const now = new Date(Date.now() + serverTimeOffset);
      const startTime = exam.start_time ? new Date(exam.start_time) : now;
      const endTime = exam.end_time ? new Date(exam.end_time) : null;

      if (endTime && now > endTime) {
        setIsEnded(true);
        setCanStart(false);
        setTimeLeft(null);
        return;
      }

      if (now >= startTime) {
        setCanStart(true);
        setTimeLeft(null);
        return;
      }

      const diff = startTime.getTime() - now.getTime();
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
      setCanStart(false);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [exam]);

  const handleStartClick = async () => {
    setStarting(true);
    try {
      // Update student exam status to 'in_progress'
      await supabase
        .from('exam_students')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('exam_id', exam.id)
        .eq('student_id', studentProfile.id);

      onStartExam();
    } catch (err) {
      console.error('Failed to start exam:', err);
      alert('Failed to start exam. Please try again.');
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f9f9] flex flex-col font-sans text-[#1a2e2e]">
      {/* Header */}
      <header className="bg-white border-b-2 border-[#008080] py-4 px-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#008080] flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <span className="font-extrabold text-[#1a2e2e] tracking-wide uppercase text-sm">ParikshaOS</span>
            <p className="text-[10px] text-[#555555] uppercase tracking-widest">Powered by Growtez</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#008080] flex items-center justify-center font-bold text-sm text-white">
            {studentProfile?.full_name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-[#1a2e2e]">{studentProfile?.full_name}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl bg-white border-2 border-[#008080] shadow-[4px_4px_0px_#004d4d]">
          {/* Card Title Bar */}
          <div className="bg-[#008080] px-6 py-3">
            <span className="text-white font-extrabold text-sm uppercase tracking-widest">WAITING ROOM</span>
          </div>

          <div className="p-8">
          <div className="text-center mb-8 border-b border-[#b2d8d8] pb-6">
            <h1 className="text-2xl font-extrabold text-[#1a2e2e] mb-1 uppercase tracking-wide">{exam?.title}</h1>
            <p className="text-[#555555] text-sm">Duration: <span className="font-bold text-[#008080]">{exam?.duration_minutes} minutes</span></p>
          </div>

          {/* Countdown Area */}
          <div className="bg-[#f5f9f9] border-2 border-[#b2d8d8] p-6 text-center mb-8">
            {isEnded ? (
              <div>
                <div className="text-red-600 text-lg font-extrabold mb-2 uppercase">⚠ This Examination Has Ended</div>
                <p className="text-[#555555] text-sm">The scheduled end time has passed. You can no longer start this exam.</p>
              </div>
            ) : canStart ? (
              <div>
                <div className="text-[#008080] text-lg font-extrabold mb-4 uppercase tracking-wide">✓ Exam Has Started!</div>
                <button
                  onClick={handleStartClick}
                  disabled={starting}
                  className="px-8 py-3 bg-[#008080] hover:bg-[#006666] text-white font-extrabold transition-all border-b-4 border-[#004d4d] uppercase tracking-wider disabled:opacity-50 active:border-b-0 active:translate-y-1"
                >
                  {starting ? 'STARTING...' : 'START EXAM NOW'}
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-[#555555] text-xs font-bold mb-5 uppercase tracking-widest">Starts In</h3>
                <div className="flex justify-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#008080] border-2 border-[#006666] flex items-center justify-center text-3xl font-extrabold text-white shadow-[2px_2px_0px_#004d4d]">
                      {String(timeLeft?.hours || 0).padStart(2, '0')}
                    </div>
                    <span className="text-xs text-[#555555] mt-2 font-bold uppercase">HOURS</span>
                  </div>
                  <div className="text-3xl font-bold text-[#008080] self-start mt-3">:</div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#008080] border-2 border-[#006666] flex items-center justify-center text-3xl font-extrabold text-white shadow-[2px_2px_0px_#004d4d]">
                      {String(timeLeft?.minutes || 0).padStart(2, '0')}
                    </div>
                    <span className="text-xs text-[#555555] mt-2 font-bold uppercase">MINS</span>
                  </div>
                  <div className="text-3xl font-bold text-[#008080] self-start mt-3">:</div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#008080] border-2 border-[#006666] flex items-center justify-center text-3xl font-extrabold text-white shadow-[2px_2px_0px_#004d4d]">
                      {String(timeLeft?.seconds || 0).padStart(2, '0')}
                    </div>
                    <span className="text-xs text-[#555555] mt-2 font-bold uppercase">SECS</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rules and Tips */}
          <div className="border-t border-[#b2d8d8] pt-6">
            <div className="border-l-4 border-[#008080] pl-3 mb-4">
              <h3 className="text-sm font-extrabold text-[#1a2e2e] uppercase tracking-wide">Important Instructions</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-[#333333]">
                <span className="text-[#008080] font-bold mt-0.5">▸</span>
                Do not refresh the page or close the application once the exam has started.
              </li>
              <li className="flex gap-3 text-sm text-[#333333]">
                <span className="text-[#008080] font-bold mt-0.5">▸</span>
                The timer will run continuously. If you get disconnected, your time will keep running on the server.
              </li>
              <li className="flex gap-3 text-sm text-[#333333]">
                <span className="text-[#008080] font-bold mt-0.5">▸</span>
                Your answers are automatically saved as you select them.
              </li>
              <li className="flex gap-3 text-sm text-[#333333]">
                <span className="text-[#008080] font-bold mt-0.5">▸</span>
                Once the exam end time is reached, it will be automatically submitted regardless of your progress.
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-[#b2d8d8] text-center">
            <button onClick={onGoBack} className="text-sm text-[#8aacac] hover:text-[#008080] font-medium transition-colors uppercase tracking-wide">
              &larr; Go back to login
            </button>
          </div>

          </div>
        </div>
      </main>
    </div>
  );
}
