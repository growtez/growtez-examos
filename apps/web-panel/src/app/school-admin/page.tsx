import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function SchoolAdminDashboard() {
  const supabase = createClient();

  // Get current user's school_id
  const { data: { user } } = await supabase.auth.getUser();
  let schoolId: string | null = null;
  let schoolName = 'Your School';

  if (user) {
    const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
    schoolId = profile?.school_id ?? null;
    if (schoolId) {
      const { data: school } = await supabase.from('schools').select('name').eq('id', schoolId).single();
      schoolName = school?.name ?? schoolName;
    }
  }

  // Fetch stats scoped to school
  const { count: studentCount } = schoolId
    ? await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId!)
    : { count: 0 };
  const { count: teacherCount } = schoolId
    ? await supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('school_id', schoolId!)
    : { count: 0 };
  const { count: examCount } = schoolId
    ? await supabase.from('exams').select('*', { count: 'exact', head: true }).eq('school_id', schoolId)
    : { count: 0 };
  const { count: activeExamCount } = schoolId
    ? await supabase.from('exams').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).in('status', ['published', 'active'])
    : { count: 0 };

  const stats = [
    { label: 'Total Students', value: studentCount ?? 0, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Teachers', value: teacherCount ?? 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Total Exams', value: examCount ?? 0, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Active Exams', value: activeExamCount ?? 0, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">Manage exams, teachers, and students for {schoolName}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
            <span className="text-gray-500 text-sm font-medium">{stat.label}</span>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/exams/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-sm font-medium hover:bg-indigo-500/20 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Create Exam
          </Link>
          <Link href="/teachers" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
            Manage Teachers
          </Link>
          <Link href="/students" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
            Manage Students
          </Link>
        </div>
      </div>
    </div>
  );
}
