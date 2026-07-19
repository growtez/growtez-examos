'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Coins, Check } from 'lucide-react';

export default function PlansDashboard() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .eq('plan_type', 'exam_based')
        .order('price', { ascending: true });
      setPlans(data || []);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-text-muted text-sm">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
      {/* Pricing Grid */}
      <div>
        <h2 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
          <Coins className="w-5 h-5 text-accent-primary" />
          Active Credit Packs
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {plans.map((plan, i) => {
            const isPopular = i === 2 || plan.credits_awarded === 6;

            return (
              <div
                key={plan.id}
                className={`relative group bg-surface rounded-2xl p-6 flex flex-col h-full transition-all duration-300 hover:-translate-y-1 ${
                  isPopular
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
                      ₹{plan.credits_awarded > 0 ? (plan.price / plan.credits_awarded).toFixed(0) : 0} / credit
                    </span>
                  </div>
                  <div className="flex items-center gap-3 border-b border-border/50 py-3.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={3} />
                    <span className="text-[13px] font-medium text-text-muted">Never expires</span>
                  </div>
                </div>

                <button
                  disabled
                  className={`w-full py-3 px-4 rounded-lg font-bold text-[13px] flex items-center justify-center gap-2 transition-all mt-auto ${
                    isPopular
                      ? 'bg-accent-primary text-white shadow-md opacity-80'
                      : 'bg-transparent border border-border text-text-main opacity-80'
                  }`}
                >
                  Buy Now
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
