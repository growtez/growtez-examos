import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import DeleteSchoolButton from '../DeleteSchoolButton';
import { SchoolAdminPortal } from '@/components/super-admin/SchoolAdminPortal';

export default async function SchoolDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!school) return notFound();

  // Get school admin
  const { data: schoolAdmin } = await supabase
    .from('school_admins')
    .select('*')
    .eq('school_id', school.id)
    .single();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20 shrink-0 shadow-sm">
                <span className="text-2xl font-bold text-accent-primary">
                    {school.name.charAt(0).toUpperCase()}
                </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-main" data-page-title="school-name">{school.name}</h2>
              <p className="text-text-muted text-sm mt-1">{school.domain || 'No domain set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide uppercase ${
              school.is_active !== false
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${school.is_active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {school.is_active !== false ? 'Active' : 'Inactive'}
            </span>
            <div className="bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-xl border border-red-500/20 transition-colors">
              <DeleteSchoolButton schoolId={school.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-hover/30 border border-border rounded-xl p-4 text-xs font-semibold text-text-muted">
        <div>
          <span className="text-text-main">Contact Email:</span> {school.contact_email || '—'}
        </div>
        <div>
          <span className="text-text-main">Contact Phone:</span> {school.contact_phone || '—'}
        </div>
        <div>
          <span className="text-text-main">Administrator:</span> {schoolAdmin?.full_name ? `${schoolAdmin.full_name} (${schoolAdmin.email})` : 'No admin assigned'}
        </div>
      </div>

      {/* Embedded School Admin UI */}
      <SchoolAdminPortal schoolId={school.id} schoolName={school.name} />

    </div>
  );
}
