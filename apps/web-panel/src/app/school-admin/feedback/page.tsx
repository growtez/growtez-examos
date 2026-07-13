'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [message, setMessage] = useState('');
  const [type, setType] = useState('feature_request');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      
      const { data: admin } = await supabase.from('school_admins').select('school_id, schools(name)').eq('id', user.id).single();
      if (admin?.school_id) {
        setSchoolId(admin.school_id);
        setSchoolName((admin.schools as any)?.name || '');
        
        // Fetch existing feedback
        const { data: fbs } = await supabase.from('feedback')
          .select('*')
          .eq('school_id', admin.school_id)
          .order('created_at', { ascending: false });
        if (fbs) {
          setFeedbacks(fbs);
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !userId || !message.trim()) return;
    
    setSubmitting(true);
    setSubmitSuccess(false);
    
    const supabase = createClient();
    
    const newFeedback = {
      school_id: schoolId,
      submitted_by: userId,
      message,
      type: type === 'bug_report' ? 'bug' : type === 'general' ? 'other' : 'feature_request'
    };

    const { data, error } = await supabase.from('feedback').insert([newFeedback]).select().single();
    
    setSubmitting(false);
    
    if (!error && data) {
      setSubmitSuccess(true);
      setMessage('');
      setFeedbacks([data, ...feedbacks]);
      setTimeout(() => setSubmitSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Help & Support</h1>
        <p className="text-text-muted mt-1">Get in touch with the ParikshaOS team or submit a feature request/bug report.</p>
      </div>

      {/* Direct Contact Banner */}
      <div className="bg-gradient-to-r from-accent-primary/10 to-accent-primary/7 border border-accent-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-text-main font-bold text-lg">Need immediate assistance?</h2>
          <p className="text-text-muted text-sm mt-1">Reach out to our support team directly via WhatsApp or Email.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <a href={`https://wa.me/9101840955?text=${encodeURIComponent(`Hello ParikshaOS Support, this is ${schoolName || 'a school admin'}, we are reaching out regarding...`)}`} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-sm transition-colors text-sm">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            WhatsApp
          </a>
          <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=support@parikshaos.com&su=${encodeURIComponent(`Support Request - ${schoolName || 'School'}`)}&body=${encodeURIComponent(`Hello ParikshaOS Support,\n\nWe are reaching out regarding...`)}`} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-border hover:border-accent-primary text-text-main font-bold rounded-xl shadow-sm transition-colors text-sm">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Email Us
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feedback Form */}
        <div className="md:col-span-2">
          <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-100 rounded-xl w-1/3"></div>
                  <div className="h-32 bg-gray-100 rounded-xl w-full"></div>
                  <div className="h-10 bg-gray-100 rounded-xl w-1/4"></div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-main">Feedback Type</label>
                    <div className="flex flex-wrap gap-3">
                      {['feature_request', 'bug_report', 'general'].map((t) => (
                        <label
                          key={t}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${
                            type === t ? 'border-accent-primary bg-bg text-accent-primary' : 'border-border text-text-muted hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="type"
                            value={t}
                            checked={type === t}
                            onChange={() => setType(t)}
                            className="hidden"
                          />
                          <span className="text-sm font-medium capitalize">{t.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-main">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      placeholder="Describe the feature you need or the issue you're facing..."
                      className="w-full h-32 p-4 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary resize-none text-sm text-text-main"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      {submitSuccess && (
                        <span className="flex items-center gap-2 text-green-600 text-sm font-medium animate-in fade-in">
                          <CheckCircle2 className="w-4 h-4" />
                          Feedback sent successfully!
                        </span>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || !message.trim()}
                      className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? 'Sending...' : 'Send Feedback'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Previous Feedbacks Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col h-full max-h-[500px]">
            <div className="p-4 border-b border-border flex items-center gap-2 bg-bg">
              <MessageSquare className="text-accent-primary w-4 h-4" />
              <h2 className="text-sm font-bold text-text-main">Previous Feedback</h2>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 animate-pulse space-y-4">
                  <div className="h-16 bg-gray-100 rounded-xl w-full"></div>
                  <div className="h-16 bg-gray-100 rounded-xl w-full"></div>
                </div>
              ) : feedbacks.length > 0 ? (
                <div className="divide-y divide-border">
                  {feedbacks.map((fb) => (
                    <div key={fb.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 bg-surface-hover text-accent-primary rounded">
                          {fb.type.replace('_', ' ')}
                        </span>
                        {/* <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded ${
                          fb.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          fb.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {fb.status}
                        </span> */}
                      </div>
                      <p className="text-sm text-text-main line-clamp-3">{fb.message}</p>
                      <p className="text-xs text-text-muted mt-2">
                        {new Date(fb.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <AlertCircle className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                  <h3 className="text-sm font-medium text-text-main">No feedback yet</h3>
                  <p className="text-xs text-text-muted mt-1">Your submitted feedback will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
