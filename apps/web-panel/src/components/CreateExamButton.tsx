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
      className="relative overflow-hidden flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border-2 border-border/60 bg-gradient-to-br from-surface to-surface-hover hover:border-accent-primary hover:shadow-lg hover:shadow-accent-primary/10 hover:-translate-y-0.5 transition-all group cursor-pointer text-center disabled:opacity-60"
    >
      <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary group-hover:scale-110 group-hover:bg-accent-primary/20 transition-all duration-300">
        {creating ? (
          <span className="w-5 h-5 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
        ) : (
          <Plus size={18} />
        )}
      </div>
      <span className="font-bold text-xs text-text-main group-hover:text-accent-primary transition-colors">{creating ? 'Creating...' : 'Create Exam'}</span>
    </button>
  );
}
