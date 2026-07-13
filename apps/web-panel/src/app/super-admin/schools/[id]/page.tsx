import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import DeleteSchoolButton from '../DeleteSchoolButton';
import { SchoolAdminPortal } from '@/components/super-admin/SchoolAdminPortal';

export default async function SchoolDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [
    { data: school },
    { data: schoolAdmin }
  ] = await Promise.all([
    supabase.from('schools').select('*').eq('id', params.id).single(),
    supabase.from('school_admins').select('*').eq('school_id', params.id).single()
  ]);

  if (!school) return notFound();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Embedded School Admin UI */}
      <SchoolAdminPortal school={school} schoolAdmin={schoolAdmin} />
    </div>
  );
}
