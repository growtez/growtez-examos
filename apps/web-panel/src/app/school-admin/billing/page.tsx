'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Coins, Plus, Check } from 'lucide-react';
import { openRazorpayCheckout } from '@/components/RazorpayCheckout';

export default function BillingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    // Get school info
    if (user) {
      const { data: adminData } = await supabase.from('school_admins').select('school_id').eq('id', user.id).single();
      if (adminData) {
        const { data: schoolData } = await supabase.from('schools').select('*').eq('id', adminData.school_id).single();
        setSchool(schoolData);
      }
    }

    // Get plans
    const { data: plansData } = await supabase.from('plans').select('*').eq('is_active', true).order('price');
    setPlans(plansData || []);
    setLoading(false);
  };

  const handleBuyCredits = (plan: any) => {
    if (!school || !user) return;

    openRazorpayCheckout({
      amount: plan.price,
      planId: plan.id,
      planName: plan.name,
      schoolId: school.id,
      userEmail: user.email,
      onSuccess: () => {
        alert('Payment successful! Credits have been added to your account.');
        fetchData(); // Refresh to show updated credits
      },
      onError: (err: any) => {
        alert('Payment failed or cancelled: ' + (err.message || 'Unknown error'));
      }
    });
  };

  const examPlans = plans.filter(p => p.plan_type === 'exam_based');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Billing & Credits</h1>
        <p className="text-sm text-text-muted">Manage your available exam credits and subscriptions.</p>
      </div>

      <div className="bg-surface border border-border p-6 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
            <Coins size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-muted uppercase tracking-wider">Available Credits</p>
            <p className="text-3xl font-black text-text-main">
              {school ? school.exam_credits || 0 : '...'} <span className="text-lg font-medium text-text-muted">exams</span>
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-text-main pt-4">Purchase Credits</h2>
      {loading ? (
        <div className="text-center p-8 text-text-muted text-sm">Loading plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {examPlans.map((plan) => (
            <div key={plan.id} className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col hover:border-accent-primary/50 transition-colors">
              <h3 className="text-xl font-bold text-text-main">{plan.name}</h3>
              <p className="text-sm text-text-muted mt-1">{plan.credits_awarded} Exam Credits</p>
              
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-text-main">₹{Number(plan.price).toLocaleString()}</span>
              </div>

              <ul className="mt-6 space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-text-main">
                  <Check size={16} className="text-accent-primary" /> Never expires
                </li>
                <li className="flex items-center gap-2 text-sm text-text-main">
                  <Check size={16} className="text-accent-primary" /> Unlimited students per exam
                </li>
              </ul>

              <button 
                onClick={() => handleBuyCredits(plan)}
                className="mt-auto w-full py-2.5 rounded-xl bg-accent-primary text-white font-bold hover:bg-accent-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Buy Now
              </button>
            </div>
          ))}
          {examPlans.length === 0 && (
            <div className="col-span-full text-center p-8 border border-dashed border-border rounded-2xl text-text-muted text-sm">
              No credit plans are currently available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
