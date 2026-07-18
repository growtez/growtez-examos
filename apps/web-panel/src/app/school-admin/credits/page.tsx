'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Coins, Zap, Loader2, ArrowRight, Check, MessageSquare } from 'lucide-react';
import { openRazorpayCheckout } from '@/components/RazorpayCheckout';

interface Plan {
  id: string;
  name: string;
  price: number;
  credits_awarded: number;
}

export default function CreditsPage() {
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number>(0);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [schoolId, setSchoolId] = useState<string>('');
  const [purchasingPlan, setPurchasingPlan] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: adminData } = await supabase
        .from('school_admins')
        .select('school_id')
        .eq('id', user.id)
        .single();

      if (!adminData?.school_id) return;
      setSchoolId(adminData.school_id);

      const { data: schoolData } = await supabase
        .from('schools')
        .select('exam_credits')
        .eq('id', adminData.school_id)
        .single();

      if (schoolData) {
        setCredits(schoolData.exam_credits || 0);
      }

      const { data: plansData } = await supabase
        .from('plans')
        .select('id, name, price, credits_awarded')
        .eq('is_active', true)
        .eq('plan_type', 'exam_based')
        .order('price', { ascending: true });

      if (plansData) {
        setPlans(plansData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuy = async (plan: Plan) => {
    setPurchasingPlan(plan.id);
    try {
      await openRazorpayCheckout({
        amount: plan.price,
        schoolId,
        planId: plan.id,
        planName: plan.name,
        onSuccess: () => {
          fetchData(); // Refresh credits
        },
        onError: (err) => {
          console.error("Payment failed", err);
          alert("Payment failed or cancelled. Please try again.");
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setPurchasingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-br from-accent-primary/10 via-surface to-surface border border-accent-primary/20 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4">
          <Coins size={200} />
        </div>

        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-main tracking-tight">Exam Credits</h1>
          <p className="text-text-muted text-base max-w-lg">
            Purchase credits to publish your exams. Each exam published consumes exactly 1 credit.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 bg-surface px-6 py-4 rounded-2xl shadow-sm border border-border">
          <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-accent-primary fill-accent-primary/20" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-0.5">Current Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-text-main leading-none">{credits}</span>
              <span className="text-sm font-semibold text-text-muted">Credits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div>
        <h2 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
          <Coins className="w-5 h-5 text-accent-primary" />
          Purchase Credit Packs
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {plans.map((plan, i) => {
            // Determine if it's a popular plan (e.g. the middle one or specific logic)
            const isPopular = i === 2 || plan.credits_awarded === 6;

            return (
              <div
                key={plan.id}
                className={`relative group bg-surface rounded-2xl p-6 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 ${isPopular
                    ? 'border-2 border-accent-primary shadow-xl shadow-accent-primary/10'
                    : 'border border-border shadow-md'
                  }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-primary text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full shadow-sm z-10 whitespace-nowrap">
                    Most Popular
                  </div>
                )}

                <div className="mb-6 text-left">
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-[17px] font-bold text-text-main">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-text-main tracking-tight">₹{plan.price}</span>
                    <span className="text-[13px] font-normal text-text-muted">/pack</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col mb-6">
                  <div className="flex items-center gap-3 border-b border-border/50 py-3.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={3} />
                    <span className="text-[13px] font-medium text-text-muted">
                      {plan.credits_awarded} Exam{plan.credits_awarded > 1 ? 's' : ''} Publish
                    </span>
                  </div>
                  <div className="flex items-center gap-3 border-b border-border/50 py-3.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={3} />
                    <span className="text-[13px] font-medium text-text-muted">
                      ₹{(plan.price / plan.credits_awarded).toFixed(0)} / credit
                    </span>
                  </div>
                  <div className="flex items-center gap-3 border-b border-border/50 py-3.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={3} />
                    <span className="text-[13px] font-medium text-text-muted">Never expires</span>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(plan)}
                  disabled={purchasingPlan === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-bold text-[13px] flex items-center justify-center gap-2 transition-all mt-auto ${isPopular
                      ? 'bg-accent-primary hover:bg-accent-primary/90 text-white shadow-md'
                      : 'bg-transparent hover:bg-surface-hover border border-border text-text-main hover:border-accent-primary/50 hover:text-accent-primary'
                    }`}
                >
                  {purchasingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Wait...
                    </>
                  ) : (
                    <>
                      Buy Now
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Contact Sales Section */}
        <div className="mt-12 flex flex-col items-center justify-center text-center pb-12">
          <p className="text-text-muted text-[13px] mb-3">Or Contact Us for Credits Purchase</p>
          <a
            href="https://wa.me/916026056362"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-border px-5 py-2.5 rounded-full text-[13px] font-semibold text-text-main transition-all hover:text-emerald-500 hover:border-emerald-500/30 shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Contact Sales on WhatsApp
          </a>
        </div>
      </div>

    </div>
  );
}
