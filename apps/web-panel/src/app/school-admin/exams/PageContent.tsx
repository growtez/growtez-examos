'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, FileText } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  published: 'bg-[#008080]/10 text-[#008080] border-[#008080]/20',
  active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  completed: 'bg-[#1a2e2e]/5 text-[#1a2e2e] border-[#1a2e2e]/20',
};

export function ExamsListContent({ schoolIdProp }: { schoolIdProp?: string }) {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [role, setRole] = useState<string>('school_admin');

  const fetchExams = async () => {
    const supabase = createClient();
    let schoolId: string | undefined = schoolIdProp;
    let currentRole = 'school_admin';
    let userId = '';

    if (!schoolId) {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      userId = user.id;
      currentRole = user.user_metadata?.role || 'school_admin';
      setRole(currentRole);
      
      if (currentRole === 'school_admin') {
        const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
        schoolId = profile?.school_id;
      } else {
        const { data: profile } = await supabase.from('teachers').select('school_id').eq('id', user.id).single();
        schoolId = profile?.school_id;
      }
    }
    if (!schoolId) return;

    let examQuery = supabase
      .from('exams')
      .select('*, exam_students(count)')
      .eq('school_id', schoolId)
      .eq('is_trashed', false)
      .order('created_at', { ascending: false });

    if (currentRole === 'teacher' && userId) {
      const { data: assignedSubjects } = await supabase.from('exam_subject_teachers').select('exam_subject_id').eq('teacher_id', userId);
      const examSubjectIds = assignedSubjects?.map(s => s.exam_subject_id) || [];
      if (examSubjectIds.length > 0) {
        const { data: subjects } = await supabase.from('exam_subjects').select('exam_id').in('id', examSubjectIds);
        const uniqueExamIds = Array.from(new Set(subjects?.map(s => s.exam_id) || []));
        if (uniqueExamIds.length > 0) {
          examQuery = examQuery.in('id', uniqueExamIds);
        } else {
          setExams([]);
          setLoading(false);
          return;
        }
      } else {
        setExams([]);
        setLoading(false);
        return;
      }
    }

    const { data } = await examQuery;

    setExams(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchExams();
    window.addEventListener('refresh-tables', fetchExams);
    return () => window.removeEventListener('refresh-tables', fetchExams);
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1a2e2e]">Exams</h2>
          <p className="text-[#555555] mt-1 text-sm font-medium">Create and manage examinations</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2.5 bg-white border border-[#b2d8d8] text-[#1a2e2e] text-sm font-semibold rounded-xl focus:outline-none focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/20 transition-all w-64 shadow-sm"
          />
          {role !== 'teacher' && (
            <>
              <Link href="/exams/trash"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#b2d8d8] text-[#1a2e2e] text-sm font-semibold rounded-xl hover:border-[#008080] hover:text-[#008080] hover:bg-[#f5f9f9] transition-all shadow-sm">
                <Trash2 size={18} />
                Trash
              </Link>
              <Link href="/exams/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#008080] text-white text-sm font-semibold rounded-xl hover:bg-[#006666] hover:shadow-lg hover:shadow-[#008080]/30 transition-all active:scale-95">
                <Plus size={18} />
                Create Exam
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#e0f2f2] rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <table className="w-full animate-pulse">
            <thead>
              <tr className="bg-[#f5f9f9]">
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[#e0f2f2]">
                  <td className="px-6 py-5"><div className="h-4 bg-[#f5f9f9] rounded w-3/4 mb-2"></div><div className="h-3 bg-[#f5f9f9] rounded w-1/2"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-[#f5f9f9] rounded w-1/2"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-[#f5f9f9] rounded w-1/3"></div></td>
                  <td className="px-6 py-5"><div className="h-6 bg-[#f5f9f9] rounded w-20"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-[#f5f9f9] rounded w-2/3"></div></td>
                  <td className="px-6 py-5"><div className="h-4 bg-[#f5f9f9] rounded w-12 ml-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : exams.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#008080]/10 flex items-center justify-center text-[#008080] mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-[#1a2e2e] font-bold text-lg">No exams yet</h3>
            <p className="text-[#555555] mt-1 text-sm font-medium">Create your first exam to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#f5f9f9] border-b border-[#e0f2f2]">
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Title</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Duration</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Students</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Created</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-[#555555] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.filter(exam => (exam.title || '').toLowerCase().includes(searchQuery.toLowerCase())).map((exam) => (
                <tr key={exam.id} onClick={() => router.push(`/exams/${exam.id}`)} className="border-b border-[#e0f2f2] hover:bg-[#f5f9f9]/50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <span className="text-[#1a2e2e] font-semibold">{exam.title}</span>
                    {exam.description && <p className="text-[#8ab8b8] text-xs mt-1">{exam.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-[#555555] text-sm font-medium">{exam.duration_minutes} min</td>
                  <td className="px-6 py-4 text-[#555555] text-sm font-medium">{exam.exam_students?.[0]?.count || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${statusColors[exam.status] || statusColors.draft}`}>
                      {exam.status?.charAt(0).toUpperCase() + exam.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#555555] text-sm">{new Date(exam.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[#008080] group-hover:text-[#006666] text-sm font-semibold transition-colors">
                      Manage
                    </span>
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

export default function ExamsListPage() {
  return <ExamsListContent />;
}
