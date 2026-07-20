import React from 'react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClose: () => void;
}

export default function VirtualKeyboard({ onKeyPress, onBackspace, onClose }: VirtualKeyboardProps) {
  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-[#E4E7EC] p-2 shadow-xl border border-[#D0D5DD] rounded z-[100] flex flex-col items-center animate-in fade-in zoom-in-95 duration-200 select-none w-max max-w-[95vw]">
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex justify-between items-center px-1 mb-0.5">
          <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">On-Screen Keyboard</div>
          <button 
            type="button"
            onClick={onClose}
            className="text-[11px] font-bold text-white bg-[#008080] hover:bg-[#006666] uppercase tracking-wider px-2.5 py-1 transition-colors rounded shadow-sm"
          >
            Close Keyboard
          </button>
        </div>
        {rows.map((row, i) => (
          <div key={i} className={`flex justify-center gap-1 ${i === 2 ? 'px-3' : i === 3 ? 'px-6' : ''}`}>
            {row.map(key => (
              <button
                key={key}
                type="button"
                onClick={() => onKeyPress(key)}
                className="w-9 h-10 bg-white border border-[#D0D5DD] shadow-sm hover:bg-[#F9FAFB] active:bg-[#E4E7EC] text-[#1D2939] font-bold text-sm transition-colors flex items-center justify-center focus:outline-none rounded-sm"
              >
                {key}
              </button>
            ))}
            {i === 3 && (
              <button
                type="button"
                onClick={onBackspace}
                className="px-3 h-10 bg-[#F04438] border border-[#d13b30] shadow-sm hover:bg-[#d13b30] active:bg-[#b83029] text-white font-bold transition-colors flex items-center justify-center focus:outline-none rounded-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
