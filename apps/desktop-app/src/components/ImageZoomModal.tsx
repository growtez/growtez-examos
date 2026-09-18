import { useState, useRef, useEffect, MouseEvent, WheelEvent } from 'react';

interface ImageZoomModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export default function ImageZoomModal({ imageUrl, title = 'Image Preview', onClose }: ImageZoomModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom and position when image changes or modal opens
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [imageUrl]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, Math.round((prev - 0.25) * 100) / 100));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#101828]/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      {/* Modal Dialog Card */}
      <div
        className="bg-white border border-[#E4E7EC] shadow-2xl rounded-none w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar with Controls */}
        <div className="bg-[#008080] px-5 py-3 flex items-center justify-between text-white shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
              {title}
            </h3>
          </div>

          {/* Zoom Controls Bar */}
          <div className="flex items-center gap-2">
            {/* Zoom Out (-) Button */}
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="w-8 h-8 flex items-center justify-center bg-[#004d4d] hover:bg-[#003333] active:bg-[#002222] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all rounded-none border border-white/10 cursor-pointer"
              title="Zoom Out (-)"
              aria-label="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>

            {/* Current Zoom Level / Reset Button */}
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-3 h-8 flex items-center justify-center bg-[#004d4d] hover:bg-[#003333] active:bg-[#002222] text-white font-bold text-xs transition-all rounded-none border border-white/10 cursor-pointer"
              title="Reset Zoom to 100%"
              aria-label="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>

            {/* Zoom In (+) Button */}
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="w-8 h-8 flex items-center justify-center bg-[#004d4d] hover:bg-[#003333] active:bg-[#002222] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all rounded-none border border-white/10 cursor-pointer"
              title="Zoom In (+)"
              aria-label="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <div className="w-[1px] h-6 bg-white/20 mx-1"></div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-red-600/80 hover:bg-red-600 active:bg-red-700 text-white font-extrabold text-base transition-all rounded-none border border-white/10 cursor-pointer"
              title="Close (Esc)"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex-1 relative overflow-hidden bg-[#F9FAFB] flex items-center justify-center p-6 ${
            zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Subtle grid background to highlight transparent PNGs */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#98A2B3 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />

          <img
            src={imageUrl}
            alt={title}
            draggable={false}
            className="max-w-full max-h-full object-contain transition-transform duration-75 select-none"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          />
        </div>

        {/* Bottom Help Tip Bar */}
        <div className="bg-[#FFFFFF] border-t border-[#E4E7EC] px-5 py-2 flex items-center justify-between text-[#667085] text-xs font-semibold shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#008080]"></span>
            <span>Tip: Use mouse wheel to zoom in/out. When zoomed in, drag the image to pan.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1 bg-[#008080] hover:bg-[#006666] text-white font-bold text-xs uppercase tracking-wider rounded-none cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
