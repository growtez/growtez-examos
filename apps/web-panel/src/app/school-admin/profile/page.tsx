'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, CreditCard, CheckCircle, Clock, AlertCircle, Building, User, Trash2, CheckCircle2, Plus, MessageSquare, Send, LogOut, Bug, Sparkles, MessagesSquare, Camera } from 'lucide-react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const ReactCrop = dynamic(() => import('react-image-crop'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-surface-hover h-64 w-full rounded-lg"></div>
});

const FEEDBACK_TYPES = [
  { value: 'feature_request', label: 'Feature', icon: Sparkles, dot: 'bg-accent-primary', chip: 'text-accent-primary bg-accent-primary/10 border-accent-primary/20' },
  { value: 'bug_report', label: 'Bug', icon: Bug, dot: 'bg-red-500', chip: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' },
  { value: 'general', label: 'General', icon: MessagesSquare, dot: 'bg-text-muted', chip: 'text-text-muted bg-surface-hover border-border' },
];

function typeMeta(type: string) {
  return FEEDBACK_TYPES.find((t) => t.value === (type === 'bug' ? 'bug_report' : type === 'other' ? 'general' : type))
    || FEEDBACK_TYPES[0];
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

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
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

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
      setJustAddedId(data.id);
      setTimeout(() => setSubmitSuccess(false), 3000);
      setTimeout(() => setJustAddedId(null), 2200);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-0 pb-12">
      {/* Top Row Grid: College Details (2 cols) & Assistance Card (1 col) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* College Details Section */}
        <div className="md:col-span-2 bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-border flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <Building className="text-accent-primary w-4 h-4 flex-shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-text-main truncate">College Details</h2>
            </div>
            <button
              onClick={() => setShowSignoutConfirm(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-xl transition-all duration-200 active:scale-95 shadow-sm tracking-wide flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
          <div className="p-4 sm:p-5">
            {loading ? (
              <div className="animate-pulse flex items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3.5 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ) : school ? (
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-center text-center sm:text-left">
                <div className="relative group flex-shrink-0 cursor-pointer">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-bg border-2 border-border rounded-full flex items-center justify-center overflow-hidden shadow-sm relative">
                    {school.logo_url ? (
                      <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                    ) : (
                      <User className="w-8 h-8 sm:w-9 sm:h-9 text-text-muted group-hover:opacity-50 transition-opacity" />
                    )}
                    <label className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity ${
                      school.logo_url 
                        ? 'opacity-0 group-hover:opacity-100 bg-black/40' 
                        : 'opacity-100 bg-black/10 hover:bg-black/20'
                    }`}>
                      <div className="w-6 h-6 bg-surface rounded-full flex items-center justify-center shadow-md text-accent-primary">
                        {school.logo_url ? <Camera className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                  {school.logo_url && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                      disabled={savingImage}
                      title="Remove Logo"
                      aria-label="Remove Logo"
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 z-10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-2.5 w-full min-w-0">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-text-main truncate">{school.name}</h3>
                  </div>
                  {savingImage && (
                    <p className="text-xs font-medium text-text-muted flex items-center justify-center sm:justify-start gap-1">
                      Uploading...
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-red-500">Could not load college details.</div>
            )}
          </div>
        </div>

        {/* Direct Contact Banner (Assistance Card on Right) */}
        <div className="md:col-span-1 bg-gradient-to-br from-accent-primary/10 via-surface to-accent-primary/5 border border-accent-primary/20 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          <div>
            <h2 className="text-text-main font-bold text-sm sm:text-base">Need immediate assistance?</h2>
            <p className="text-text-muted text-xs mt-1 leading-relaxed">Reach out to our support team directly via WhatsApp or Email.</p>
          </div>
          <div className="flex flex-col gap-2.5 mt-4">
            <a href={`https://wa.me/9101840955?text=${encodeURIComponent(`Hello ParikshaOS Support, this is ${school?.name || 'a school admin'}, we are reaching out regarding...`)}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-2 bg-[#128C7E] hover:bg-[#075E54] text-white font-bold rounded-xl shadow-sm transition-colors text-xs tracking-wide">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              WhatsApp
            </a>
            <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=support@parikshaos.com&su=${encodeURIComponent(`Support Request - ${school?.name || 'School'}`)}&body=${encodeURIComponent(`Hello ParikshaOS Support,\n\nWe are reaching out regarding...`)}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 sm:py-2 bg-surface border border-border hover:border-accent-primary text-text-main font-bold rounded-xl shadow-sm transition-colors text-xs tracking-wide">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              Email Us
            </a>
          </div>
        </div>
      </div>

      {/* Feedback Section — form and history unified into a single panel */}
      <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-border flex flex-wrap items-center justify-between gap-2.5 bg-bg">
          <div className="flex items-center gap-2.5 min-w-0">
            <MessageSquare className="text-accent-primary w-4 h-4 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-text-main leading-tight">Feedback</h2>
              <p className="text-[11px] text-text-muted leading-tight">Tell us what's working, and what isn't.</p>
            </div>
          </div>
          {!loading && feedbacks.length > 0 && (
            <span className="text-[11px] font-bold text-accent-primary bg-accent-primary/10 border border-accent-primary/20 rounded-full px-2.5 py-1 tabular-nums flex-shrink-0">
              {feedbacks.length} submitted
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-4 sm:p-5 animate-pulse space-y-4">
            <div className="h-8 bg-gray-100 rounded-xl w-1/3"></div>
            <div className="h-24 bg-gray-100 rounded-xl w-full"></div>
            <div className="h-8 bg-gray-100 rounded-xl w-1/4"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* Left: composer */}
            <div className="lg:col-span-3 p-4 sm:p-5">
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-main">Type</label>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {FEEDBACK_TYPES.map(({ value, label, icon: Icon, chip }) => (
                      <label
                        key={value}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer transition-colors ${type === value ? `${chip} font-bold` : 'border-border text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                      >
                        <input
                          type="radio"
                          name="type"
                          value={value}
                          checked={type === value}
                          onChange={() => setType(value)}
                          className="hidden"
                        />
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-main">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Describe the feature you need or the issue you're facing..."
                    className="w-full h-28 p-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary resize-none text-xs text-text-main"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                  <div>
                    {submitSuccess && (
                      <span className="flex items-center gap-1.5 text-green-600 text-xs font-medium animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Feedback sent successfully!
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !message.trim()}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-accent-primary hover:bg-accent-primary/80 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'Sending...' : 'Send Feedback'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: timeline of previous feedback */}
            <div className="lg:col-span-2 p-4 sm:p-5 max-h-[320px] sm:max-h-[420px] overflow-y-auto">
              {feedbacks.length > 0 ? (
                <ul className="relative">
                  <span className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-border" aria-hidden="true" />
                  {feedbacks.map((fb) => {
                    const meta = typeMeta(fb.type);
                    const Icon = meta.icon;
                    const isNew = fb.id === justAddedId;
                    return (
                      <li key={fb.id} className="relative pl-6 pb-4 last:pb-0">
                        <span className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full ${meta.dot} ring-4 ring-surface flex items-center justify-center transition-transform ${isNew ? 'scale-125' : ''}`} />
                        <div className={`rounded-xl border p-3 transition-all duration-700 ${isNew ? 'border-accent-primary/40 bg-accent-primary/5' : 'border-border'}`}>
                          <div className="flex flex-wrap justify-between items-center gap-1 mb-1.5">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${meta.chip}`}>
                              <Icon className="w-2.5 h-2.5" />
                              {meta.label}
                            </span>
                            <span className="text-[10px] text-text-muted font-medium">{timeAgo(fb.created_at)}</span>
                          </div>
                          <p className="text-xs text-text-main leading-relaxed line-clamp-3 break-words">{fb.message}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-8 sm:py-10 px-3">
                  <AlertCircle className="w-6 h-6 text-text-muted mx-auto mb-1.5 opacity-50" />
                  <h3 className="text-xs font-bold text-text-main">No feedback yet</h3>
                  <p className="text-[11px] text-text-muted mt-0.5">What you send will show up here, in order.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isCropModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-bg">
              <h3 className="text-base sm:text-lg font-bold text-text-main">Crop Logo</h3>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex items-center justify-center bg-bg flex-1">
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
                    className="max-h-[42vh] sm:max-h-[50vh] w-auto object-contain"
                  />
                </ReactCrop>
              )}
            </div>
            <div className="p-3.5 sm:p-4 border-t border-border flex gap-3">
              <button
                onClick={() => {
                  setIsCropModalOpen(false);
                  setImgSrc('');
                }}
                className="flex-1 px-4 py-2.5 sm:py-2 bg-surface text-text-muted font-semibold border border-border rounded-xl hover:bg-surface-hover transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCrop}
                className="flex-1 px-4 py-2.5 sm:py-2 bg-accent-primary text-white font-semibold rounded-xl hover:bg-accent-primary/80 transition-colors shadow-sm shadow-accent-primary/20 text-sm"
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
            <div className="p-5 sm:p-6 text-center">
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