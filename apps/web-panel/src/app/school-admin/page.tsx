import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function SchoolAdminDashboard() {
  const supabase = createClient();

  // Get current user's school_id (using getSession avoids a slow network request to the auth server)
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  let schoolId: string | null = null;
  let schoolName = 'Your School';

  if (user) {
    // Try to get school_id from metadata to save a database query
    schoolId = user.user_metadata?.school_id ?? null;
    
    if (!schoolId) {
      const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      schoolId = profile?.school_id ?? null;
    }
  }

  // Fetch all other data concurrently if we have a schoolId
  let studentCount = 0;
  let teacherCount = 0;
  let examCount = 0;
  let activeExamCount = 0;

  if (schoolId) {
    const [
      { data: school },
      { count: sCount },
      { count: tCount },
      { count: eCount },
      { count: aeCount }
    ] = await Promise.all([
      supabase.from('schools').select('name').eq('id', schoolId).single(),
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
      supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
      supabase.from('exams').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
      supabase.from('exams').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).in('status', ['published', 'active'])
    ]);

    schoolName = school?.name ?? schoolName;
    studentCount = sCount ?? 0;
    teacherCount = tCount ?? 0;
    examCount = eCount ?? 0;
    activeExamCount = aeCount ?? 0;
  }

  const stats = [
    { label: 'Total Students', value: studentCount, color: 'text-[#008080]', bg: 'bg-[#e0f2f2]', border: 'border-[#b2d8d8]' },
    { label: 'Teachers', value: teacherCount, color: 'text-[#006666]', bg: 'bg-[#cceded]', border: 'border-[#99d4d4]' },
    { label: 'Total Exams', value: examCount, color: 'text-[#004d4d]', bg: 'bg-[#b3e0e0]', border: 'border-[#80cccc]' },
    { label: 'Active Exams', value: activeExamCount, color: 'text-[#008080]', bg: 'bg-[#008080]', border: 'border-[#006666]' },
  ];

  return (
    <div>
      <div className="mb-8 border-l-4 border-[#008080] pl-4">
        <h2 className="text-2xl font-extrabold text-[#1a2e2e] uppercase tracking-wide">Dashboard</h2>
        <p className="text-[#555555] mt-1 text-sm">Manage exams, teachers, and students for {schoolName}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`border-2 p-5 ${i === 3 ? 'bg-[#008080] border-[#006666]' : `bg-white ${stat.border} border`}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${i === 3 ? 'text-[#cceded]' : 'text-[#555555]'}`}>{stat.label}</span>
            <p className={`text-3xl font-extrabold mt-2 ${i === 3 ? 'text-white' : stat.color}`}>{stat.value}</p>
            <div className={`mt-3 h-1 ${i === 3 ? 'bg-[#006666]' : 'bg-[#e0f2f2]'}`} />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-2 border-[#b2d8d8] p-6">
        <div className="border-l-4 border-[#008080] pl-3 mb-4">
          <h3 className="text-base font-bold text-[#1a2e2e] uppercase tracking-wide">Quick Actions</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/school-admin/exams/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#008080] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#006666] transition-colors border-b-2 border-[#004d4d]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Create Exam
          </Link>
          <Link href="/school-admin/teachers" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-[#b2d8d8] text-[#1a2e2e] text-sm font-bold uppercase tracking-wider hover:border-[#008080] hover:text-[#008080] transition-colors">
            Manage Teachers
          </Link>
          <Link href="/school-admin/students" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-[#b2d8d8] text-[#1a2e2e] text-sm font-bold uppercase tracking-wider hover:border-[#008080] hover:text-[#008080] transition-colors">
            Manage Students
          </Link>
        </div>
      </div>
    </div>
  );
}

