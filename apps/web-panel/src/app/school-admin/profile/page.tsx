'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, CreditCard, CheckCircle, Clock, AlertCircle, Building, User, Trash2, CheckCircle2, Plus, MessageSquare, Send, LogOut } from 'lucide-react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const ReactCrop = dynamic(() => import('react-image-crop'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-surface-hover h-64 w-full rounded-lg"></div>
});

export default function ProfilePage() {
  const [activePlan, setActivePlan] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingImage, setSavingImage] = useState(false);
  const [showImageSaveSuccess, setShowImageSaveSuccess] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false);

  // Feedback State
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('feature_request');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  // Crop State
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): string => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
    
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      
      let currentSchoolId = null;
      const { data: admin } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      if (admin?.school_id) {
        currentSchoolId = admin.school_id;
      } else {
        const { data: teacher } = await supabase.from('teachers').select('school_id').eq('id', user.id).single();
        if (teacher?.school_id) {
          currentSchoolId = teacher.school_id;
        }
      }

      const promises = [];
      if (currentSchoolId) {
        promises.push(supabase.from('schools').select('*').eq('id', currentSchoolId).single().then(res => setSchool(res.data)));
        promises.push(supabase.from('feedback').select('*').eq('school_id', currentSchoolId).order('created_at', { ascending: false }).then(res => {
          if (res.data) setFeedbacks(res.data);
        }));
      }

      await Promise.all(promises);

      setLoading(false);
    }
    fetchData();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImgSrc(reader.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSaveCrop = async () => {
    if (!completedCrop || !imageRef.current || !school?.id) return;
    
    const croppedBase64 = getCroppedImg(imageRef.current, completedCrop);
    if (!croppedBase64) return;
    
    setIsCropModalOpen(false);
    setSavingImage(true);
    
    const supabase = createClient();
    await supabase.from('schools')
      .update({ logo_url: croppedBase64 })
      .eq('id', school.id);
      
    setSchool({ ...school, logo_url: croppedBase64 });
    setSavingImage(false);
    setShowImageSaveSuccess(true);
    setTimeout(() => setShowImageSaveSuccess(false), 3000);
  };
  
  const handleRemoveImage = async () => {
    if (!school?.id) return;
    setSavingImage(true);
    const supabase = createClient();
    await supabase.from('schools')
      .update({ logo_url: null })
      .eq('id', school.id);
    setSchool({ ...school, logo_url: null });
    setSavingImage(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      console.error('Error logging out:', err);
      setLoggingOut(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school?.id || !userId || !message.trim()) return;
    
    setSubmitting(true);
    setSubmitSuccess(false);
    
    const supabase = createClient();
    
    const newFeedback = {
      school_id: school.id,
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Profile & Settings</h1>
          <p className="text-text-muted mt-1">Manage your college profile and submit feedback to the team.</p>
        </div>
        <button
          onClick={() => setShowSignoutConfirm(true)}
          className="self-start sm:self-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-red-500/10"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* College Details Section */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <Building className="text-accent-primary w-5 h-5" />
          <h2 className="text-lg font-bold text-text-main">College Details</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="animate-pulse flex items-center gap-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
              <div className="space-y-3 flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : school ? (
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="relative group flex-shrink-0 cursor-pointer">
                <div className="w-28 h-28 bg-bg border-2 border-border rounded-full flex items-center justify-center overflow-hidden shadow-sm relative">
                  {school.logo_url ? (
                    <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                  ) : (
                    <User className="w-12 h-12 text-text-muted group-hover:opacity-50 transition-opacity" />
                  )}
                  <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-8 h-8 bg-surface rounded-full flex items-center justify-center shadow-md text-accent-primary">
                      <Plus className="w-5 h-5" />
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <h3 className="text-xl font-bold text-text-main">{school.name}</h3>
                  <p className="text-sm text-text-muted">Click the image to upload your institution's logo.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {school.logo_url && (
                    <button
                      onClick={handleRemoveImage}
                      disabled={savingImage}
                      className="px-4 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Remove Logo
                    </button>
                  )}
                  {(savingImage || showImageSaveSuccess) && (
                    <p className={`text-sm font-medium flex items-center gap-1 ${savingImage ? 'text-text-muted' : 'text-green-600 animate-in fade-in'}`}>
                      {savingImage ? 'Uploading...' : <><CheckCircle2 className="w-4 h-4" /> Image updated successfully</>}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-500">Could not load college details.</div>
          )}
        </div>
      </div>

      {/* Direct Contact Banner */}
      <div className="bg-gradient-to-r from-accent-primary/10 to-accent-primary/7 border border-accent-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-text-main font-bold text-lg">Need immediate assistance?</h2>
          <p className="text-text-muted text-sm mt-1">Reach out to our support team directly via WhatsApp or Email.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <a href={`https://wa.me/9101840955?text=${encodeURIComponent(`Hello ParikshaOS Support, this is ${school?.name || 'a school admin'}, we are reaching out regarding...`)}`} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-sm transition-colors text-sm">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            WhatsApp
          </a>
          <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=support@parikshaos.com&su=${encodeURIComponent(`Support Request - ${school?.name || 'School'}`)}&body=${encodeURIComponent(`Hello ParikshaOS Support,\n\nWe are reaching out regarding...`)}`} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-border hover:border-accent-primary text-text-main font-bold rounded-xl shadow-sm transition-colors text-sm">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            Email Us
          </a>
        </div>
      </div>

      {/* Feedback Section */}
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
                <form onSubmit={handleSubmitFeedback} className="space-y-5">
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



      {isCropModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-bg">
              <h3 className="text-lg font-bold text-text-main">Crop Logo</h3>
            </div>
            <div className="p-6 overflow-y-auto flex items-center justify-center bg-bg flex-1">
              {imgSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imageRef}
                    src={imgSrc}
                    alt="Upload"
                    className="max-h-[50vh] w-auto object-contain"
                  />
                </ReactCrop>
              )}
            </div>
            <div className="p-4 border-t border-border flex gap-3">
              <button
                onClick={() => {
                  setIsCropModalOpen(false);
                  setImgSrc('');
                }}
                className="flex-1 px-4 py-2 bg-surface text-text-muted font-semibold border border-border rounded-xl hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCrop}
                className="flex-1 px-4 py-2 bg-accent-primary text-white font-semibold rounded-xl hover:bg-accent-primary/80 transition-colors shadow-sm shadow-accent-primary/20"
              >
                Save Crop
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showSignoutConfirm && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-text-main mb-2">Sign Out</h3>
              <p className="text-text-muted text-sm font-medium mb-6">Are you sure you want to sign out of your account?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSignoutConfirm(false)}
                  disabled={loggingOut}
                  className="flex-1 py-3 bg-surface border border-border text-text-muted font-semibold rounded-xl hover:bg-surface-hover text-sm transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <LogOut className={`w-4 h-4 ${loggingOut ? 'animate-pulse' : ''}`} />
                  {loggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
