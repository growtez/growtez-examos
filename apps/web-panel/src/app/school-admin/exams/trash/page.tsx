'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function TrashExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    setLoading(true);
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
      .eq('is_trashed', true)
      .order('created_at', { ascending: false });

    setExams(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleRestore = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('exams').update({ is_trashed: false }).eq('id', id);
    if (!error) {
      fetchExams();
    } else {
      alert('Failed to restore exam.');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Are you ABSOLUTELY sure you want to permanently delete this exam? This will erase all questions and student results tied to it!')) return;
    
    const supabase = createClient();
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (!error) {
      fetchExams();
    } else {
      alert('Failed to delete exam.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trash</h2>
          <p className="text-gray-500 mt-1">Manage deleted examinations</p>
        </div>
        <Link href="/exams"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Exams
        </Link>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : exams.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-gray-900 font-semibold text-lg">Trash is empty</h3>
            <p className="text-gray-500 mt-1">No deleted exams found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-100/50">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Title</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Duration</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Created On</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-gray-900 font-medium">{exam.title}</span>
                    {exam.description && <p className="text-gray-400 text-xs mt-0.5">{exam.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{exam.duration_minutes} min</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{new Date(exam.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-4">
                    <button 
                      onClick={() => handleRestore(exam.id)}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
                    >
                      Restore
                    </button>
                    <button 
                      onClick={() => handlePermanentDelete(exam.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                    >
                      Delete Permanently
                    </button>
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
