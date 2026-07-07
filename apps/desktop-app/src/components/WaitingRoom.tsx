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
    <div className="min-h-screen bg-[#070b13] flex flex-col font-sans text-slate-100">
      {/* Header */}
      <header className="bg-[#111827] border-b border-slate-800 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#475fa6] text-white rounded-lg flex items-center justify-center font-bold">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-bold text-white tracking-wide">ParikshaOS</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm">
            {studentProfile?.full_name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium">{studentProfile?.full_name}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{exam?.title}</h1>
            <p className="text-slate-400">Duration: {exam?.duration_minutes} minutes</p>
          </div>

          {/* Countdown Area */}
          <div className="bg-[#0f1420] border border-slate-800 rounded-2xl p-6 text-center mb-8">
            {isEnded ? (
              <div>
                <div className="text-red-400 text-xl font-bold mb-2">This Examination Has Ended</div>
                <p className="text-slate-400 text-sm">The scheduled end time has passed. You can no longer start this exam.</p>
              </div>
            ) : canStart ? (
              <div>
                <div className="text-emerald-400 text-xl font-bold mb-4">The exam has started!</div>
                <button
                  onClick={handleStartClick}
                  disabled={starting}
                  className="px-8 py-3 bg-[#475fa6] hover:bg-[#394c86] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
                >
                  {starting ? 'Starting...' : 'Start Exam Now'}
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wider">Starts In</h3>
                <div className="flex justify-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#1a2235] border border-slate-700 rounded-xl flex items-center justify-center text-3xl font-bold text-white shadow-inner">
                      {String(timeLeft?.hours || 0).padStart(2, '0')}
                    </div>
                    <span className="text-xs text-slate-500 mt-2 font-medium">HOURS</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-600 self-start mt-3">:</div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#1a2235] border border-slate-700 rounded-xl flex items-center justify-center text-3xl font-bold text-white shadow-inner">
                      {String(timeLeft?.minutes || 0).padStart(2, '0')}
                    </div>
                    <span className="text-xs text-slate-500 mt-2 font-medium">MINS</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-600 self-start mt-3">:</div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#1a2235] border border-slate-700 rounded-xl flex items-center justify-center text-3xl font-bold text-white shadow-inner">
                      {String(timeLeft?.seconds || 0).padStart(2, '0')}
                    </div>
                    <span className="text-xs text-slate-500 mt-2 font-medium">SECS</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rules and Tips */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#475fa6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Important Instructions
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm text-slate-300">
                <span className="text-[#475fa6] mt-0.5">•</span>
                Do not refresh the page or close the application once the exam has started.
              </li>
              <li className="flex gap-3 text-sm text-slate-300">
                <span className="text-[#475fa6] mt-0.5">•</span>
                The timer will run continuously. If you get disconnected, your time will keep running on the server.
              </li>
              <li className="flex gap-3 text-sm text-slate-300">
                <span className="text-[#475fa6] mt-0.5">•</span>
                Your answers are automatically saved as you select them.
              </li>
              <li className="flex gap-3 text-sm text-slate-300">
                <span className="text-[#475fa6] mt-0.5">•</span>
                Once the exam end time is reached, it will be automatically submitted regardless of your progress.
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <button onClick={onGoBack} className="text-sm text-slate-400 hover:text-white transition-colors">
              &larr; Go back to dashboard
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
