'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, AlertCircle, CheckCircle2, Eye, RefreshCw, User, Mail, Calendar, HelpCircle, Check, Clock } from 'lucide-react';

export default function SchoolFeedbackContent({ schoolId }: { schoolId: string }) {
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, { name: string; email: string; role: string }>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchFeedbackAndUsers = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Fetch feedback
      const { data: fbData, error: fbError } = await supabase
        .from('feedback')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });

      if (fbError) throw fbError;

      if (fbData) {
        setFeedbacks(fbData);

        // 2. Fetch school admins and teachers to build a user map
        const { data: admins } = await supabase
          .from('school_admins')
          .select('id, full_name, email')
          .eq('school_id', schoolId);

        const { data: teachers } = await supabase
          .from('teachers')
          .select('id, full_name, email')
          .eq('school_id', schoolId);

        const map: Record<string, { name: string; email: string; role: string }> = {};
        
        admins?.forEach(a => {
          map[a.id] = { name: a.full_name, email: a.email || '', role: 'School Admin' };
        });

        teachers?.forEach(t => {
          map[t.id] = { name: t.full_name, email: t.email || '', role: 'Teacher' };
        });

        setUserMap(map);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbackAndUsers();
  }, [schoolId]);

  const handleUpdateStatus = async (feedbackId: string, newStatus: string) => {
    setUpdatingId(feedbackId);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', feedbackId);

      if (error) throw error;

      setFeedbacks(prev =>
        prev.map(fb => (fb.id === feedbackId ? { ...fb, status: newStatus } : fb))
      );
    } catch (err) {
      console.error('Error updating feedback status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredFeedbacks = feedbacks.filter(fb => {
    if (filterStatus === 'all') return true;
    return fb.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolved
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Eye className="w-3.5 h-3.5" />
            Reviewed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Clock className="w-3.5 h-3.5" />
            Unread
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'bug':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-red-100 text-red-800 uppercase tracking-wide">
            Bug
          </span>
        );
      case 'feature_request':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#e0f2f2] text-[#008080] uppercase tracking-wide">
            Feature Request
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-800 uppercase tracking-wide">
            Other
          </span>
        );
    }
  };

  const counts = {
    all: feedbacks.length,
    unread: feedbacks.filter(f => f.status === 'unread').length,
    reviewed: feedbacks.filter(f => f.status === 'reviewed').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-text-main">Submitted Feedback & Reports</h3>
          <p className="text-text-muted text-sm">Review issues, feature requests, and inquiries sent by school administrators.</p>
        </div>
        <button
          onClick={fetchFeedbackAndUsers}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-border/60 hover:border-accent-primary text-text-main hover:text-accent-primary rounded-xl text-sm font-medium transition-colors bg-surface-main shadow-sm shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs Row & Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { id: 'all', label: 'All Feedback', count: counts.all, color: 'border-border/60 bg-surface-main text-text-main' },
          { id: 'unread', label: 'Unread', count: counts.unread, color: 'border-orange-200 bg-orange-50/30 text-orange-700' },
          { id: 'reviewed', label: 'Reviewed', count: counts.reviewed, color: 'border-blue-200 bg-blue-50/30 text-blue-700' },
          { id: 'resolved', label: 'Resolved', count: counts.resolved, color: 'border-green-200 bg-green-50/30 text-green-700' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
              filterStatus === tab.id
                ? 'ring-2 ring-accent-primary border-transparent shadow-md'
                : 'hover:shadow-sm'
            } ${tab.color}`}
          >
            <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">{tab.label}</span>
            <span className="text-2xl font-extrabold mt-1">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-surface-hover rounded-2xl border border-border/40"></div>
          <div className="h-24 bg-surface-hover rounded-2xl border border-border/40"></div>
          <div className="h-24 bg-surface-hover rounded-2xl border border-border/40"></div>
        </div>
      ) : filteredFeedbacks.length > 0 ? (
        <div className="space-y-4">
          {filteredFeedbacks.map(fb => {
            const user = userMap[fb.submitted_by] || { name: 'Unknown User', email: 'N/A', role: 'Staff' };
            return (
              <div key={fb.id} className="bg-surface-main border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    {getTypeBadge(fb.type)}
                    {getStatusBadge(fb.status)}
                    <span className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(fb.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-text-main text-sm font-medium leading-relaxed whitespace-pre-wrap">
                      {fb.message}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-border/30 text-xs font-medium text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-text-muted/70" />
                      {user.name} ({user.role})
                    </span>
                    {user.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-text-muted/70" />
                        {user.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-4 md:pt-0 border-border/30 gap-3 shrink-0">
                  <span className="text-xs font-semibold text-text-muted md:hidden">Update Status:</span>
                  <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-xl border border-border/40">
                    {[
                      { id: 'unread', label: 'Unread', icon: Clock, activeColor: 'bg-orange-500 text-white' },
                      { id: 'reviewed', label: 'Review', icon: Eye, activeColor: 'bg-blue-600 text-white' },
                      { id: 'resolved', label: 'Resolve', icon: Check, activeColor: 'bg-green-600 text-white' },
                    ].map(statusBtn => {
                      const isActive = fb.status === statusBtn.id;
                      const Icon = statusBtn.icon;
                      return (
                        <button
                          key={statusBtn.id}
                          disabled={updatingId === fb.id}
                          onClick={() => handleUpdateStatus(fb.id, statusBtn.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isActive
                              ? `${statusBtn.activeColor} shadow-sm`
                              : 'text-text-muted hover:text-text-main hover:bg-surface-main'
                          }`}
                          title={`Mark as ${statusBtn.label}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{statusBtn.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface-main border border-border/60 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3">
          <HelpCircle className="w-12 h-12 text-text-muted/40 mx-auto" />
          <h4 className="text-base font-bold text-text-main">No feedback found</h4>
          <p className="text-text-muted text-sm">
            {filterStatus === 'all'
              ? 'No feedback or issues have been submitted by this school admin yet.'
              : `There are no feedback entries currently marked as "${filterStatus}".`}
          </p>
        </div>
      )}
    </div>
  );
}
