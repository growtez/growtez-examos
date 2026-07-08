import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Users, FileText, Settings } from 'lucide-react';

export default async function SchoolDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!school) return notFound();

  // Get counts and relationships concurrently
  const [
    { count: studentCount },
    { count: teacherCount },
    { count: examCount },
    { data: schoolAdmin }
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
    supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
    supabase.from('exams').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
    supabase.from('school_admins').select('*').eq('school_id', school.id).single()
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex items-center gap-2 text-[13px] text-text-muted font-medium">
              <Link href="/super-admin" className="hover:text-accent-primary transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/super-admin/schools" className="hover:text-accent-primary transition-colors">
                Schools
              </Link>
              <span>/</span>
              <span className="text-text-main font-semibold truncate max-w-[200px]">{school.name}</span>
            </nav>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20 shrink-0 shadow-sm">
                <span className="text-2xl font-bold text-accent-primary">
                    {school.name.charAt(0).toUpperCase()}
                </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-main">{school.name}</h2>
              <p className="text-text-muted text-sm mt-1">{school.domain || 'No domain set'}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide uppercase ${
            school.is_active !== false
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${school.is_active !== false ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {school.is_active !== false ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-accent-primary/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-text-muted font-medium">Total Students</p>
            <p className="text-2xl font-bold text-text-main mt-0.5">{studentCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-accent-primary/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-text-muted font-medium">Total Teachers</p>
            <p className="text-2xl font-bold text-text-main mt-0.5">{teacherCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:border-accent-primary/30 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-text-muted font-medium">Exams Created</p>
            <p className="text-2xl font-bold text-text-main mt-0.5">{examCount ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School Info */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
                    <Settings size={18} className="text-accent-primary" />
                    <h3 className="text-[15px] font-bold text-text-main">School Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    <div>
                        <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Contact Email</p>
                        <p className="text-[14px] font-medium text-text-main">{school.contact_email || '—'}</p>
                    </div>
                    <div>
                        <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Contact Phone</p>
                        <p className="text-[14px] font-medium text-text-main">{school.contact_phone || '—'}</p>
                    </div>
                    <div>
                        <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Max Students</p>
                        <p className="text-[14px] font-medium text-text-main">{school.max_students ?? 500}</p>
                    </div>
                    <div>
                        <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Registered On</p>
                        <p className="text-[14px] font-medium text-text-main">{new Date(school.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* School Admin */}
        <div className="lg:col-span-1">
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm h-full">
                <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
                    <Users size={18} className="text-accent-primary" />
                    <h3 className="text-[15px] font-bold text-text-main">Administrator</h3>
                </div>
                {schoolAdmin ? (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center mb-4 shadow-inner">
                            <span className="text-2xl font-bold text-blue-500">{schoolAdmin.full_name?.charAt(0)?.toUpperCase() || 'A'}</span>
                        </div>
                        <p className="text-[16px] font-bold text-text-main mb-1">{schoolAdmin.full_name}</p>
                        <p className="text-[13px] text-text-muted bg-surface-hover px-3 py-1 rounded-full border border-border/50">{schoolAdmin.email || '—'}</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center h-[180px] text-text-muted">
                        <Users size={32} className="opacity-20 mb-3" />
                        <p className="text-[13px]">No administrator assigned</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
