'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteSchool(id: string) {
  const supabase = createClient();
  
  const { error } = await supabase.from('schools').delete().eq('id', id);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath('/super-admin/schools');
  return { success: true };
}

export async function updateSchoolCredits(id: string, credits: number) {
  const supabase = createClient();
  
  const { error } = await supabase.from('schools').update({ exam_credits: credits }).eq('id', id);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath(`/super-admin/schools/${id}`);
  revalidatePath('/super-admin/schools');
  return { success: true };
}
