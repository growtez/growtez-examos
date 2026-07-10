'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, CreditCard, CheckCircle, Clock, AlertCircle, Building, User, Trash2, CheckCircle2, Plus } from 'lucide-react';

export default function ProfilePage() {
  const [activePlan, setActivePlan] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingImage, setSavingImage] = useState(false);
  const [showImageSaveSuccess, setShowImageSaveSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: admin } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      if (admin?.school_id) {
        // Fetch School Details
        const { data: schoolData } = await supabase.from('schools')
          .select('*')
          .eq('id', admin.school_id)
          .single();
        if (schoolData) {
          setSchool(schoolData);
        }

        // Fetch Subscription
        const { data: sub } = await supabase.from('subscriptions')
          .select('*, plans(*)')
          .eq('school_id', admin.school_id)
          .eq('status', 'active')
          .single();
        if (sub) setActivePlan(sub);
      }

      // Fetch Notifications
      const { data: notifs } = await supabase.from('notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (notifs) setNotifications(notifs);

      setLoading(false);
    }
    fetchData();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setSavingImage(true);
        const supabase = createClient();
        await supabase.from('schools')
          .update({ image_url: base64String })
          .eq('id', school.id);
          
        setSchool({ ...school, image_url: base64String });
        setSavingImage(false);
        setShowImageSaveSuccess(true);
        setTimeout(() => setShowImageSaveSuccess(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = async () => {
    if (!school?.id) return;
    setSavingImage(true);
    const supabase = createClient();
    await supabase.from('schools')
      .update({ image_url: null })
      .eq('id', school.id);
    setSchool({ ...school, image_url: null });
    setSavingImage(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a2e2e]">Profile & Subscriptions</h1>
        <p className="text-[#555555] mt-1">Manage your active plans and stay updated with system notifications.</p>
      </div>

      {/* College Details Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#e0f2f2] overflow-hidden">
        <div className="p-5 border-b border-[#e0f2f2] flex items-center gap-3">
          <Building className="text-[#008080] w-5 h-5" />
          <h2 className="text-lg font-bold text-[#1a2e2e]">College Details</h2>
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
                <div className="w-28 h-28 bg-[#f5f9f9] border-2 border-[#e0f2f2] rounded-full flex items-center justify-center overflow-hidden shadow-sm relative">
                  {school.image_url ? (
                    <img src={school.image_url} alt={school.name} className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                  ) : (
                    <User className="w-12 h-12 text-[#8ab8b8] group-hover:opacity-50 transition-opacity" />
                  )}
                  <label className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md text-[#008080]">
                      <Plus className="w-5 h-5" />
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <h3 className="text-xl font-bold text-[#1a2e2e]">{school.name}</h3>
                  <p className="text-sm text-[#555555]">Click the image to upload your institution's logo.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {school.image_url && (
                    <button
                      onClick={handleRemoveImage}
                      disabled={savingImage}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Remove Logo
                    </button>
                  )}
                  {(savingImage || showImageSaveSuccess) && (
                    <p className={`text-sm font-medium flex items-center gap-1 ${savingImage ? 'text-[#555555]' : 'text-green-600 animate-in fade-in'}`}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subscription Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0f2f2] overflow-hidden">
          <div className="p-5 border-b border-[#e0f2f2] flex items-center gap-3">
            <CreditCard className="text-[#008080] w-5 h-5" />
            <h2 className="text-lg font-bold text-[#1a2e2e]">Active Plan</h2>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ) : activePlan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#1a2e2e]">{activePlan.plans?.name || 'Custom Plan'}</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                </div>
                <div className="bg-[#f5f9f9] rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#555555]">Billing Cycle:</span>
                    <span className="font-semibold text-[#1a2e2e] capitalize">{activePlan.plans?.billing_cycle || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#555555]">Renews On:</span>
                    <span className="font-semibold text-[#1a2e2e]">
                      {activePlan.current_period_end ? new Date(activePlan.current_period_end).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                <button className="w-full py-2.5 bg-[#008080] hover:bg-[#006666] text-white font-medium rounded-xl transition-colors">
                  Manage Subscription
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-md font-semibold text-[#1a2e2e]">No Active Subscription</h3>
                <p className="text-sm text-[#555555] mt-1 mb-4">You are currently on a trial or free tier.</p>
                <button className="px-4 py-2 bg-[#008080] hover:bg-[#006666] text-white text-sm font-medium rounded-xl transition-colors">
                  Upgrade Plan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e0f2f2] overflow-hidden">
          <div className="p-5 border-b border-[#e0f2f2] flex items-center gap-3">
            <Bell className="text-[#008080] w-5 h-5" />
            <h2 className="text-lg font-bold text-[#1a2e2e]">Notifications</h2>
          </div>
          <div className="p-0 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-5 animate-pulse space-y-4">
                <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
                <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-[#e0f2f2]">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-[#f5f9f9] transition-colors">
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
                      <div>
                        <h4 className="text-sm font-bold text-[#1a2e2e]">{notif.title}</h4>
                        <p className="text-sm text-[#555555] mt-1">{notif.content}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-[#8ab8b8]">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(notif.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <Bell className="w-8 h-8 text-[#8ab8b8] mx-auto mb-3 opacity-50" />
                <h3 className="text-sm font-medium text-[#1a2e2e]">No New Notifications</h3>
                <p className="text-xs text-[#555555] mt-1">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
