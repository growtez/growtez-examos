'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function deleteExam(id: string) {
  const supabase = createClient();
  
  // Update the exam to be trashed instead of hard deleting
  const { error } = await supabase.from('exams').update({ is_trashed: true }).eq('id', id);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath('/super-admin/exams');
  return { success: true };
}

export async function getExamForRegistration(examId: string) {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: examData, error: examError } = await supabaseAdmin
    .from('exams')
    .select('id, title, start_time, end_time, status, is_trashed, school_id')
    .eq('id', examId)
    .single();

  if (examError || !examData) {
    return { success: false, error: examError?.message || 'Exam not found' };
  }

  const { data: schoolData } = await supabaseAdmin
    .from('schools')
    .select('id, name')
    .eq('id', examData.school_id)
    .single();

  return { 
    success: true, 
    exam: examData, 
    school: schoolData 
  };
}
