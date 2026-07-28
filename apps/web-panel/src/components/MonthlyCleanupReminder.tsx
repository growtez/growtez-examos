'use client';

import { useState, useEffect } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function MonthlyCleanupReminder() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only check on the client
    if (typeof window === 'undefined') return;

    const today = new Date();
    
    // Check if it's the last day of the month
    const isLastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() === today.getDate();

    if (isLastDayOfMonth) {
      const storageKey = `cleanup_reminder_shown_${today.getFullYear()}_${today.getMonth()}`;
      
      // If we haven't shown it for this specific month yet
      if (!localStorage.getItem(storageKey)) {
        setShow(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    const today = new Date();
    const storageKey = `cleanup_reminder_shown_${today.getFullYear()}_${today.getMonth()}`;
    localStorage.setItem(storageKey, 'true');
    setShow(false);
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover text-text-muted hover:text-text-main hover:bg-border transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-text-main mb-2">Monthly Dashboard Cleanup</h2>
          <p className="text-sm font-medium text-text-muted mb-6 leading-relaxed">
            It's the end of the month! Please review your exams and delete any old or unneeded ones to keep your dashboard clean and organised.
          </p>
          
          <div className="flex w-full gap-3">
            <button 
              onClick={handleDismiss}
              className="flex-1 py-2.5 rounded-xl border border-border font-bold text-sm text-text-main hover:bg-surface-hover transition-colors"
            >
              Remind Me Later
            </button>
            <Link 
              href="/exams" 
              onClick={handleDismiss}
              className="flex-1 py-2.5 rounded-xl bg-accent-primary text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent-primary-hover shadow-lg shadow-accent-primary/20 transition-all hover:-translate-y-0.5"
            >
              <Trash2 size={16} />
              Review Exams
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
