import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Users, GraduationCap, FileText, CheckCircle, Plus, Users2, Layers, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default async function SchoolAdminDashboard() {
  const supabase = createClient();

  // Get current user's school_id (using getSession avoids a slow network request to the auth server)
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  let schoolId: string | null = null;
  let schoolName = 'Your School';

  const role = user?.user_metadata?.role || 'school_admin';
  let teacherName = '';

  if (user) {
    if (role === 'teacher') {
      const { data: profile } = await supabase.from('teachers').select('school_id, full_name').eq('id', user.id).single();
      schoolId = profile?.school_id ?? null;
      teacherName = profile?.full_name ?? 'Teacher';
    } else {
      schoolId = user.user_metadata?.school_id ?? null;
      if (!schoolId) {
        const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
        schoolId = profile?.school_id ?? null;
      }
    }
  }

  // Fetch all other data concurrently if we have a schoolId
  let studentCount = 0;
  let teacherCount = 0;
  let examCount = 0;
  let activeExamCount = 0;
  let recentExams: any[] = [];

  if (schoolId) {
    const [
      { data: school },
      { count: sCount },
      { count: tCount },
      { count: eCount },
      { count: aeCount },
      { data: rExams }
    ] = await Promise.all([
      supabase.from('schools').select('name').eq('id', schoolId).single(),
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
      supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
      supabase.from('exams').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
      supabase.from('exams').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).in('status', ['published', 'active']),
      supabase.from('exams').select('id, title, duration_minutes, created_at, status').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(4)
    ]);

    schoolName = school?.name ?? schoolName;
    studentCount = sCount ?? 0;
    teacherCount = tCount ?? 0;
    examCount = eCount ?? 0;
    activeExamCount = aeCount ?? 0;
    recentExams = rExams || [];
  }

  const stats = [
    { label: 'Total Students', value: studentCount, icon: GraduationCap, color: 'text-[#008080]', bg: 'bg-[#e0f2f2]/50', border: 'border-[#b2d8d8]', iconBg: 'bg-[#008080]/10' },
    { label: 'Teachers', value: teacherCount, icon: Users, color: 'text-[#006666]', bg: 'bg-[#cceded]/50', border: 'border-[#99d4d4]', iconBg: 'bg-[#006666]/10' },
    { label: 'Total Exams', value: examCount, icon: FileText, color: 'text-[#004d4d]', bg: 'bg-[#b3e0e0]/50', border: 'border-[#80cccc]', iconBg: 'bg-[#004d4d]/10' },
    { label: 'Active Exams', value: activeExamCount, icon: CheckCircle, color: 'text-white', bg: 'bg-gradient-to-br from-[#008080] to-[#005555]', border: 'border-[#006666]', iconBg: 'bg-white/20' },
  ];

  if (role === 'teacher') {
    const { data: assignedSubjects } = await supabase.from('exam_subject_teachers').select('exam_subject_id').eq('teacher_id', user?.id);
    const examSubjectIds = assignedSubjects?.map(s => s.exam_subject_id) || [];
    let teacherExamCount = 0;
    let recentExamsTeacher: any[] = [];
    
    if (examSubjectIds.length > 0) {
      const { data: subjects } = await supabase.from('exam_subjects').select('exam_id').in('id', examSubjectIds);
      const uniqueExamIds = Array.from(new Set(subjects?.map(s => s.exam_id) || []));
      teacherExamCount = uniqueExamIds.length;
      
      if (uniqueExamIds.length > 0) {
        const { data: exams } = await supabase.from('exams').select('id, title, status, created_at').in('id', uniqueExamIds).order('created_at', { ascending: false }).limit(3);
        recentExamsTeacher = exams || [];
      }
    }

    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[#e0f2f2]">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-xl bg-[#008080]/10 flex items-center justify-center text-[#008080]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1a2e2e]">Welcome, {teacherName}</h2>
              <p className="text-[#555555] mt-1 text-sm font-medium">Manage your assigned exams and questions.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          {/* Summary Card */}
          <div className="relative overflow-hidden rounded-2xl border border-transparent bg-gradient-to-br from-[#008080] to-[#005555] p-6 shadow-xl text-white group">
            <div className="flex flex-col justify-between h-full relative z-10">
              <div>
                <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">Overview</span>
                <h3 className="text-xl font-bold mt-1">Your Workload</h3>
                <p className="text-[13px] text-white/70 mt-1.5 font-medium leading-relaxed">You have {teacherExamCount} exam{teacherExamCount !== 1 ? 's' : ''} assigned to you that require attention or question preparation.</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <p className="text-4xl font-extrabold">{teacherExamCount}</p>
                  <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1 block">Assigned Exams</span>
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-md transition-transform group-hover:scale-110 shadow-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-500"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-2xl group-hover:bg-black/20 transition-colors duration-500"></div>
          </div>

          {/* Recent Exams */}
          <div className="bg-white rounded-2xl border border-[#e0f2f2] p-5 shadow-sm">
            <h3 className="text-base font-bold text-[#1a2e2e] mb-3">Recent Exams</h3>
            {recentExamsTeacher.length > 0 ? (
              <div className="space-y-3">
                {recentExamsTeacher.map((exam) => (
                  <Link href={`/exams/${exam.id}`} key={exam.id} className="block p-3 rounded-xl border border-[#e0f2f2] hover:border-[#008080] hover:bg-[#f5f9f9] transition-all group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-[#1a2e2e] group-hover:text-[#008080] transition-colors line-clamp-1">{exam.title}</h4>
                        <p className="text-[11px] text-[#555555] font-medium mt-0.5">
                          Added {new Date(exam.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        exam.status === 'published' ? 'bg-[#008080]/10 text-[#008080]' :
                        exam.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                        exam.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {exam.status}
                      </span>
                    </div>
                  </Link>
                ))}
                <Link href="/exams" className="block text-center text-sm font-semibold text-[#008080] hover:text-[#005555] pt-2">
                  View all exams →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-[#8ab8b8] mx-auto mb-3" />
                <p className="text-[#1a2e2e] font-bold">No exams yet</p>
                <p className="text-sm text-[#555555] font-medium mt-1">You haven't been assigned to any exams.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Stats Grid */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const isDark = i === 3;
          return (
            <div key={stat.label} className={`min-w-[220px] sm:min-w-0 snap-center relative overflow-hidden rounded-xl sm:rounded-2xl border ${stat.border} ${stat.bg} p-3 sm:p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 duration-300 group`}>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-white/80' : 'text-[#555555]'}`}>{stat.label}</span>
                  <p className={`text-xl sm:text-2xl font-extrabold mt-0.5 sm:mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center ${stat.iconBg} transition-transform group-hover:scale-110 duration-300`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-white' : stat.color}`} />
                </div>
              </div>
              <div className={`absolute -bottom-4 -right-4 w-20 h-20 sm:w-24 sm:h-24 rounded-full ${stat.iconBg} blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e0f2f2] flex flex-col">
          <h3 className="text-sm sm:text-base font-bold text-[#1a2e2e] mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#008080]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 flex-grow">
          <Link href="/exams/new" className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[#b2d8d8] bg-white hover:bg-[#f5f9f9] hover:border-[#008080] transition-all group cursor-pointer text-center">
            <Plus size={14} className="text-[#008080] group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-xs text-[#1a2e2e]">Create Exam</span>
          </Link>
          <Link href="/teachers" className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[#b2d8d8] bg-white hover:bg-[#f5f9f9] hover:border-[#008080] transition-all group cursor-pointer text-center">
            <Users size={14} className="text-[#008080] group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-xs text-[#1a2e2e]">Manage Teachers</span>
          </Link>
          <Link href="/students" className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[#b2d8d8] bg-white hover:bg-[#f5f9f9] hover:border-[#008080] transition-all group cursor-pointer text-center">
            <Users2 size={14} className="text-[#008080] group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-xs text-[#1a2e2e]">Manage Students</span>
          </Link>
          <Link href="/results" className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-[#b2d8d8] bg-white hover:bg-[#f5f9f9] hover:border-[#008080] transition-all group cursor-pointer col-span-2 sm:col-span-1 text-center">
            <CheckCircle size={14} className="text-[#008080] group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-xs text-[#1a2e2e]">Manage Results</span>
          </Link>
        </div>
        </div>

        {/* Recent Exams */}
        <Card className="shadow-sm border-border flex flex-col w-full p-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40 mb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#1a2e2e]">
              <FileText size={16} className="text-[#008080]" />
              Recent Exams
            </CardTitle>
            <Link href="/exams" className="text-[11px] font-bold text-[#008080] flex items-center gap-0.5 hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-start">
            <div className="divide-y divide-border/40 w-full">
              {recentExams.length === 0 ? (
                <p className="text-xs text-[#555555] py-6 text-center">No exams scheduled.</p>
              ) : (
                recentExams.map((exam) => (
                  <Link 
                    key={exam.id} 
                    href={`/exams/${exam.id}`}
                    className="flex items-center justify-between py-2 px-1 hover:bg-[#f5f9f9] rounded transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1a2e2e] truncate">{exam.title}</p>
                      <p className="text-[10px] text-[#555555] truncate">
                        {exam.duration_minutes}m • <span className="capitalize">{exam.status}</span>
                      </p>
                    </div>
                    <span className="text-[9px] text-[#555555] shrink-0 ml-2">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
