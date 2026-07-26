'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function deleteSchool(id: string) {
  const supabase = createClient();
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Fetch all users associated with this school using admin client to bypass RLS
  const [{ data: admins }, { data: teachers }, { data: students }] = await Promise.all([
    supabaseAdmin.from('school_admins').select('id').eq('school_id', id),
    supabaseAdmin.from('teachers').select('id').eq('school_id', id),
    supabaseAdmin.from('students').select('id').eq('school_id', id)
  ]);

  const userIds = [
    ...(admins?.map(a => a.id) || []),
    ...(teachers?.map(t => t.id) || []),
    ...(students?.map(s => s.id) || [])
  ];

  // Delete all associated users from auth.users
  for (const userId of userIds) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  }
  
  // Now delete the school (which will cascade delete public records like exams, etc)
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
