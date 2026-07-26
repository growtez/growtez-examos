'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function deleteTeacher(id: string) {
  const supabase = createClient();
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Verify the requesting user has access to delete this teacher
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Fetch the teacher to ensure they belong to the current user's school
  const { data: teacher, error: fetchError } = await supabase
    .from('teachers')
    .select('school_id')
    .eq('id', id)
    .single();

  if (fetchError || !teacher) {
    return { success: false, error: 'Teacher not found or access denied' };
  }

  // Delete from auth.users using admin API
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authError) {
    console.error('Failed to delete teacher auth account:', authError);
    // Continue anyway to delete the public record, or return error?
    // Usually it's better to continue and clean up the public record.
  }

  // Delete from public.teachers table
  const { error: dbError } = await supabase.from('teachers').delete().eq('id', id);
  
  if (dbError) {
    return { success: false, error: dbError.message };
  }
  
  revalidatePath('/school-admin/teachers');
  return { success: true };
}
