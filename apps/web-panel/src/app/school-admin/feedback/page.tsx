'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
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
      
      const { data: admin } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      if (admin?.school_id) {
        setSchoolId(admin.school_id);
        
        // Fetch existing feedback
        const { data: fbs } = await supabase.from('feedbacks')
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
      user_id: userId,
      message,
      type
    };

    const { data, error } = await supabase.from('feedbacks').insert([newFeedback]).select().single();
    
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
        <h1 className="text-2xl font-bold text-[#1a2e2e]">Submit Feedback</h1>
        <p className="text-[#555555] mt-1">Send a feature request, bug report, or general feedback directly to the ParikshaOS team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feedback Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e0f2f2] overflow-hidden">
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
                    <label className="text-sm font-bold text-[#1a2e2e]">Feedback Type</label>
                    <div className="flex flex-wrap gap-3">
                      {['feature_request', 'bug_report', 'general'].map((t) => (
                        <label
                          key={t}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors ${
                            type === t ? 'border-[#008080] bg-[#f5f9f9] text-[#008080]' : 'border-[#e0f2f2] text-[#555555] hover:bg-gray-50'
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
                    <label className="text-sm font-bold text-[#1a2e2e]">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      placeholder="Describe the feature you need or the issue you're facing..."
                      className="w-full h-32 p-4 border border-[#e0f2f2] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008080]/20 focus:border-[#008080] resize-none text-sm text-[#1a2e2e]"
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
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-medium rounded-xl transition-colors disabled:opacity-50"
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
          <div className="bg-white rounded-2xl shadow-sm border border-[#e0f2f2] overflow-hidden flex flex-col h-full max-h-[500px]">
            <div className="p-4 border-b border-[#e0f2f2] flex items-center gap-2 bg-[#f5f9f9]">
              <MessageSquare className="text-[#008080] w-4 h-4" />
              <h2 className="text-sm font-bold text-[#1a2e2e]">Previous Feedback</h2>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 animate-pulse space-y-4">
                  <div className="h-16 bg-gray-100 rounded-xl w-full"></div>
                  <div className="h-16 bg-gray-100 rounded-xl w-full"></div>
                </div>
              ) : feedbacks.length > 0 ? (
                <div className="divide-y divide-[#e0f2f2]">
                  {feedbacks.map((fb) => (
                    <div key={fb.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 bg-[#e0f2f2] text-[#008080] rounded">
                          {fb.type.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded ${
                          fb.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          fb.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {fb.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#1a2e2e] line-clamp-3">{fb.message}</p>
                      <p className="text-xs text-[#8ab8b8] mt-2">
                        {new Date(fb.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <AlertCircle className="w-8 h-8 text-[#8ab8b8] mx-auto mb-2 opacity-50" />
                  <h3 className="text-sm font-medium text-[#1a2e2e]">No feedback yet</h3>
                  <p className="text-xs text-[#555555] mt-1">Your submitted feedback will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
