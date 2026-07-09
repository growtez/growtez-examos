'use server';

import { createClient } from '@/lib/supabase/server';
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
