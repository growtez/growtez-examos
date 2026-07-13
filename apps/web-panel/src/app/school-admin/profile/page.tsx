'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, CreditCard, CheckCircle, Clock, AlertCircle, Building, User, Trash2, CheckCircle2, Plus } from 'lucide-react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function ProfilePage() {
  const [activePlan, setActivePlan] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingImage, setSavingImage] = useState(false);
  const [showImageSaveSuccess, setShowImageSaveSuccess] = useState(false);

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

      if (currentSchoolId) {
        // Fetch School Details
        const { data: schoolData } = await supabase.from('schools')
          .select('*')
          .eq('id', currentSchoolId)
          .single();
        if (schoolData) {
          setSchool(schoolData);
        }
      }

      // Fetch Notifications
      let query = supabase.from('system_notifications').select('*');
      if (currentSchoolId) {
        query = query.or(`target_school_id.eq.${currentSchoolId},target_school_id.is.null`);
      } else {
        query = query.is('target_school_id', null);
      }
      
      const { data: notifs } = await query.order('created_at', { ascending: false });
      if (notifs) setNotifications(notifs);

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
    // reset input so the same file can be selected again
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Profile & Notifications</h1>
        <p className="text-text-muted mt-1">Manage your college profile and stay updated with system notifications.</p>
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

      <div className="grid grid-cols-1 gap-6">
        {/* Notifications Section */}
        <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <Bell className="text-accent-primary w-5 h-5" />
            <h2 className="text-lg font-bold text-text-main">Notifications</h2>
          </div>
          <div className="p-0 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-5 animate-pulse space-y-4">
                <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
                <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-border">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-surface-hover transition-colors">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {notif.type === 'fee_update' ? (
                          <CreditCard className="w-5 h-5 text-purple-500" />
                        ) : notif.type === 'new_feature' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : notif.type === 'alert' ? (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Bell className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-text-main">{notif.title}</h4>
                        <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">{notif.message}</p>
                        {notif.image_url && (
                          <div className="mt-2.5 rounded-xl overflow-hidden max-w-md border border-border shadow-sm">
                            <img src={notif.image_url} alt="Announcement media" className="max-h-48 w-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-2.5 text-xs text-text-muted font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(notif.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <Bell className="w-8 h-8 text-text-muted mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-medium text-text-main">No New Notifications</h3>
                <p className="text-xs text-text-muted mt-1">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isCropModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
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
        </div>
      )}
    </div>
  );
}
