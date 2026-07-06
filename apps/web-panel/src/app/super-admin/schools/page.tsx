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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schools</h2>
          <p className="text-gray-500 mt-1">Manage onboarded schools</p>
        </div>
        <Link
          href="/schools/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-gray-900 font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Onboard School
        </Link>
      </div>

      {/* Schools Table */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        {!schools || schools.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            <h3 className="text-gray-900 font-semibold text-lg">No schools yet</h3>
            <p className="text-gray-500 mt-1">Onboard your first school to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">School Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Domain</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Max Students</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Created</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school: any) => (
                <tr key={school.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-gray-900 font-medium">{school.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-500 text-sm">{school.domain || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                      school.is_active !== false
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${school.is_active !== false ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {school.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{school.max_students ?? 500}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(school.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Link
                      href={`/schools/${school.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors inline-block"
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
