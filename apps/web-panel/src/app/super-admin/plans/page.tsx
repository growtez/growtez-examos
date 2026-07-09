'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, X, Edit2, Trash2, Calendar, Coins, Zap
} from 'lucide-react';

export default function PlansDashboard() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Plan modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [lockFields, setLockFields] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    plan_type: 'time_based',
    billing_cycle: 'monthly',
    price: '',
    credits_awarded: '',
    razorpay_plan_id: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('plans').select('*').order('created_at', { ascending: false });
    setPlans(data || []);
    setLoading(false);
  };

  const openCreatePlan = (prefill?: any) => {
    setEditingPlan(null);
    setLockFields(!!prefill);
    setPlanForm({ 
      name: prefill?.name || '', 
      plan_type: prefill?.plan_type || 'time_based', 
      billing_cycle: prefill?.billing_cycle || 'monthly', 
      price: prefill?.price || '', 
      credits_awarded: prefill?.credits_awarded || '', 
      razorpay_plan_id: '', 
      is_active: true 
    });
    setError('');
    setShowPlanModal(true);
  };

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setLockFields(true);
    setPlanForm({
      name: plan.name,
      plan_type: plan.plan_type,
      billing_cycle: plan.billing_cycle || 'monthly',
      price: String(plan.price),
      credits_awarded: String(plan.credits_awarded || ''),
      razorpay_plan_id: plan.razorpay_plan_id || '',
      is_active: plan.is_active,
    });
    setError('');
    setShowPlanModal(true);
  };

  const savePlan = async () => {
    setError('');
    setSaving(true);
    const supabase = createClient();
    const payload: any = {
      name: planForm.name.trim(),
      plan_type: planForm.plan_type,
      billing_cycle: planForm.plan_type === 'credit_based' ? 'none' : planForm.billing_cycle,
      price: parseFloat(planForm.price) || 0,
      credits_awarded: planForm.plan_type === 'credit_based' ? parseInt(planForm.credits_awarded) || 0 : 0,
      razorpay_plan_id: planForm.plan_type === 'time_based' ? (planForm.razorpay_plan_id.trim() || null) : null,
      is_active: planForm.is_active,
    };
    try {
      if (!payload.name) throw new Error('Plan name is required');
      if (editingPlan) {
        const { error: e } = await supabase.from('plans').update(payload).eq('id', editingPlan.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('plans').insert(payload);
        if (e) throw e;
      }
      setShowPlanModal(false);
      fetchPlans();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('Delete this plan? This cannot be undone.')) return;
    const supabase = createClient();
    await supabase.from('plans').delete().eq('id', id);
    fetchPlans();
  };

  const creditPlan = plans.find(p => p.plan_type === 'credit_based');
  const monthlyPlan = plans.find(p => p.plan_type === 'time_based' && p.billing_cycle === 'monthly');
  const quarterlyPlan = plans.find(p => p.plan_type === 'time_based' && p.billing_cycle === 'quarterly');
  const yearlyPlan = plans.find(p => p.plan_type === 'time_based' && p.billing_cycle === 'yearly');

  const otherPlans = plans.filter(p => {
    if (p.plan_type === 'credit_based' && p.id === creditPlan?.id) return false;
    if (p.plan_type === 'time_based' && p.billing_cycle === 'monthly' && p.id === monthlyPlan?.id) return false;
    if (p.plan_type === 'time_based' && p.billing_cycle === 'quarterly' && p.id === quarterlyPlan?.id) return false;
    if (p.plan_type === 'time_based' && p.billing_cycle === 'yearly' && p.id === yearlyPlan?.id) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Licensing & Plans</h1>
          <p className="text-sm text-text-muted">Manage global licensing plans and credit packages for schools.</p>
        </div>
        <button
          onClick={() => openCreatePlan()}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-xl text-sm font-semibold hover:bg-accent-primary/95 transition-colors shrink-0 self-start md:self-auto"
        >
          <Plus size={16} /> Add Plan
        </button>
      </div>
    
      {loading ? (
        <div className="p-8 text-center text-text-muted text-sm bg-surface border border-border rounded-2xl shadow-sm">Loading plans…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Fixed Payment */}
          <div className="relative bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-accent-primary/30 transition-all group overflow-hidden flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-extrabold text-text-main tracking-tight">Fixed Payment</h3>
                <p className="text-[11px] text-text-muted">Pay per Exam</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">Credits</span>
                {creditPlan && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${creditPlan.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-surface-hover text-text-muted border-border'}`}>
                    {creditPlan.is_active ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Price</span>
                <span className="font-bold text-text-main text-sm">{creditPlan ? `₹${Number(creditPlan.price).toLocaleString('en-IN')}` : '₹300'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Credits</span>
                <span className="font-semibold text-text-main">{creditPlan ? creditPlan.credits_awarded : '1'} / Student</span>
              </div>
            </div>
            <button
              onClick={() => creditPlan ? openEditPlan(creditPlan) : openCreatePlan({ name: 'Fixed Payment', plan_type: 'credit_based', price: '300', credits_awarded: '1' })}
              className={`mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[12px] font-bold transition-all border cursor-pointer ${
                creditPlan 
                  ? 'bg-surface-hover text-text-main border-border hover:border-accent-primary/30 hover:text-accent-primary' 
                  : 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary hover:text-white'
              }`}
            >
              <Edit2 size={13} /> {creditPlan ? 'Edit Plan' : 'Setup Plan'}
            </button>
          </div>

          {/* Monthly */}
          {/*
          <div className="relative bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-accent-primary/30 transition-all group overflow-hidden flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-extrabold text-text-main tracking-tight">Monthly</h3>
                <p className="text-[11px] text-text-muted">Standard Billing</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">Unlimited</span>
                {monthlyPlan && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${monthlyPlan.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-surface-hover text-text-muted border-border'}`}>
                    {monthlyPlan.is_active ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Price</span>
                <span className="font-bold text-text-main text-sm">{monthlyPlan ? `₹${Number(monthlyPlan.price).toLocaleString('en-IN')}` : 'Not Set'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Billing</span>
                <span className="font-semibold text-text-main">Monthly</span>
              </div>
            </div>
            <button
              onClick={() => monthlyPlan ? openEditPlan(monthlyPlan) : openCreatePlan({ name: 'Monthly Standard', plan_type: 'time_based', billing_cycle: 'monthly' })}
              className={`mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[12px] font-bold transition-all border cursor-pointer ${
                monthlyPlan 
                  ? 'bg-surface-hover text-text-main border-border hover:border-accent-primary/30 hover:text-accent-primary' 
                  : 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary hover:text-white'
              }`}
            >
              <Edit2 size={13} /> {monthlyPlan ? 'Edit Plan' : 'Setup Plan'}
            </button>
          </div>
          */}

          {/* Quarterly */}
          {/*
          <div className="relative bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-accent-primary/30 transition-all group overflow-hidden flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-extrabold text-text-main tracking-tight">Quarterly</h3>
                <p className="text-[11px] text-text-muted">3 Months</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">Unlimited</span>
                {quarterlyPlan && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${quarterlyPlan.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-surface-hover text-text-muted border-border'}`}>
                    {quarterlyPlan.is_active ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Price</span>
                <span className="font-bold text-text-main text-sm">{quarterlyPlan ? `₹${Number(quarterlyPlan.price).toLocaleString('en-IN')}` : 'Not Set'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Billing</span>
                <span className="font-semibold text-text-main">Quarterly</span>
              </div>
            </div>
            <button
              onClick={() => quarterlyPlan ? openEditPlan(quarterlyPlan) : openCreatePlan({ name: 'Quarterly Premium', plan_type: 'time_based', billing_cycle: 'quarterly' })}
              className={`mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[12px] font-bold transition-all border cursor-pointer ${
                quarterlyPlan 
                  ? 'bg-surface-hover text-text-main border-border hover:border-accent-primary/30 hover:text-accent-primary' 
                  : 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary hover:text-white'
              }`}
            >
              <Edit2 size={13} /> {quarterlyPlan ? 'Edit Plan' : 'Setup Plan'}
            </button>
          </div>
          */}

          {/* Yearly */}
          {/*
          <div className="relative bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-accent-primary/30 transition-all group overflow-hidden flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-extrabold text-text-main tracking-tight">Yearly</h3>
                <p className="text-[11px] text-text-muted">Annual Plan</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20">Unlimited</span>
                {yearlyPlan && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider ${yearlyPlan.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-surface-hover text-text-muted border-border'}`}>
                    {yearlyPlan.is_active ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1 mb-4">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Price</span>
                <span className="font-bold text-text-main text-sm">{yearlyPlan ? `₹${Number(yearlyPlan.price).toLocaleString('en-IN')}` : 'Not Set'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Billing</span>
                <span className="font-semibold text-text-main">Yearly</span>
              </div>
            </div>
            <button
              onClick={() => yearlyPlan ? openEditPlan(yearlyPlan) : openCreatePlan({ name: 'Yearly Unlimited', plan_type: 'time_based', billing_cycle: 'yearly' })}
              className={`mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-[12px] font-bold transition-all border cursor-pointer ${
                yearlyPlan 
                  ? 'bg-surface-hover text-text-main border-border hover:border-accent-primary/30 hover:text-accent-primary' 
                  : 'bg-accent-primary/10 text-accent-primary border-accent-primary/20 hover:bg-accent-primary hover:text-white'
              }`}
            >
              <Edit2 size={13} /> {yearlyPlan ? 'Edit Plan' : 'Setup Plan'}
            </button>
          </div>
          */}
        </div>
      )}

      {/* ── Additional Custom Plans ───────────────────── */}
      {/*
      {!loading && otherPlans.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Additional Custom Plans</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {otherPlans.map(plan => {
              const isCredit = plan.plan_type === 'credit_based';
              return (
                <div key={plan.id} className="relative bg-surface border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-accent-primary/30 transition-all flex flex-col group mt-3">
                  <span className={`absolute -top-2.5 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider bg-surface ${plan.is_active ? 'text-green-500 border-green-500' : 'text-text-muted border-border'}`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0">
                      {isCredit ? <Coins size={18} /> : <Calendar size={18} />}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary border border-accent-primary/20 mt-0.5 capitalize">
                      {isCredit ? 'Credit Pack' : plan.billing_cycle}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-text-main tracking-tight mb-1">{plan.name}</h3>
                  <p className="text-xl font-bold text-text-main mb-3">
                    ₹{Number(plan.price).toLocaleString('en-IN')}
                    {!isCredit && <span className="text-[12px] font-normal text-text-muted">/{plan.billing_cycle?.slice(0, 2)}</span>}
                  </p>
                  {isCredit && (
                    <p className="text-[12px] text-text-muted mb-3 flex items-center gap-1">
                      <Zap size={12} className="text-accent-primary" />{plan.credits_awarded} exam credits
                    </p>
                  )}
                  <div className="mt-auto flex gap-2">
                    <button onClick={() => openEditPlan(plan)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-surface-hover border border-border text-text-muted text-[11px] font-semibold hover:border-accent-primary/30 hover:text-accent-primary transition-all">
                      <Edit2 size={12} /> Edit
                    </button>
                    <button onClick={() => deletePlan(plan.id)}
                      className="py-1.5 px-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      */}

      {/* ── Plan Modal ────────────────────────────────── */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-bg border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-main">{editingPlan ? 'Edit Plan' : 'Setup Plan'}</h2>
              <button onClick={() => setShowPlanModal(false)} className="text-text-muted hover:text-text-main transition-colors">
                <X size={20} />
              </button>
            </div>

            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{error}</div>}

            <div className="space-y-3">
              {/* Name */}
              <div className="relative">
                <input type="text" placeholder="Plan Name" value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent"
                />
                <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:text-accent-primary pointer-events-none transition-all duration-200">Plan Name *</label>
              </div>

              {/* Type Selector / Read Only */}
              {lockFields ? (
                <div className="relative">
                  <input type="text" readOnly value={planForm.plan_type === 'time_based' ? '🗓 Time Based' : '🪙 Credit Based'}
                    className="w-full bg-surface/50 border border-border rounded-xl px-4 h-12 text-sm text-text-muted focus:outline-none cursor-default capitalize"
                  />
                  <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 pointer-events-none">Plan Type</label>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {['time_based', 'credit_based'].map(t => (
                    <button key={t} type="button" onClick={() => setPlanForm({ ...planForm, plan_type: t })}
                      className={`py-2.5 rounded-xl text-[12px] font-bold border transition-all capitalize ${planForm.plan_type === t ? 'bg-accent-primary/10 text-accent-primary border-accent-primary/30' : 'bg-surface-hover border-border text-text-muted hover:border-accent-primary/20'}`}>
                      {t === 'time_based' ? '🗓 Time Based' : '🪙 Credit Based'}
                    </button>
                  ))}
                </div>
              )}

              {/* Billing Cycle Selector / Read Only */}
              {planForm.plan_type === 'time_based' && (
                lockFields ? (
                  <div className="relative">
                    <input type="text" readOnly value={planForm.billing_cycle}
                      className="w-full bg-surface/50 border border-border rounded-xl px-4 h-12 text-sm text-text-muted focus:outline-none cursor-default capitalize"
                    />
                    <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 pointer-events-none">Billing Cycle</label>
                  </div>
                ) : (
                  <div className="relative">
                    <select value={planForm.billing_cycle} onChange={e => setPlanForm({ ...planForm, billing_cycle: e.target.value })}
                      className="w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary appearance-none">
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 pointer-events-none">Billing Cycle</label>
                  </div>
                )
              )}

              {/* Credits Awarded (only for credit_based) */}
              {planForm.plan_type === 'credit_based' && (
                <div className="relative">
                  <input type="number" placeholder="0" value={planForm.credits_awarded}
                    onChange={e => setPlanForm({ ...planForm, credits_awarded: e.target.value })}
                    className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent"
                  />
                  <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 pointer-events-none">Credits Awarded</label>
                </div>
              )}

              {/* Price */}
              <div className="relative">
                <input type="number" placeholder="0.00" value={planForm.price}
                  onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                  className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent"
                />
                <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 pointer-events-none">Price (₹) *</label>
              </div>

              {/* Razorpay Plan ID (only for time_based) */}
              {planForm.plan_type === 'time_based' && (
                <div className="relative">
                  <input type="text" placeholder="plan_xxxxx" value={planForm.razorpay_plan_id}
                    onChange={e => setPlanForm({ ...planForm, razorpay_plan_id: e.target.value })}
                    className="peer w-full bg-surface-hover border border-slate-300 dark:border-zinc-700 rounded-xl px-4 h-12 text-sm text-text-main font-mono focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all placeholder:text-transparent"
                  />
                  <label className="absolute -top-2.5 left-3 px-1.5 bg-bg text-[10px] font-bold text-text-muted uppercase tracking-wider z-10 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:bg-transparent peer-placeholder-shown:font-normal peer-focus:-top-2.5 peer-focus:text-[10px] peer-focus:bg-bg peer-focus:font-bold peer-focus:text-accent-primary pointer-events-none transition-all duration-200">Razorpay Plan ID</label>
                </div>
              )}

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className={`w-10 h-5 rounded-full transition-colors relative ${planForm.is_active ? 'bg-accent-primary' : 'bg-border'}`}
                  onClick={() => setPlanForm({ ...planForm, is_active: !planForm.is_active })}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${planForm.is_active ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm text-text-main font-medium">Active (visible to schools)</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowPlanModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-text-muted text-sm font-semibold hover:bg-surface-hover transition-colors">
                Cancel
              </button>
              <button onClick={savePlan} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-bold hover:bg-accent-primary/90 transition-colors disabled:opacity-60">
                {saving ? 'Saving…' : editingPlan ? 'Save Changes' : 'Setup Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
