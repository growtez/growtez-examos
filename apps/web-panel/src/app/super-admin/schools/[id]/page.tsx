import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function SchoolDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!school) return notFound();

  // Get counts
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', school.id);

  const { count: teacherCount } = await supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', school.id);

  const { count: examCount } = await supabase
    .from('exams')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', school.id);

  const { data: schoolAdmin } = await supabase
    .from('school_admins')
    .select('*')
    .eq('school_id', school.id)
    .single();

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link
          href="/schools"
          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 text-sm transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Schools
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{school.name}</h2>
            <p className="text-gray-500 mt-1">{school.domain || 'No domain set'}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
            school.is_active !== false
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${school.is_active !== false ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {school.is_active !== false ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <p className="text-2xl font-bold text-gray-900">{studentCount ?? 0}</p>
          <p className="text-gray-500 text-sm mt-1">Students</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <p className="text-2xl font-bold text-gray-900">{teacherCount ?? 0}</p>
          <p className="text-gray-500 text-sm mt-1">Teachers</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
          <p className="text-2xl font-bold text-gray-900">{examCount ?? 0}</p>
          <p className="text-gray-500 text-sm mt-1">Exams</p>
        </div>
      </div>

      {/* School Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">School Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Contact Email</p>
            <p className="text-gray-900 mt-0.5">{school.contact_email || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contact Phone</p>
            <p className="text-gray-900 mt-0.5">{school.contact_phone || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Max Students</p>
            <p className="text-gray-900 mt-0.5">{school.max_students ?? 500}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-gray-900 mt-0.5">{new Date(school.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* School Admin */}
      {schoolAdmin && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">School Administrator</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-gray-900 font-bold">{schoolAdmin.full_name?.charAt(0)?.toUpperCase() || 'A'}</span>
            </div>
            <div>
              <p className="text-gray-900 font-medium">{schoolAdmin.full_name}</p>
              <p className="text-gray-500 text-sm">{schoolAdmin.email || '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
