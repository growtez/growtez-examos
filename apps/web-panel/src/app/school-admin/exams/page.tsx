'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  draft: 'bg-[#f5f5f5] text-[#555555] border-[#cccccc]',
  published: 'bg-[#e0f2f2] text-[#008080] border-[#b2d8d8]',
  active: 'bg-[#cceded] text-[#006666] border-[#99d4d4]',
  completed: 'bg-[#1a2e2e] text-white border-[#243f3f]',
};

export default function ExamsListPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      let schoolId = null;
      const role = user.user_metadata?.role;
      if (role === 'school_admin') {
        const { data: profile } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
        schoolId = profile?.school_id;
      } else {
        const { data: profile } = await supabase.from('teachers').select('school_id').eq('id', user.id).single();
        schoolId = profile?.school_id;
      }
      if (!schoolId) return;

      const { data } = await supabase
        .from('exams')
        .select('*, exam_students(count)')
        .eq('school_id', schoolId)
        .eq('is_trashed', false)
        .order('created_at', { ascending: false });

      setExams(data || []);
      setLoading(false);
    };
    fetchExams();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="border-l-4 border-[#008080] pl-4">
          <h2 className="text-2xl font-extrabold text-[#1a2e2e] uppercase tracking-wide">Exams</h2>
          <p className="text-[#555555] mt-1 text-sm">Create and manage examinations</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/exams/trash"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-[#b2d8d8] text-[#1a2e2e] font-bold hover:border-[#008080] hover:text-[#008080] transition-colors text-sm uppercase">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
            Trash
          </Link>
          <Link href="/exams/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#008080] text-white font-bold hover:bg-[#006666] transition-all border-b-2 border-[#004d4d] text-sm uppercase tracking-wider">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Create Exam
          </Link>
        </div>
      </div>

      <div className="bg-white border-2 border-[#b2d8d8] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#555555]">Loading...</div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-[#1a2e2e] font-bold text-lg uppercase">No exams yet</h3>
            <p className="text-[#555555] mt-1 text-sm">Create your first exam to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#008080]">
                <th className="text-left px-6 py-3 text-xs font-bold text-white uppercase tracking-wider">Title</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-white uppercase tracking-wider">Duration</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-white uppercase tracking-wider">Students</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-white uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-white uppercase tracking-wider">Created</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className="border-b border-[#e0f2f2] hover:bg-[#f5f9f9] transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-[#1a2e2e] font-medium">{exam.title}</span>
                    {exam.description && <p className="text-[#8aacac] text-xs mt-0.5">{exam.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-[#555555] text-sm">{exam.duration_minutes} min</td>
                  <td className="px-6 py-4 text-[#555555] text-sm">{exam.exam_students?.[0]?.count || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-bold uppercase border ${statusColors[exam.status] || statusColors.draft}`}>
                      {exam.status?.charAt(0).toUpperCase() + exam.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#555555] text-sm">{new Date(exam.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/exams/${exam.id}`} className="text-[#008080] hover:text-[#006666] text-sm font-bold transition-colors uppercase">
                      Manage
                    </Link>
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
