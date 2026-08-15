'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function CreateExamButton() {
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreateExam = () => {
    router.push('/exams/new');
  };

  return (
    <button
      onClick={handleCreateExam}
      disabled={creating}
      className="relative overflow-hidden flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border-2 border-border/60 bg-gradient-to-br from-surface to-surface-hover hover:border-accent-primary hover:shadow-lg hover:shadow-accent-primary/10 hover:-translate-y-0.5 transition-all group cursor-pointer text-center disabled:opacity-60"
    >
      <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary group-hover:scale-110 group-hover:bg-accent-primary/20 transition-all duration-300">
        {creating ? (
          <span className="w-5 h-5 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
        ) : (
          <Plus size={18} />
        )}
      </div>
      <span className="font-bold text-xs text-text-main group-hover:text-accent-primary transition-colors">Create Exam</span>
    </button>
  );
}
