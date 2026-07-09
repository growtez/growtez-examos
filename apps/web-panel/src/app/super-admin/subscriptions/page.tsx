'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  CreditCard, Search, X, ChevronLeft, ChevronRight,
  Coins, Calendar, Zap, Filter, Download
} from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
  past_due: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  suspended: 'bg-red-500/10 text-red-500 border-red-500/20',
  cancelled: 'bg-surface-hover text-text-muted border-border',
  incomplete: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  expired: 'bg-surface-hover text-text-muted border-border',
};

export default function SubscriptionsDashboard() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    fetchSubscriptions();
    window.addEventListener('refresh-tables', fetchSubscriptions);
    return () => window.removeEventListener('refresh-tables', fetchSubscriptions);
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('subscriptions')
      .select('*, schools(name, exam_credits_balance), plans(name, plan_type, price, billing_cycle)')
      .order('created_at', { ascending: false });
    setSubscriptions(data || []);
    setLoading(false);
  };

  const exportCSV = () => {
    const rows = filteredSubs.map(s => [
      s.schools?.name,
      s.plans?.name,
      s.plans?.plan_type,
      s.status,
      s.current_period_start ? new Date(s.current_period_start).toLocaleDateString() : '-',
      s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '-',
      s.schools?.exam_credits_balance ?? '-',
    ]);
    const header = ['School', 'Plan', 'Type', 'Status', 'Period Start', 'Period End', 'Credits Balance'];
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'subscriptions.csv';
    a.click();
  };

  const filteredSubs = subscriptions
    .filter(s => {
      const matchesSearch =
        s.schools?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.plans?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

  const totalPages = Math.max(1, Math.ceil(filteredSubs.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedSubs = filteredSubs.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <div className="space-y-6">
    

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border mb-4">
        <div className="relative w-full md:max-w-[260px] shrink-0">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
          />
        </div>

        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
          {(searchQuery || filterStatus !== 'all') ? (
            <>
              <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}><X size={10} /></button>
                </span>
              )}
              {filterStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-500 text-[11px] font-medium border border-violet-500/20 shrink-0 capitalize">
                  {filterStatus}
                  <button onClick={() => setFilterStatus('all')}><X size={10} /></button>
                </span>
              )}
            </>
          ) : (
            <span className="text-[12px] text-text-muted italic">{filteredSubs.length} subscription{filteredSubs.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-surface-hover border border-border text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
              <option value="incomplete">Incomplete</option>
              <option value="expired">Expired</option>
            </select>
            <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-hover border border-border text-text-muted text-[12px] hover:text-text-main hover:border-accent-primary/30 transition-colors"
          >
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted text-sm">Loading…</div>
        ) : pagedSubs.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center mx-auto mb-3">
              <CreditCard size={28} />
            </div>
            <p className="text-text-muted text-sm">No subscriptions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-surface-hover/50">
                  {['School', 'Plan', 'Type', 'Status', 'Credits Balance', 'Period', 'Razorpay ID'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedSubs.map(sub => (
                  <tr key={sub.id} onClick={() => sub.school_id && router.push(`/schools/${sub.school_id}`)} className="hover:bg-surface-hover/40 transition-colors cursor-pointer group">
                    <td className="px-4 py-3 text-sm font-semibold text-text-main whitespace-nowrap group-hover:text-accent-primary transition-colors">{sub.schools?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-main whitespace-nowrap">{sub.plans?.name ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted capitalize">
                        {sub.plans?.plan_type === 'time_based' ? <Calendar size={11} /> : <Coins size={11} />}
                        {sub.plans?.plan_type?.replace('_', ' ') ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${statusColors[sub.status] ?? ''}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-primary">
                        <Zap size={13} />{sub.schools?.exam_credits_balance ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">
                      {sub.current_period_start
                        ? `${new Date(sub.current_period_start).toLocaleDateString()} → ${sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : '∞'}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-text-muted font-mono max-w-[140px] truncate">
                      {sub.razorpay_subscription_id ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-[12px] text-text-muted">
              Page {safePage} of {totalPages} · {filteredSubs.length} total
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-hover disabled:opacity-40 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-hover disabled:opacity-40 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
