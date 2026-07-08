import { createClient } from '@/lib/supabase/server';
import UsersClientPage from './UsersClientPage';

export default async function UsersPage() {
  const supabase = createClient();

  // Fetch from all four user tables
  const [
    { data: superAdmins },
    { data: schoolAdmins },
    { data: teachers },
    { data: students }
  ] = await Promise.all([
    supabase.from('super_admins').select('*'),
    supabase.from('school_admins').select('*, schools(name)'),
    supabase.from('teachers').select('*, schools(name)'),
    supabase.from('students').select('*, schools(name)')
  ]);

  // Aggregate and normalize the data
  const allUsers = [
    ...(superAdmins || []).map(u => ({ ...u, role: 'super_admin' })),
    ...(schoolAdmins || []).map(u => ({ ...u, role: 'school_admin' })),
    ...(teachers || []).map(u => ({ ...u, role: 'teacher' })),
    ...(students || []).map(u => ({ ...u, role: 'student' }))
  ];

  // Sort by newest created_at by default
  allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return <UsersClientPage users={allUsers} />;
}
