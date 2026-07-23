'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Trash, AlertCircle } from 'lucide-react';

export default function TrashExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmColor: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
    onConfirm: () => {}
  });

  const fetchExams = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
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
      .select('*, students(count)')
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
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Permanently',
      message: 'Are you ABSOLUTELY sure you want to permanently delete this exam? This will erase all questions and student results tied to it!',
      confirmText: 'Delete Permanently',
      confirmColor: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        const supabase = createClient();
        const { error } = await supabase.from('exams').delete().eq('id', id);
        if (!error) {
          fetchExams();
        } else {
          alert('Failed to delete exam.');
        }
      }
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedExams(exams.map(ex => ex.id));
    else setSelectedExams([]);
  };

  const handleSelectExam = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedExams(prev => prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]);
  };

  const handleBulkRestore = async () => {
    if (selectedExams.length === 0) return;
    setIsBulkLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('exams').update({ is_trashed: false }).in('id', selectedExams);
    if (!error) {
      setSelectedExams([]);
      fetchExams();
    } else {
      alert('Failed to restore exams.');
    }
    setIsBulkLoading(false);
  };

  const handleBulkPermanentDelete = () => {
    if (selectedExams.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${selectedExams.length} Exams Permanently?`,
      message: 'Are you ABSOLUTELY sure you want to permanently delete these exams? This action is irreversible!',
      confirmText: 'Delete Permanently',
      confirmColor: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setIsBulkLoading(true);
        const supabase = createClient();
        const { error } = await supabase.from('exams').delete().in('id', selectedExams);
        if (!error) {
          setSelectedExams([]);
          fetchExams();
        } else {
          alert('Failed to delete exams.');
        }
        setIsBulkLoading(false);
      }
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Trash</h2>
          <p className="text-text-muted mt-1 text-sm font-medium">Manage deleted examinations</p>
        </div>
        <Link href="/exams"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border text-text-main text-sm font-semibold rounded-xl hover:border-accent-primary hover:text-accent-primary hover:bg-surface-hover transition-all shadow-sm">
          <ArrowLeft size={18} />
          Back to Exams
        </Link>
      </div>

      {selectedExams.length > 0 && (
        <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-2xl p-4 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-accent-primary font-bold text-sm">
            {selectedExams.length} {selectedExams.length === 1 ? 'exam' : 'exams'} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkRestore}
              disabled={isBulkLoading}
              className="px-4 py-2 bg-white text-accent-primary border border-accent-primary font-bold text-xs rounded-xl hover:bg-accent-primary/10 transition-colors disabled:opacity-50"
            >
              {isBulkLoading ? 'Processing...' : 'Restore Selected'}
            </button>
            <button
              onClick={handleBulkPermanentDelete}
              disabled={isBulkLoading}
              className="px-4 py-2 bg-red-500 text-white font-bold text-xs rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isBulkLoading ? 'Processing...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <table className="w-full animate-pulse">
            <thead>
              <tr className="bg-bg">
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-bg rounded w-48 mb-1.5"></div>
                    <div className="h-3 bg-bg rounded w-64"></div>
                  </td>
                  <td className="px-6 py-4"><div className="h-4 bg-bg rounded w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-bg rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-bg rounded w-32 ml-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : exams.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
              <Trash size={32} />
            </div>
            <h3 className="text-text-main font-bold text-lg">Trash is empty</h3>
            <p className="text-text-muted mt-1 text-sm font-medium">No deleted exams found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-bg border-b border-border">
                <th className="px-6 py-4 w-[50px] text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                    checked={exams.length > 0 && selectedExams.length === exams.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Title</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Duration</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Created On</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className={`border-b border-border transition-colors ${selectedExams.includes(exam.id) ? 'bg-accent-primary/5' : 'hover:bg-bg/50'}`}>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary cursor-pointer"
                      checked={selectedExams.includes(exam.id)}
                      onChange={(e) => handleSelectExam(exam.id, e)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-text-main font-semibold">{exam.title}</span>
                    {exam.description && <p className="text-text-muted text-xs mt-1">{exam.description}</p>}
                  </td>
                  <td className="px-6 py-4 text-text-muted text-sm font-medium">{exam.duration_minutes} min</td>
                  <td className="px-6 py-4 text-text-muted text-sm">{new Date(exam.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-4">
                    <button 
                      onClick={() => handleRestore(exam.id)}
                      className="text-accent-primary hover:text-accent-primary/80 text-sm font-semibold transition-colors"
                    >
                      Restore
                    </button>
                    <button 
                      onClick={() => handlePermanentDelete(exam.id)}
                      className="text-red-500 hover:text-red-600 text-sm font-semibold transition-colors"
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

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">{confirmDialog.title}</h3>
              <p className="text-text-muted text-sm font-medium mb-6">{confirmDialog.message}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-surface-hover text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  className={`flex-1 py-3 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm ${confirmDialog.confirmColor}`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
