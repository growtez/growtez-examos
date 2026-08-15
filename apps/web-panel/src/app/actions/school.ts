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

export async function updateSchoolAdminEmail(adminId: string, newEmail: string, updateContactEmail: boolean = true) {
  const supabase = createClient();

  // 1. Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // 2. Verify user is super_admin
  const { data: superAdmin } = await supabase
    .from('super_admins')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!superAdmin) {
    return { success: false, error: 'Unauthorized: Only Super Admins can update school admin email.' };
  }

  // 3. Validate new email format
  const cleanedEmail = newEmail.trim().toLowerCase();
  if (!cleanedEmail || !cleanedEmail.includes('@') || !cleanedEmail.includes('.')) {
    return { success: false, error: 'Invalid email address.' };
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 4. Fetch existing school_admin row to get school_id
  const { data: adminRow, error: fetchErr } = await supabaseAdmin
    .from('school_admins')
    .select('id, school_id, email')
    .eq('id', adminId)
    .single();

  if (fetchErr || !adminRow) {
    return { success: false, error: 'School admin not found.' };
  }

  // 5. Check if email is already in use by another school admin
  const { data: existingAdmin } = await supabaseAdmin
    .from('school_admins')
    .select('id')
    .eq('email', cleanedEmail)
    .neq('id', adminId)
    .maybeSingle();

  if (existingAdmin) {
    return { success: false, error: 'This email address is already assigned to another school admin.' };
  }

  // 6. Update auth.users email using Supabase Service Role Admin API
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(adminId, {
    email: cleanedEmail,
    email_confirm: true,
  });

  if (authError) {
    return { success: false, error: `Failed to update Auth email: ${authError.message}` };
  }

  // 7. Update public.school_admins email column
  const { error: dbError } = await supabaseAdmin
    .from('school_admins')
    .update({ email: cleanedEmail })
    .eq('id', adminId);

  if (dbError) {
    return { success: false, error: `Failed to update DB email: ${dbError.message}` };
  }

  // 8. Optionally update public.schools contact_email
  if (updateContactEmail && adminRow.school_id) {
    await supabaseAdmin
      .from('schools')
      .update({ contact_email: cleanedEmail })
      .eq('id', adminRow.school_id);
  }

  revalidatePath('/super-admin/schools');
  revalidatePath('/super-admin/users');
  if (adminRow.school_id) {
    revalidatePath(`/super-admin/schools/${adminRow.school_id}`);
  }

  return { success: true };
}
