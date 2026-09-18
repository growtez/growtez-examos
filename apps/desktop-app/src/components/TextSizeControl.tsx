export const FONT_SCALE_LEVELS = [0.60, 0.75, 0.90, 1.00, 1.15, 1.30];
export const DEFAULT_FONT_SCALE = 1.00;
export const MIN_FONT_SCALE = 0.60;
export const MAX_FONT_SCALE = 1.30;

interface TextSizeControlProps {
  scale: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onReset: () => void;
  variant?: 'teal' | 'light';
  className?: string;
}

export default function TextSizeControl({
  scale,
  onIncrease,
  onDecrease,
  onReset,
  variant = 'teal',
  className = '',
}: TextSizeControlProps) {
  const percentage = Math.round(scale * 100);
  const isMin = scale <= MIN_FONT_SCALE + 0.001;
  const isMax = scale >= MAX_FONT_SCALE - 0.001;

  if (variant === 'teal') {
    return (
      <div
        className={`inline-flex items-center bg-[#195e5e] border border-[#144949] shadow-sm h-[32px] px-1.5 gap-1 select-none ${className}`}
        role="group"
        aria-label="Text Size Controls"
      >
        <span className="text-[11px] font-bold text-white/90 mr-1 hidden sm:inline-flex items-center gap-1">
          <svg className="w-3.5 h-3.5 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
          </svg>
          Text:
        </span>

        {/* Decrease Button (A-) */}
        <button
          type="button"
          onClick={onDecrease}
          disabled={isMin}
          title={isMin ? `Minimum size limit reached (${percentage}%)` : 'Decrease text size (A-)'}
          aria-label="Decrease text size"
          className={`h-6 px-1.5 min-w-[26px] flex items-center justify-center font-bold text-xs rounded-none border border-white/10 transition-all ${
            isMin
              ? 'bg-[#004d4d]/50 text-white/30 cursor-not-allowed'
              : 'bg-[#004d4d] hover:bg-[#003333] active:bg-[#002222] text-white cursor-pointer active:scale-95'
          }`}
        >
          A-
        </button>

        {/* Reset / Current Size Indicator */}
        <button
          type="button"
          onClick={onReset}
          title={`Current size: ${percentage}%. Click to reset to 100% default.`}
          aria-label={`Reset text size (current: ${percentage}%)`}
          className="h-6 px-2 min-w-[42px] flex items-center justify-center font-bold text-[11px] rounded-none border border-white/10 bg-[#004d4d] hover:bg-[#003333] active:bg-[#002222] text-white transition-all cursor-pointer"
        >
          {percentage}%
        </button>

        {/* Increase Button (A+) */}
        <button
          type="button"
          onClick={onIncrease}
          disabled={isMax}
          title={isMax ? `Maximum size limit reached (${percentage}%)` : 'Increase text size (A+)'}
          aria-label="Increase text size"
          className={`h-6 px-1.5 min-w-[26px] flex items-center justify-center font-bold text-xs rounded-none border border-white/10 transition-all ${
            isMax
              ? 'bg-[#004d4d]/50 text-white/30 cursor-not-allowed'
              : 'bg-[#004d4d] hover:bg-[#003333] active:bg-[#002222] text-white cursor-pointer active:scale-95'
          }`}
        >
          A+
        </button>
      </div>
    );
  }

  // Light variant (e.g. for Question Header or light backgrounds)
  return (
    <div
      className={`inline-flex items-center bg-[#F9FAFB] border border-[#D0D5DD] shadow-sm h-[28px] px-1 gap-1 select-none rounded-none ${className}`}
      role="group"
      aria-label="Text Size Controls"
    >
      <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider mr-1 hidden sm:inline-flex items-center gap-1">
        Size:
      </span>

      {/* Decrease Button (A-) */}
      <button
        type="button"
        onClick={onDecrease}
        disabled={isMin}
        title={isMin ? `Minimum size limit reached (${percentage}%)` : 'Decrease text size (A-)'}
        aria-label="Decrease text size"
        className={`h-5 px-1.5 min-w-[24px] flex items-center justify-center font-bold text-[11px] rounded-none border border-[#D0D5DD] transition-all ${
          isMin
            ? 'bg-gray-100 text-[#98A2B3] cursor-not-allowed border-[#E4E7EC]'
            : 'bg-white hover:bg-gray-100 active:bg-gray-200 text-[#1D2939] hover:border-[#008080] cursor-pointer active:scale-95'
        }`}
      >
        A-
      </button>

      {/* Reset / Current Size Indicator */}
      <button
        type="button"
        onClick={onReset}
        title={`Current size: ${percentage}%. Click to reset to 100% default.`}
        aria-label={`Reset text size (current: ${percentage}%)`}
        className="h-5 px-1.5 min-w-[38px] flex items-center justify-center font-bold text-[10px] rounded-none border border-[#D0D5DD] bg-white hover:bg-gray-100 active:bg-gray-200 text-[#008080] transition-all cursor-pointer"
      >
        {percentage}%
      </button>

      {/* Increase Button (A+) */}
      <button
        type="button"
        onClick={onIncrease}
        disabled={isMax}
        title={isMax ? `Maximum size limit reached (${percentage}%)` : 'Increase text size (A+)'}
        aria-label="Increase text size"
        className={`h-5 px-1.5 min-w-[24px] flex items-center justify-center font-bold text-[11px] rounded-none border border-[#D0D5DD] transition-all ${
          isMax
            ? 'bg-gray-100 text-[#98A2B3] cursor-not-allowed border-[#E4E7EC]'
            : 'bg-white hover:bg-gray-100 active:bg-gray-200 text-[#1D2939] hover:border-[#008080] cursor-pointer active:scale-95'
        }`}
      >
        A+
      </button>
    </div>
  );
}
