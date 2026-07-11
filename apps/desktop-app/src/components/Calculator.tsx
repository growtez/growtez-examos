import { useState, useRef, useEffect } from 'react';

const evaluateSimpleExpression = (expr: string): number => {
  const tokens = expr.trim().split(/\s+/);
  if (tokens.length !== 3) {
    throw new Error('Invalid expression');
  }
  const num1 = parseFloat(tokens[0]);
  const op = tokens[1];
  const num2 = parseFloat(tokens[2]);

  if (isNaN(num1) || isNaN(num2)) {
    throw new Error('Invalid numbers');
  }

  switch (op) {
    case '+': return num1 + num2;
    case '-': return num1 - num2;
    case '*': return num1 * num2;
    case '/': {
      if (num2 === 0) throw new Error('Division by zero');
      return num1 / num2;
    }
    default: throw new Error('Unknown operator');
  }
};

interface CalculatorProps {
  onClose: () => void;
}

export default function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  // Floating & Dragging states
  const [position, setPosition] = useState({ x: 100, y: 150 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const calculatorRef = useRef<HTMLDivElement>(null);

  // Position bounding within screen limits
  useEffect(() => {
    // Center it initially if we can
    const w = window.innerWidth;
    setPosition({ x: w - 380, y: 180 }); // Top right area by default
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from the header
    if ((e.target as HTMLElement).closest('.calc-header')) {
      isDragging.current = true;
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;

      // Keep within bounds
      const minX = 10;
      const minY = 10;
      const maxX = window.innerWidth - (calculatorRef.current?.offsetWidth || 300) - 10;
      const maxY = window.innerHeight - (calculatorRef.current?.offsetHeight || 420) - 10;

      setPosition({
        x: Math.max(minX, Math.min(newX, maxX)),
        y: Math.max(minY, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position]);

  // Calculator Logic
  const handleDigit = (digit: string) => {
    if (display === '0' || isFinished) {
      setDisplay(digit);
      setIsFinished(false);
    } else {
      setDisplay(prev => prev + digit);
    }
  };

  const handleDecimal = () => {
    if (isFinished) {
      setDisplay('0.');
      setIsFinished(false);
      return;
    }
    // Prevent multiple decimals in the current operand
    if (!display.includes('.')) {
      setDisplay(prev => prev + '.');
    }
  };

  const handleOperator = (op: string) => {
    setIsFinished(false);
    
    // Evaluate if there is already an equation and display is input
    if (equation && !isFinished) {
      try {
        const fullExpr = equation + ' ' + display;
        const result = evaluateSimpleExpression(fullExpr);
        const roundedResult = Number(Number(result).toFixed(8)).toString();
        setEquation(roundedResult + ' ' + op);
        setDisplay(roundedResult);
        setIsFinished(true);
      } catch (err) {
        setDisplay('Error');
        setEquation('');
      }
    } else {
      setEquation(display + ' ' + op);
      setIsFinished(true);
    }
  };

  const handleEvaluate = () => {
    if (!equation) return;
    try {
      const fullExpr = equation + ' ' + display;
      const result = evaluateSimpleExpression(fullExpr);
      const roundedResult = Number(Number(result).toFixed(8)).toString();
      setDisplay(roundedResult);
      setEquation('');
      setIsFinished(true);
    } catch (err) {
      setDisplay('Error');
      setEquation('');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsFinished(false);
  };

  const handleBackspace = () => {
    if (isFinished) {
      setDisplay('0');
      setIsFinished(false);
      return;
    }
    if (display.length > 1) {
      setDisplay(prev => prev.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleToggleSign = () => {
    if (display === '0') return;
    if (display.startsWith('-')) {
      setDisplay(prev => prev.slice(1));
    } else {
      setDisplay(prev => '-' + prev);
    }
  };

  return (
    <div
      ref={calculatorRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
      }}
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
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white hover:bg-[#006666] p-1 rounded-none transition-colors"
          title="Close Calculator"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
 
      {/* Screen Display */}
      <div className="bg-[#F8F9FA] p-4 text-right border-b border-[#E4E7EC] font-mono">
        <div className="text-[11px] text-[#667085] h-4 mb-1 overflow-hidden truncate">
          {equation}
        </div>
        <div className="text-2xl font-bold text-[#1D2939] truncate select-text">
          {display}
        </div>
      </div>
 
      {/* Keypad */}
      <div className="p-3 bg-[#FCFCFD] grid grid-cols-4 gap-2">
        <button
          onClick={handleClear}
          className="h-11 rounded-none bg-[#F2F4F7] hover:bg-[#E4E7EC] text-[#344054] font-bold text-sm transition-colors shadow-sm"
        >
          C
        </button>
        <button
          onClick={handleBackspace}
          className="h-11 rounded-none bg-[#F2F4F7] hover:bg-[#E4E7EC] text-[#344054] font-bold text-sm transition-colors shadow-sm flex items-center justify-center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414A2 2 0 0010.828 5H19a2 2 0 012 2v10a2 2 0 01-2 2h-8.172a2 2 0 00-1.414-.586L3 12z" />
          </svg>
        </button>
        <button
          onClick={handleToggleSign}
          className="h-11 rounded-none bg-[#F2F4F7] hover:bg-[#E4E7EC] text-[#344054] font-bold text-base transition-colors shadow-sm"
        >
          ±
        </button>
        <button
          onClick={() => handleOperator('/')}
          className="h-11 rounded-none bg-[#008080]/10 hover:bg-[#008080]/20 text-[#008080] font-bold text-base transition-colors shadow-sm"
        >
          ÷
        </button>
 
        {/* 7 8 9 * */}
        <button
          onClick={() => handleDigit('7')}
          className="h-11 rounded-none bg-white border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939] font-semibold text-sm transition-colors shadow-sm"
        >
          7
        </button>
        <button
          onClick={() => handleDigit('8')}
          className="h-11 rounded-none bg-white border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939] font-semibold text-sm transition-colors shadow-sm"
        >
          8
        </button>
        <button
          onClick={() => handleDigit('9')}
          className="h-11 rounded-none bg-white border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939] font-semibold text-sm transition-colors shadow-sm"
        >
          9
        </button>
        <button
          onClick={() => handleOperator('*')}
          className="h-11 rounded-none bg-[#008080]/10 hover:bg-[#008080]/20 text-[#008080] font-bold text-base transition-colors shadow-sm"
        >
          ×
        </button>
 
        {/* 4 5 6 - */}
        <button
          onClick={() => handleDigit('4')}
          className="h-11 rounded-none bg-white border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939] font-semibold text-sm transition-colors shadow-sm"
        >
          4
        </button>
        <button
          onClick={() => handleDigit('5')}
          className="h-11 rounded-none bg-white border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939] font-semibold text-sm transition-colors shadow-sm"
        >
          5
        </button>
        <button
          onClick={() => handleDigit('6')}
          className="h-11 rounded-none bg-white border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939] font-semibold text-sm transition-colors shadow-sm"
        >
          6
        </button>
        <button
          onClick={() => handleOperator('-')}
          className="h-11 rounded-none bg-[#008080]/10 hover:bg-[#008080]/20 text-[#008080] font-bold text-base transition-colors shadow-sm"
        >
          -
        </button>
 
        {/* 1 2 3 + */}
        <button
          onClick={() => handleDigit('1')}
          className="h-11 rounded-none bg-white border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939] font-semibold text-sm transition-colors shadow-sm"
        >
          1
        </button>
        <button
          onClick={() => handleDigit('2')}
          className="h-11 rounded-none bg-white border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939] font-semibold text-sm transition-colors shadow-sm"
        >
          2
        </button>
        <button
          onClick={() => handleDigit('3')}
          className="h-11 rounded-none bg-white border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939] font-semibold text-sm transition-colors shadow-sm"
        >
          3
        </button>
        <button
          onClick={() => handleOperator('+')}
          className="h-11 rounded-none bg-[#008080]/10 hover:bg-[#008080]/20 text-[#008080] font-bold text-base transition-colors shadow-sm"
        >
          +
        </button>
 
        {/* 0 . = (spans 2) */}
        <button
          onClick={() => handleDigit('0')}
          className="h-11 rounded-none bg-white border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939] font-semibold text-sm transition-colors shadow-sm"
        >
          0
        </button>
        <button
          onClick={handleDecimal}
          className="h-11 rounded-none bg-white border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#1D2939] font-semibold text-base transition-colors shadow-sm"
        >
          .
        </button>
        <button
          onClick={handleEvaluate}
          className="h-11 col-span-2 rounded-none bg-[#008080] hover:bg-[#006666] text-white font-bold text-sm transition-colors shadow-sm"
        >
          =
        </button>
      </div>
    </div>
  );
}
