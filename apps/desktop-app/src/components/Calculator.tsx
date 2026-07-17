import { useState, useRef, useEffect } from 'react';

interface CalculatorProps {
  onClose: () => void;
}

export default function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isFinished, setIsFinished] = useState(false);
  const [memory, setMemory] = useState(0);
  const [hasMemory, setHasMemory] = useState(false);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [pendingVal, setPendingVal] = useState<number | null>(null);

  // Floating & Dragging states
  const [position, setPosition] = useState({ x: 100, y: 150 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const calculatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = window.innerWidth;
    setPosition({ x: w - 380, y: 180 });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.calc-header')) {
      isDragging.current = true;
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      const minX = 10, minY = 10;
      const maxX = window.innerWidth - (calculatorRef.current?.offsetWidth || 300) - 10;
      const maxY = window.innerHeight - (calculatorRef.current?.offsetHeight || 500) - 10;
      setPosition({ x: Math.max(minX, Math.min(newX, maxX)), y: Math.max(minY, Math.min(newY, maxY)) });
    };
    const handleMouseUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position]);

  const currentValue = (): number => parseFloat(display) || 0;

  const formatResult = (n: number): string => {
    if (!isFinite(n)) return 'Error';
    return Number(n.toFixed(10)).toString();
  };

  // --- Memory ---
  const handleMC = () => { setMemory(0); setHasMemory(false); };
  const handleMR = () => { setDisplay(formatResult(memory)); setIsFinished(true); };
  const handleMS = () => { setMemory(currentValue()); setHasMemory(true); };
  const handleMPlus = () => { const m = memory + currentValue(); setMemory(m); setHasMemory(true); };
  const handleMMinus = () => { const m = memory - currentValue(); setMemory(m); setHasMemory(true); };

  // --- Input ---
  const handleDigit = (digit: string) => {
    if (display === '0' || isFinished) {
      setDisplay(digit);
      setIsFinished(false);
    } else {
      setDisplay(prev => prev + digit);
    }
  };

  const handleDecimal = () => {
    if (isFinished) { setDisplay('0.'); setIsFinished(false); return; }
    if (!display.includes('.')) setDisplay(prev => prev + '.');
  };

  // --- Unary ops ---
  const handleToggleSign = () => {
    if (display === '0') return;
    setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
  };

  const handleSqrt = () => {
    const val = currentValue();
    if (val < 0) { setDisplay('Error'); return; }
    setDisplay(formatResult(Math.sqrt(val)));
    setIsFinished(true);
  };

  const handlePercent = () => {
    const val = currentValue();
    if (pendingVal !== null) {
      setDisplay(formatResult((pendingVal * val) / 100));
    } else {
      setDisplay(formatResult(val / 100));
    }
    setIsFinished(true);
  };

  const handleReciprocal = () => {
    const val = currentValue();
    if (val === 0) { setDisplay('Error'); return; }
    setDisplay(formatResult(1 / val));
    setIsFinished(true);
  };

  // --- Clear ---
  const handleC = () => {
    setDisplay('0');
    setEquation('');
    setPendingOp(null);
    setPendingVal(null);
    setIsFinished(false);
  };

  const handleCE = () => {
    setDisplay('0');
    setIsFinished(false);
  };

  const handleBackspace = () => {
    if (isFinished) { setDisplay('0'); setIsFinished(false); return; }
    if (display.length > 1) setDisplay(prev => prev.slice(0, -1));
    else setDisplay('0');
  };

  // --- Binary ops ---
  const handleOperator = (op: string) => {
    const val = currentValue();
    if (pendingOp && !isFinished) {
      try {
        let result = 0;
        switch (pendingOp) {
          case '+': result = (pendingVal || 0) + val; break;
          case '-': result = (pendingVal || 0) - val; break;
          case '*': result = (pendingVal || 0) * val; break;
          case '/':
            if (val === 0) { setDisplay('Error'); setEquation(''); setPendingOp(null); setPendingVal(null); return; }
            result = (pendingVal || 0) / val; break;
        }
        const r = formatResult(result);
        setDisplay(r);
        setEquation(r + ' ' + op);
        setPendingVal(result);
      } catch {
        setDisplay('Error');
        setEquation('');
        setPendingOp(null);
        setPendingVal(null);
        return;
      }
    } else {
      setEquation(display + ' ' + op);
      setPendingVal(val);
    }
    setPendingOp(op);
    setIsFinished(true);
  };

  const handleEvaluate = () => {
    if (pendingOp === null || pendingVal === null) return;
    const val = currentValue();
    try {
      let result = 0;
      switch (pendingOp) {
        case '+': result = pendingVal + val; break;
        case '-': result = pendingVal - val; break;
        case '*': result = pendingVal * val; break;
        case '/':
          if (val === 0) { setDisplay('Error'); setEquation(''); setPendingOp(null); setPendingVal(null); return; }
          result = pendingVal / val; break;
      }
      setDisplay(formatResult(result));
      setEquation('');
      setPendingOp(null);
      setPendingVal(null);
      setIsFinished(true);
    } catch {
      setDisplay('Error');
      setEquation('');
    }
  };

  const btn = (label: string, onClick: () => void, variant: 'num' | 'op' | 'fn' | 'eq' = 'num', extra = '') => {
    const base = 'h-10 rounded-none font-semibold text-sm transition-colors shadow-sm flex items-center justify-center';
    const styles = {
      num: 'bg-white border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939]',
      op:  'bg-[#008080]/10 hover:bg-[#008080]/20 text-[#008080] font-bold',
      fn:  'bg-[#F2F4F7] hover:bg-[#E4E7EC] text-[#344054]',
      eq:  'bg-[#008080] hover:bg-[#006666] text-white font-bold',
    };
    return (
      <button onClick={onClick} className={`${base} ${styles[variant]} ${extra}`}>
        {label}
      </button>
    );
  };

  return (
    <div
      ref={calculatorRef}
      onMouseDown={handleMouseDown}
      style={{ position: 'fixed', left: `${position.x}px`, top: `${position.y}px`, zIndex: 9999 }}
      className="w-72 bg-white rounded-none shadow-2xl border border-[#008080]/30 select-none overflow-hidden"
    >
      {/* Header */}
      <div className="calc-header bg-[#008080] text-white px-4 py-2.5 flex items-center justify-between cursor-move">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider">Calculator</span>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-[#006666] p-1 rounded-none transition-colors" title="Close Calculator">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Display */}
      <div className="bg-[#F0F4F4] p-3 text-right border-b border-[#E4E7EC] font-mono">
        <div className="text-[10px] text-[#667085] h-4 mb-1 overflow-hidden truncate">{equation}</div>
        <div className="text-2xl font-bold text-[#1D2939] truncate select-text">{display}</div>
        {hasMemory && <div className="text-[9px] text-[#008080] font-bold mt-0.5">M = {memory}</div>}
      </div>

      {/* Keypad */}
      <div className="p-2.5 bg-[#FCFCFD] grid grid-cols-5 gap-1.5">
        {/* Row 1: Memory */}
        {btn('MC', handleMC, 'fn')}
        {btn('MR', handleMR, 'fn')}
        {btn('MS', handleMS, 'fn')}
        {btn('M+', handleMPlus, 'fn')}
        {btn('M-', handleMMinus, 'fn')}

        {/* Row 2: ←  CE  C  ±  √ */}
        <button onClick={handleBackspace} className="h-10 rounded-none bg-[#F2F4F7] hover:bg-[#E4E7EC] text-[#344054] font-semibold text-sm transition-colors shadow-sm flex items-center justify-center">
          ←
        </button>
        {btn('CE', handleCE, 'fn')}
        {btn('C', handleC, 'fn')}
        {btn('±', handleToggleSign, 'fn')}
        {btn('√', handleSqrt, 'fn')}

        {/* Row 3: 7 8 9 / % */}
        {btn('7', () => handleDigit('7'), 'num')}
        {btn('8', () => handleDigit('8'), 'num')}
        {btn('9', () => handleDigit('9'), 'num')}
        {btn('/', () => handleOperator('/'), 'op')}
        {btn('%', handlePercent, 'fn')}

        {/* Row 4: 4 5 6 * 1/x */}
        {btn('4', () => handleDigit('4'), 'num')}
        {btn('5', () => handleDigit('5'), 'num')}
        {btn('6', () => handleDigit('6'), 'num')}
        {btn('*', () => handleOperator('*'), 'op')}
        {btn('1/x', handleReciprocal, 'fn')}

        {/* Row 5: 1 2 3 - = (tall) */}
        {btn('1', () => handleDigit('1'), 'num')}
        {btn('2', () => handleDigit('2'), 'num')}
        {btn('3', () => handleDigit('3'), 'num')}
        {btn('-', () => handleOperator('-'), 'op')}
        <button
          onClick={handleEvaluate}
          className="h-[88px] row-span-2 rounded-none bg-[#008080] hover:bg-[#006666] text-white font-bold text-lg transition-colors shadow-sm flex items-center justify-center"
          style={{ gridRow: 'span 2' }}
        >
          =
        </button>

        {/* Row 6: 0 (wide) . + */}
        <button onClick={() => handleDigit('0')} className="h-10 col-span-2 rounded-none bg-white border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939] font-semibold text-sm transition-colors shadow-sm">
          0
        </button>
        {btn('.', handleDecimal, 'num')}
        {btn('+', () => handleOperator('+'), 'op')}
      </div>
    </div>
  );
}
