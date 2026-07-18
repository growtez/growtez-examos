'use client';

import { useState } from 'react';
import { updateSchoolCredits } from '@/app/actions/school';
import { Edit2, Check, X, Loader2 } from 'lucide-react';

export default function EditSchoolCredits({ schoolId, initialCredits }: { schoolId: string; initialCredits: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [credits, setCredits] = useState(initialCredits || 0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateSchoolCredits(schoolId, credits);
    
    if (!result.success) {
      alert(`Failed to update credits: ${result.error}`);
    } else {
      setIsEditing(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refresh-tables'));
      }
    }
    setIsSaving(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-semibold text-text-main">
          {credits} Credits
        </span>
        <button
          onClick={() => setIsEditing(true)}
          className="text-text-muted hover:text-accent-primary transition-colors p-1 rounded hover:bg-surface-hover"
        >
          <Edit2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={credits}
        onChange={(e) => setCredits(Number(e.target.value))}
        className="w-20 px-2 py-1 text-sm rounded border border-border focus:outline-none focus:ring-1 focus:ring-accent-primary bg-surface"
        min={0}
      />
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 p-1 rounded transition-colors disabled:opacity-50"
      >
        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
      </button>
      <button
        onClick={() => {
          setCredits(initialCredits || 0);
          setIsEditing(false);
        }}
        disabled={isSaving}
        className="text-text-muted hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors disabled:opacity-50"
      >
        <X size={16} />
      </button>
    </div>
  );
}
