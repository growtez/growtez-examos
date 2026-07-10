import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Users, GraduationCap, FileText, CheckCircle, Plus, Users2 } from 'lucide-react';

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
    { label: 'Total Students', value: studentCount, icon: GraduationCap, color: 'text-[#008080]', bg: 'bg-[#e0f2f2]/50', border: 'border-[#b2d8d8]', iconBg: 'bg-[#008080]/10' },
    { label: 'Teachers', value: teacherCount, icon: Users, color: 'text-[#006666]', bg: 'bg-[#cceded]/50', border: 'border-[#99d4d4]', iconBg: 'bg-[#006666]/10' },
    { label: 'Total Exams', value: examCount, icon: FileText, color: 'text-[#004d4d]', bg: 'bg-[#b3e0e0]/50', border: 'border-[#80cccc]', iconBg: 'bg-[#004d4d]/10' },
    { label: 'Active Exams', value: activeExamCount, icon: CheckCircle, color: 'text-white', bg: 'bg-gradient-to-br from-[#008080] to-[#005555]', border: 'border-[#006666]', iconBg: 'bg-white/20' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[#e0f2f2]">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-xl bg-[#008080]/10 flex items-center justify-center text-[#008080]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h8" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1a2e2e]">Welcome, {schoolName}</h2>
            <p className="text-[#555555] mt-1 text-sm font-medium">Manage exams, teachers, and students from your dashboard.</p>
          </div>
        </div>
        <Link href="/exams/new" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#008080] text-white text-sm font-semibold rounded-xl hover:bg-[#006666] hover:shadow-lg hover:shadow-[#008080]/30 transition-all active:scale-95">
          <Plus size={18} />
          Create Exam
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const isDark = i === 3;
          return (
            <div key={stat.label} className={`relative overflow-hidden rounded-2xl border ${stat.border} ${stat.bg} p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 duration-300 group`}>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <span className={`text-sm font-semibold ${isDark ? 'text-white/80' : 'text-[#555555]'}`}>{stat.label}</span>
                  <p className={`text-3xl font-extrabold mt-2 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg} transition-transform group-hover:scale-110 duration-300`}>
                  <Icon className={`w-5 h-5 ${isDark ? 'text-white' : stat.color}`} />
                </div>
              </div>
              <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${stat.iconBg} blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e0f2f2]">
        <h3 className="text-lg font-bold text-[#1a2e2e] mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#008080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/exams/new" className="flex items-center gap-4 p-4 rounded-xl border border-[#b2d8d8] bg-white hover:bg-[#f5f9f9] hover:border-[#008080] transition-all group">
            <div className="w-10 h-10 rounded-full bg-[#008080]/10 flex items-center justify-center text-[#008080] group-hover:scale-110 transition-transform">
              <Plus size={20} />
            </div>
            <div>
              <div className="font-semibold text-[#1a2e2e]">Create Exam</div>
              <div className="text-xs text-[#555555]">Draft a new assessment</div>
            </div>
          </Link>
          <Link href="/teachers" className="flex items-center gap-4 p-4 rounded-xl border border-[#b2d8d8] bg-white hover:bg-[#f5f9f9] hover:border-[#008080] transition-all group">
            <div className="w-10 h-10 rounded-full bg-[#008080]/10 flex items-center justify-center text-[#008080] group-hover:scale-110 transition-transform">
              <Users size={20} />
            </div>
            <div>
              <div className="font-semibold text-[#1a2e2e]">Manage Teachers</div>
              <div className="text-xs text-[#555555]">View and add staff</div>
            </div>
          </Link>
          <Link href="/students" className="flex items-center gap-4 p-4 rounded-xl border border-[#b2d8d8] bg-white hover:bg-[#f5f9f9] hover:border-[#008080] transition-all group">
            <div className="w-10 h-10 rounded-full bg-[#008080]/10 flex items-center justify-center text-[#008080] group-hover:scale-110 transition-transform">
              <Users2 size={20} />
            </div>
            <div>
              <div className="font-semibold text-[#1a2e2e]">Manage Students</div>
              <div className="text-xs text-[#555555]">View and enroll students</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

