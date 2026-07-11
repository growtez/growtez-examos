'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Coins, Plus, Check, Zap, Sparkles, CreditCard, Clock, ShieldCheck } from 'lucide-react';
import { openRazorpayCheckout } from '@/components/RazorpayCheckout';

export default function BillingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

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
    <div className="relative min-h-[calc(100vh-100px)]">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-10 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="space-y-10 max-w-6xl mx-auto pb-12">
        {/* Header & Balance Card */}
        <div className="relative bg-gradient-to-br from-[#1a2e2e] to-[#0d1717] rounded-3xl p-8 overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,128,128,0.25)] border border-[#243f3f]">
          {/* Decorative shapes */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#008080]/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#00c8c8]/20 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#008080]/20 border border-[#008080]/40 text-[#00c8c8] text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={14} /> Subscription & Billing
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Manage Your Credits
              </h1>
              <p className="text-[#8ab8b8] text-sm md:text-base leading-relaxed">
                Scale your examinations seamlessly. Purchase credits as you need them. No expiry dates, no hidden fees.
              </p>
            </div>

            <div className="flex-shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-xl w-full md:w-80 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00c8c8] to-[#008080] text-white flex items-center justify-center shadow-lg shadow-[#008080]/40 shrink-0">
                  <Coins size={28} className="drop-shadow-md" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#8ab8b8] uppercase tracking-wider mb-1">Available Balance</p>
                  <div className="flex items-baseline gap-2">
                    {loading ? (
                      <div className="h-10 w-24 bg-white/10 animate-pulse rounded-lg" />
                    ) : (
                      <>
                        <span className="text-4xl font-black text-white drop-shadow-sm">{school?.exam_credits || 0}</span>
                        <span className="text-sm font-semibold text-[#8ab8b8]">exams</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: <Zap size={20} />, title: "Instant Activation", desc: "Credits are applied immediately upon successful payment." },
            { icon: <Clock size={20} />, title: "Never Expires", desc: "Your purchased credits roll over and never expire." },
            { icon: <ShieldCheck size={20} />, title: "Secure Checkout", desc: "100% safe & secure payments via Razorpay." },
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-surface p-4 rounded-2xl border border-border">
              <div className="w-10 h-10 rounded-full bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0">
                {feature.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-main">{feature.title}</h4>
                <p className="text-xs text-text-muted mt-0.5">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Plans */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-2xl font-bold text-text-main">Top Up Credits</h2>
              <p className="text-sm text-text-muted mt-1">Select a package below to add more exam credits to your account.</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 bg-surface-hover animate-pulse rounded-3xl border border-border" />
              ))}
            </div>
          ) : examPlans.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-20 bg-surface border border-dashed border-border rounded-3xl">
              <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mb-4">
                <CreditCard className="text-text-muted w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-text-main">No plans available</h3>
              <p className="text-sm text-text-muted mt-2 max-w-sm text-center">There are currently no credit packages configured. Please check back later or contact support.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {examPlans.map((plan, index) => {
                const isHovered = hoveredPlan === plan.id;
                const isPopular = index === Math.floor(examPlans.length / 2); // Highlight the middle plan
                
                return (
                  <div 
                    key={plan.id} 
                    onMouseEnter={() => setHoveredPlan(plan.id)}
                    onMouseLeave={() => setHoveredPlan(null)}
                    className={`relative flex flex-col bg-surface rounded-3xl p-8 transition-all duration-300 ${
                      isPopular ? 'border-2 border-accent-primary shadow-xl shadow-accent-primary/10 scale-100 md:scale-105 z-10' : 'border border-border hover:border-accent-primary/50 hover:shadow-lg'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent-primary to-[#005555] text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-md z-20">
                        Most Popular
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-xl font-black text-text-main uppercase tracking-tight">{plan.name}</h3>
                      <div className="inline-flex items-center gap-1.5 bg-accent-primary/10 text-accent-primary px-3 py-1 rounded-full text-xs font-bold mt-3">
                        <Zap size={14} className={isHovered ? "animate-pulse" : ""} />
                        {plan.credits_awarded} Exams
                      </div>
                    </div>

                    <div className="flex items-start gap-1 mb-6">
                      <span className="text-xl font-bold text-text-muted mt-2">₹</span>
                      <span className="text-5xl font-black text-text-main tracking-tighter">{Number(plan.price).toLocaleString()}</span>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                      {[
                        `Add ${plan.credits_awarded} exam credits instantly`,
                        'Unlimited students per exam',
                        'Credits never expire',
                        'Full feature access'
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-full p-0.5 ${isHovered || isPopular ? 'bg-accent-primary text-white' : 'bg-surface-hover text-text-muted'}`}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                          <span className="text-sm font-medium text-text-main/80 leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button 
                      onClick={() => handleBuyCredits(plan)}
                      className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 group ${
                        isPopular || isHovered
                          ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/30 hover:bg-accent-primary/90 hover:-translate-y-0.5' 
                          : 'bg-surface-hover text-text-main hover:bg-accent-primary/10 hover:text-accent-primary'
                      }`}
                    >
                      <CreditCard size={18} className="transition-transform group-hover:scale-110" />
                      Purchase Now
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
