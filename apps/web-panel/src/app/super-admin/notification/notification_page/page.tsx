'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Send, Trash2, Calendar, AlertCircle, RefreshCw, Layers, CheckCircle } from 'lucide-react';

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetSchoolId, setTargetSchoolId] = useState('all');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      // 1. Fetch schools for dropdown
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (schoolsError) throw schoolsError;
      setSchools(schoolsData || []);

      // 2. Fetch all system notifications
      const { data: notifs, error: notifsError } = await supabase
        .from('system_notifications')
        .select('*, schools(name)')
        .order('created_at', { ascending: false });

      if (notifsError) throw notifsError;
      setNotifications(notifs || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setErrorMsg(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const newNotif = {
        title: title.trim(),
        message: message.trim(),
        image_url: imageUrl.trim() || null,
        target_school_id: targetSchoolId === 'all' ? null : targetSchoolId,
        created_by: user?.id || null
      };

      const { data, error } = await supabase
        .from('system_notifications')
        .insert([newNotif])
        .select('*, schools(name)')
        .single();

      if (error) throw error;

      if (data) {
        setNotifications([data, ...notifications]);
        setTitle('');
        setMessage('');
        setImageUrl('');
        setTargetSchoolId('all');
        setSuccessMsg('Notification published successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to publish notification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification globally?')) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('system_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      alert('Error deleting notification: ' + err.message);
    }
  };

  const counts = {
    total: notifications.length,
    global: notifications.filter(n => !n.target_school_id).length,
    targeted: notifications.filter(n => n.target_school_id).length
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-main" data-page-title="notifications">Global Notifications</h1>
          <p className="text-text-muted text-sm mt-1">Publish alerts, news, and maintenance updates to schools in real-time.</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-border/60 hover:border-accent-primary text-text-main hover:text-accent-primary rounded-xl text-sm font-medium transition-colors bg-surface-main shadow-sm shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Published', count: counts.total, icon: Bell, bg: 'from-accent-primary/10 to-accent-primary/5 text-accent-primary border-accent-primary/20' },
          { label: 'Global (All Schools)', count: counts.global, icon: Layers, bg: 'from-blue-500/10 to-blue-500/5 text-blue-600 border-blue-500/20' },
          { label: 'Targeted (Specific Schools)', count: counts.targeted, icon: CheckCircle, bg: 'from-green-500/10 to-green-500/5 text-green-600 border-green-500/20' }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className={`bg-gradient-to-br ${stat.bg} border p-5 rounded-2xl flex items-center justify-between shadow-sm`}>
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{stat.label}</span>
                <h3 className="text-3xl font-extrabold text-text-main">{stat.count}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/40 flex items-center justify-center border border-white/60 text-current shadow-sm shrink-0">
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creator Panel */}
        <div className="lg:col-span-1">
          <div className="bg-surface-main border border-border/60 rounded-2xl shadow-sm p-6 space-y-5">
            <div>
              <h3 className="text-base font-bold text-text-main">Create Notification</h3>
              <p className="text-xs text-text-muted">Draft a message and select target audience.</p>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main">Audience Targeting</label>
                <select
                  value={targetSchoolId}
                  onChange={e => setTargetSchoolId(e.target.value)}
                  className="w-full px-3 py-2 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary text-sm text-text-main bg-surface-main cursor-pointer"
                >
                  <option value="all">All Schools (Global)</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Targeted)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main">Notification Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Scheduled Maintenance Announcement"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary text-sm text-text-main bg-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main">Message Body</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Provide detailed notification details..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary text-sm text-text-main bg-transparent resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main">Media Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/banner.png"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary text-sm text-text-main bg-transparent"
                />
              </div>

              {successMsg && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !title.trim() || !message.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/95 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-accent-primary/10"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </form>
          </div>
        </div>

        {/* History Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-main">Announcement History</h3>
            <span className="text-xs text-text-muted font-medium">Sorted by newest first</span>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-surface-hover rounded-2xl border border-border/40"></div>
              <div className="h-24 bg-surface-hover rounded-2xl border border-border/40"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
              {notifications.map(notif => {
                const isGlobal = !notif.target_school_id;
                const schoolName = notif.schools?.name || 'All Schools';
                return (
                  <div
                    key={notif.id}
                    className="bg-surface-main border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20 shrink-0 text-accent-primary">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-8 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-sm text-text-main truncate">{notif.title}</h4>
                        {isGlobal ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                            Global
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#e0f2f2] text-[#008080] uppercase tracking-wider" title={`Target school: ${schoolName}`}>
                            {schoolName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-main font-medium leading-relaxed whitespace-pre-wrap">{notif.message}</p>
                      
                      {notif.image_url && (
                        <div className="mt-2 rounded-xl overflow-hidden max-w-md border border-border/40">
                          <img src={notif.image_url} alt="Announcement Banner" className="w-full object-cover max-h-44" />
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[10px] text-text-muted font-semibold pt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(notif.created_at).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteNotification(notif.id)}
                      className="absolute right-4 top-4 p-1.5 rounded-lg border border-transparent hover:border-red-200 text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface-main border border-border/60 rounded-2xl p-16 text-center max-w-md mx-auto space-y-3">
              <Bell className="w-12 h-12 text-text-muted/40 mx-auto" />
              <h4 className="text-base font-bold text-text-main">No announcements published</h4>
              <p className="text-text-muted text-sm">Use the creator panel on the left to write and publish your first announcement.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
