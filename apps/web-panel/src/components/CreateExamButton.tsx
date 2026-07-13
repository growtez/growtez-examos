'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function CreateExamButton() {
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreateExam = async () => {
    const supabase = createClient();
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error('Not authenticated');

      const currentRole = user.user_metadata?.role || 'school_admin';
      let schoolId: string | null = null;

      if (currentRole === 'school_admin') {
        const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
        schoolId = profile?.school_id ?? null;
      } else {
        const { data: profile } = await supabase.from('teachers').select('school_id').eq('id', user.id).single();
        schoolId = profile?.school_id ?? null;
      }

      if (!schoolId) throw new Error('School not found');

      const { data: exam, error } = await supabase.from('exams').insert({
        school_id: schoolId,
        title: 'Untitled Exam',
        duration_minutes: 180,
        status: 'draft',
        marking_scheme: { mcq_correct: 4, mcq_wrong: -1, nat_correct: 4, nat_wrong: 0 },
        exam_instructions: [
          'The test contains multiple-choice questions (MCQs) and numerical value questions.',
          'No deduction from the total score will be made if no response is indicated.',
          'The test will automatically end when the time limit is reached.'
        ],
        created_by: user.id
      }).select().single();

      if (error) throw error;

      router.push(`/exams/${exam.id}`);
    } catch (err: any) {
      alert('Error creating exam: ' + err.message);
      setCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreateExam}
      disabled={creating}
      className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-accent-primary/20 bg-surface hover:bg-surface-hover hover:border-accent-primary transition-all group cursor-pointer text-center disabled:opacity-60 dark:border-accent-primary/30 dark:hover:border-accent-primary"
    >
      {creating ? (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
      ) : (
        <Plus size={14} className="text-accent-primary group-hover:scale-110 transition-transform" />
      )}
      <span className="font-semibold text-xs text-text-main">{creating ? 'Creating...' : 'Create Exam'}</span>
    </button>
  );
}
