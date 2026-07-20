import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface WaitingRoomProps {
  studentProfile: any;
  exam: any;
  onStartExam: () => void;
  serverTimeOffset: number;
}

export default function WaitingRoom({ studentProfile, exam, onStartExam, serverTimeOffset }: WaitingRoomProps) {
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
        .from('students')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('exam_id', exam.id)
        .eq('id', studentProfile.id);

      onStartExam();
    } catch (err) {
      console.error('Failed to start exam:', err);
      alert('Failed to start exam. Please try again.');
      setStarting(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#F9FAFB] flex flex-col font-sans text-[#1D2939]">
      {/* Top Header - White */}
      <header className="border-b border-[#008080] flex items-center justify-between bg-white px-6 h-[90px] shrink-0">
        <div className="flex items-center gap-3">
          <img src="/ParikshaOS_logo.png" alt="ParikshaOS Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-[#008080] text-[20px] font-extrabold tracking-widest m-0 leading-tight uppercase">ParikshaOS</h1>
            <p className="text-[9px] text-[#667085] uppercase tracking-wider font-semibold">Powered by Growtez</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="w-14 h-14 border border-[#E4E7EC] bg-[#F9FAFB] flex items-center justify-center rounded-none shadow-sm">
            <svg className="w-10 h-10 text-[#667085]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
          </div>
          <div className="flex flex-col text-right">
            <div className="text-[#1D2939] text-xs font-medium"><span className="text-[#667085]">Candidate Name :</span> <span className="text-[#1D2939] font-bold">[{studentProfile?.full_name}]</span></div>
            {exam && (
              <div className="text-[#1D2939] text-xs font-medium mt-0.5"><span className="text-[#667085]">Subject Name :</span> <span className="text-[#1D2939] font-bold">[{exam?.title}]</span></div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col animate-in fade-in duration-300"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#008080 rgba(0, 0, 0, 0.05)'
        }}
      >
        <div className="shrink-0 h-[2vh] md:h-[4vh] min-h-[10px]"></div>
        <div className="w-full max-w-2xl mx-auto bg-white border border-[#E4E7EC] rounded-none shadow-xl overflow-hidden shrink-0 mb-6">
          {/* Card Title Bar */}
          <div className="bg-[#008080] py-4 px-6 text-center">
            <span className="text-white font-extrabold text-sm uppercase tracking-widest">WAITING ROOM</span>
          </div>

          <div className="p-8">
            <div className="text-center mb-8 border-b border-[#E4E7EC] pb-6">
              <h1 className="text-2xl font-extrabold text-[#1D2939] mb-2 uppercase tracking-wider">{exam?.title}</h1>
              <p className="text-[#667085] text-sm font-medium">Duration: <span className="font-bold text-[#008080]">{exam?.duration_minutes} minutes</span></p>
            </div>

            {/* Countdown Area */}
            <div className="bg-[#F9FAFB] border border-[#E4E7EC] rounded-none p-8 text-center mb-8 shadow-sm">
              {isEnded ? (
                <div>
                  <div className="text-[#F04438] text-lg font-extrabold mb-2 uppercase tracking-wide">⚠ This Examination Has Ended</div>
                  <p className="text-[#667085] text-sm">The scheduled end time has passed. You can no longer start this exam.</p>
                </div>
              ) : canStart ? (
                <div>
                  <div className="text-[#008080] text-lg font-extrabold mb-4 uppercase tracking-wide">✓ Exam Has Started!</div>
                  <button
                    onClick={handleStartClick}
                    disabled={starting}
                    className="px-8 py-3 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-none transition-all uppercase tracking-wider shadow-sm disabled:opacity-50"
                  >
                    {starting ? 'STARTING...' : 'START EXAM NOW'}
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="text-[#667085] text-xs font-bold mb-5 uppercase tracking-widest">Starts In</h3>
                  <div className="flex justify-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-[#008080] flex items-center justify-center text-3xl font-extrabold text-white rounded-none shadow-md hover:scale-105 transition-transform">
                        {String(timeLeft?.hours || 0).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] text-[#667085] mt-2 font-bold uppercase tracking-wider">HOURS</span>
                    </div>
                    <div className="text-3xl font-bold text-[#008080] self-start mt-3">:</div>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-[#008080] flex items-center justify-center text-3xl font-extrabold text-white rounded-none shadow-md hover:scale-105 transition-transform">
                        {String(timeLeft?.minutes || 0).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] text-[#667085] mt-2 font-bold uppercase tracking-wider">MINS</span>
                    </div>
                    <div className="text-3xl font-bold text-[#008080] self-start mt-3">:</div>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-[#008080] flex items-center justify-center text-3xl font-extrabold text-white rounded-none shadow-md hover:scale-105 transition-transform">
                        {String(timeLeft?.seconds || 0).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] text-[#667085] mt-2 font-bold uppercase tracking-wider">SECS</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rules and Tips */}
            <div className="border-t border-[#E4E7EC] pt-6">
              <div className="border-l-4 border-[#008080] pl-3 mb-4">
                <h3 className="text-sm font-extrabold text-[#1D2939] uppercase tracking-wider">Important Instructions</h3>
              </div>
              <ul className="space-y-3">
                {/* General Instructions */}
                <li className="flex gap-3 text-sm text-[#667085] font-medium">
                  <span className="text-[#008080] font-bold mt-0.5">▸</span>
                  Do not refresh the page or close the application once the exam has started.
                </li>
                <li className="flex gap-3 text-sm text-[#667085] font-medium">
                  <span className="text-[#008080] font-bold mt-0.5">▸</span>
                  The timer will run continuously. If you get disconnected, your time will keep running on the server.
                </li>
                <li className="flex gap-3 text-sm text-[#667085] font-medium">
                  <span className="text-[#008080] font-bold mt-0.5">▸</span>
                  Your answers are automatically saved as you select them.
                </li>
                <li className="flex gap-3 text-sm text-[#667085] font-medium">
                  <span className="text-[#008080] font-bold mt-0.5">▸</span>
                  Once the exam end time is reached, it will be automatically submitted regardless of your progress.
                </li>

                {/* Custom Exam-Specific Instructions */}
                {exam?.exam_instructions && exam.exam_instructions.map((inst: string, idx: number) => (
                  <li key={idx} className="flex gap-3 text-sm text-[#667085] font-medium">
                    <span className="text-[#008080] font-bold mt-0.5">▸</span>
                    {inst}
                  </li>
                ))}
              </ul>
            </div>


          </div>
        </div>
        <div className="shrink-0 h-[2vh] md:h-[4vh] min-h-[10px]"></div>
      </main>
    </div>
  );
}
