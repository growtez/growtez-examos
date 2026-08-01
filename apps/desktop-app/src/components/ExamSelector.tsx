import { useState } from 'react';

interface StudentAssignment {
  student_id: string;
  student_status: 'assigned' | 'in_progress' | 'submitted';
  started_at: string | null;
  full_name: string;
  roll_number: string;
  exams: {
    id: string;
    title: string;
    description: string | null;
    duration_minutes: number;
    start_time: string | null;
    end_time: string | null;
    status: 'published' | 'active' | 'draft' | 'completed';
  } | null;
}

interface ExamSelectorProps {
  assignments: StudentAssignment[];
  onExamSelected: (studentId: string) => void;
  loading: boolean;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function StatusBadge({ status, studentStatus }: { status: string; studentStatus: string }) {
  if (studentStatus === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 rounded-none">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
        In Progress
      </span>
    );
  }
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
        Live Now
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#008080]/10 text-[#008080] border border-[#008080]/20 rounded-none">
      <span className="w-1.5 h-1.5 rounded-full bg-[#008080] inline-block" />
      Scheduled
    </span>
  );
}

export default function ExamSelector({ assignments, onExamSelected, loading }: ExamSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleProceed = () => {
    if (selectedId) onExamSelected(selectedId);
  };

  const handleCloseApp = async () => {
    try {
      const { appWindow } = await import('@tauri-apps/api/window');
      await appWindow.close();
    } catch (e) {
      console.error('[KioskMode] Failed to close application window.', e);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#F9FAFB] font-sans text-[#1D2939]">

      {/* Header */}
      <header className="border-b border-[#008080] flex items-center justify-between bg-white px-6 h-[90px] shrink-0">
        <div className="flex items-center gap-3">
          <img src="/ParikshaOS_logo.png" alt="ParikshaOS Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-[#008080] text-[20px] font-extrabold tracking-widest m-0 leading-tight">ParikshaOS</h1>
            <p className="text-[9px] text-[#667085] uppercase tracking-wider font-semibold">Powered by Growtez</p>
          </div>
        </div>
        <button
          onClick={handleCloseApp}
          className="flex items-center gap-2 px-4 py-2 bg-[#F04438] hover:bg-[#d13b30] active:bg-[#b83029] text-white font-bold rounded-none transition-all text-xs uppercase tracking-wider shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Exit Application
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col items-center">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#008080]/10 border-2 border-[#008080]/20 mb-4">
            <svg className="w-7 h-7 text-[#008080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-[#1D2939] text-xl font-extrabold uppercase tracking-wider mb-1">
            Select Your Exam
          </h2>
          <p className="text-[#667085] text-sm font-medium">
            Welcome, <span className="text-[#1D2939] font-bold">{assignments[0]?.full_name}</span>.
            You are assigned to {assignments.length} exam{assignments.length > 1 ? 's' : ''}.
            Choose one to proceed.
          </p>
        </div>

        {/* Exam Cards */}
        <div className="w-full max-w-2xl flex flex-col gap-4">
          {assignments.map((a) => {
            if (!a.exams) return null;
            const isSelected = selectedId === a.student_id;
            const isInProgress = a.student_status === 'in_progress';

            return (
              <button
                key={a.student_id}
                onClick={() => setSelectedId(a.student_id)}
                className={`
                  w-full text-left border-2 bg-white shadow-sm transition-all duration-150
                  focus:outline-none active:scale-[0.99]
                  ${isSelected
                    ? 'border-[#008080] shadow-[0_0_0_3px_rgba(0,128,128,0.12)]'
                    : 'border-[#E4E7EC] hover:border-[#008080]/40 hover:shadow-md'
                  }
                `}
              >
                <div className="p-5">
                  {/* Top row: title + badge */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Radio indicator */}
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                        ${isSelected ? 'border-[#008080] bg-[#008080]' : 'border-[#D0D5DD] bg-white'}
                      `}>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-[#1D2939] font-extrabold text-base leading-tight truncate">
                        {a.exams.title}
                      </span>
                    </div>
                    <StatusBadge status={a.exams.status} studentStatus={a.student_status} />
                  </div>

                  {/* Description */}
                  {a.exams.description && (
                    <p className="text-[#667085] text-xs mb-3 pl-8 leading-relaxed line-clamp-2">
                      {a.exams.description}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-4 pl-8 text-[11px] text-[#667085] font-semibold uppercase tracking-wider">
                    {/* Duration */}
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#008080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="12" cy="12" r="10" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                      </svg>
                      {a.exams.duration_minutes} min
                    </span>

                    {/* Start time */}
                    {a.exams.start_time && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#008080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Starts: {formatDateTime(a.exams.start_time)}
                      </span>
                    )}

                    {/* Roll number */}
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#008080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Roll: {a.roll_number}
                    </span>

                    {/* In-progress hint */}
                    {isInProgress && (
                      <span className="flex items-center gap-1.5 text-amber-600">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Resume exam
                      </span>
                    )}
                  </div>
                </div>

                {/* Selected bottom bar */}
                {isSelected && (
                  <div className="h-1 bg-[#008080] w-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Proceed Button */}
        <div className="mt-8 w-full max-w-2xl">
          <button
            onClick={handleProceed}
            disabled={!selectedId || loading}
            className="w-full py-3.5 bg-[#008080] hover:bg-[#006666] active:bg-[#005555] text-white font-extrabold text-sm uppercase tracking-widest rounded-none shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Authenticating...
              </>
            ) : (
              <>
                Proceed to Exam
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      <footer className="text-center py-4 text-[#667085] text-xs border-t border-[#E4E7EC] bg-white uppercase tracking-widest font-semibold shrink-0">
        v1.0.0 · ParikshaOS · Growtez
      </footer>
    </div>
  );
}
