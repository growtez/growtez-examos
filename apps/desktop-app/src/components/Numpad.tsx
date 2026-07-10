import React from 'react';

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Numpad({ value, onChange }: NumpadProps) {
  const handleKeyClick = (key: string) => {
    if (key === 'BACKSPACE') {
      onChange(value.slice(0, -1));
    } else if (key === 'CLEAR') {
      onChange('');
    } else if (key === '-') {
      // Toggle or insert minus sign at the beginning
      if (value.startsWith('-')) {
        onChange(value.slice(1));
      } else {
        onChange('-' + value);
      }
    } else if (key === '.') {
      // Only allow one decimal point
      if (!value.includes('.')) {
        onChange(value + '.');
      }
    } else {
      // Prevent multiple leading zeros, unless it is "0."
      if (value === '0') {
        onChange(key);
      } else if (value === '-0') {
        onChange('-' + key);
      } else {
        onChange(value + key);
      }
    }
  };

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['-', '0', '.'],
  ];

  return (
    <div className="mt-4 p-4 bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl max-w-[280px] shadow-sm select-none">
      <div className="grid grid-cols-3 gap-2">
        {rows.map((row, rIdx) => (
          <React.Fragment key={rIdx}>
            {row.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyClick(key)}
                className="h-12 flex items-center justify-center font-bold text-base text-[#1D2939] bg-white border border-[#E4E7EC] rounded-lg shadow-sm hover:bg-gray-50 active:bg-gray-100 hover:border-[#008080]/30 transition-all cursor-pointer"
              >
                {key}
              </button>
            ))}
          </React.Fragment>
        ))}
        
        <button
          type="button"
          onClick={() => handleKeyClick('BACKSPACE')}
          className="col-span-2 h-12 flex items-center justify-center gap-1.5 font-bold text-xs text-[#667085] bg-white border border-[#E4E7EC] rounded-lg shadow-sm hover:bg-red-50 hover:text-[#F04438] hover:border-[#F04438]/20 transition-all cursor-pointer uppercase"
          title="Backspace"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414A2 2 0 0010.828 19H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
          </svg>
          Backspace
        </button>

        <button
          type="button"
          onClick={() => handleKeyClick('CLEAR')}
          className="col-span-1 h-12 flex items-center justify-center font-bold text-xs text-[#667085] bg-white border border-[#E4E7EC] rounded-lg shadow-sm hover:bg-red-50 hover:text-[#F04438] hover:border-[#F04438]/20 transition-all cursor-pointer uppercase"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
