import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import DeleteSchoolButton from './DeleteSchoolButton';

export default async function SchoolsListPage() {
  const supabase = createClient();
  const { data: schools } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="border-l-4 border-[#008080] pl-4">
          <h2 className="text-2xl font-extrabold text-[#1a2e2e] uppercase tracking-wide">Schools</h2>
          <p className="text-[#555555] mt-1 text-sm">Manage onboarded schools</p>
        </div>
        <Link
          href="/schools/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#008080] text-white font-bold hover:bg-[#006666] transition-all border-b-2 border-[#004d4d] text-sm uppercase tracking-wider"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Onboard School
        </Link>
      </div>

      {/* Schools Table */}
      <div className="bg-white border-2 border-[#b2d8d8] overflow-hidden">
        {!schools || schools.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#e0f2f2] border-2 border-[#b2d8d8] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#008080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            <h3 className="text-[#1a2e2e] font-bold text-lg uppercase">No schools yet</h3>
            <p className="text-[#555555] mt-1 text-sm">Onboard your first school to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#008080]">
                <th className="text-left px-6 py-3 text-xs font-bold text-white uppercase tracking-wider">School Name</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-white uppercase tracking-wider">Domain</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-white uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-white uppercase tracking-wider">Max Students</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-white uppercase tracking-wider">Created</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school: any) => (
                <tr key={school.id} className="border-b border-[#e0f2f2] hover:bg-[#f5f9f9] transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-[#1a2e2e] font-medium">{school.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#555555] text-sm">{school.domain || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase ${
                      school.is_active !== false
                        ? 'bg-[#e0f2f2] text-[#008080] border border-[#b2d8d8]'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 ${school.is_active !== false ? 'bg-[#008080]' : 'bg-red-500'}`} />
                      {school.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#555555] text-sm">{school.max_students ?? 500}</td>
                  <td className="px-6 py-4 text-[#555555] text-sm">
                    {new Date(school.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link
                      href={`/schools/${school.id}`}
                      className="text-[#008080] hover:text-[#006666] text-sm font-bold transition-colors inline-block uppercase"
                    >
                      View
                    </Link>
                    <DeleteSchoolButton schoolId={school.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
