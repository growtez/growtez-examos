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

  // Fetch school_admins and teachers — these are the only roles that have
  // Supabase auth.users entries and need to be explicitly deleted from auth.
  // NOTE: Students are NOT Supabase auth users (they use custom JWTs) and the
  // students table has no school_id column — their rows are cascade-deleted
  // automatically via: schools → exams (school_id) → students (exam_id).
  const [{ data: admins }, { data: teachers }] = await Promise.all([
    supabaseAdmin.from('school_admins').select('id').eq('school_id', id),
    supabaseAdmin.from('teachers').select('id').eq('school_id', id),
  ]);

  const userIds = [
    ...(admins?.map(a => a.id) || []),
    ...(teachers?.map(t => t.id) || []),
  ];

  // Delete all associated auth users. This also cascade-deletes their
  // school_admins / teachers DB rows via the auth.users(id) ON DELETE CASCADE FK.
  const deleteResults = await Promise.all(
    userIds.map(userId => supabaseAdmin.auth.admin.deleteUser(userId))
  );

  // Log any auth deletion errors but don't abort — proceed to delete the school
  deleteResults.forEach(({ error }, i) => {
    if (error) console.error(`Failed to delete auth user ${userIds[i]}:`, error.message);
  });

  // Delete the school — cascades to exams, questions, results, students, etc.
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
