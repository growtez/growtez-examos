'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, Send, Trash2, Calendar, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export default function SchoolNotificationsContent({ schoolId, schoolName }: { schoolId: string; schoolName: string }) {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .or(`target_school_id.eq.${schoolId},target_school_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      console.error('Error fetching notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [schoolId]);

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
        target_school_id: schoolId,
        created_by: user?.id || null
      };

      const { data, error } = await supabase
        .from('system_notifications')
        .insert([newNotif])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setNotifications([data, ...notifications]);
        setTitle('');
        setMessage('');
        setImageUrl('');
        setSuccessMsg('Notification sent successfully to this school!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send notification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification? It will be removed for all users.')) return;

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

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-text-main">School Notifications</h3>
          <p className="text-text-muted text-sm">Send announcements and check previous notifications sent to {schoolName}.</p>
        </div>
        <button
          onClick={fetchNotifications}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-border/60 hover:border-accent-primary text-text-main hover:text-accent-primary rounded-xl text-sm font-medium transition-colors bg-surface-main shadow-sm shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Announcement Form */}
        <div className="lg:col-span-1">
          <div className="bg-surface-main border border-border/60 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 text-accent-primary">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <h4 className="font-bold text-text-main text-sm">Send New Announcement</h4>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Scheduled Maintenance"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary text-sm text-text-main bg-transparent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main">Message Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the message for the school administrators..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary text-sm text-text-main bg-transparent resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/banner.png"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary text-sm text-text-main bg-transparent"
                />
              </div>

              {successMsg && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-700 text-xs font-medium rounded-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-medium rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !title.trim() || !message.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/95 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-accent-primary/10"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Sending...' : 'Send Announcement'}
              </button>
            </form>
          </div>
        </div>

        {/* Previous Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 bg-surface-hover rounded-2xl border border-border/40"></div>
              <div className="h-24 bg-surface-hover rounded-2xl border border-border/40"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {notifications.map(notif => {
                const isGlobal = !notif.target_school_id;
                return (
                  <div
                    key={notif.id}
                    className="bg-surface-main border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20 shrink-0 text-accent-primary">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-6 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-sm text-text-main truncate">{notif.title}</h4>
                        {isGlobal ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                            Global
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#e0f2f2] text-[#008080] uppercase tracking-wider">
                            Targeted
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-main font-medium leading-relaxed whitespace-pre-wrap">{notif.message}</p>
                      
                      {notif.image_url && (
                        <div className="mt-2 rounded-xl overflow-hidden max-w-sm border border-border/40">
                          <img src={notif.image_url} alt="Announcement Media" className="w-full object-cover max-h-36" />
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[10px] text-text-muted font-semibold pt-1">
                        <Calendar className="w-3 h-3" />
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
            <div className="bg-surface-main border border-border/60 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
              <Bell className="w-12 h-12 text-text-muted/40 mx-auto" />
              <h4 className="text-base font-bold text-text-main">No Announcements Yet</h4>
              <p className="text-text-muted text-sm">Announcements and notifications sent to this school will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
