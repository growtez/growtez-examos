'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  CreditCard, Search, X, ChevronLeft, ChevronRight,
  Calendar, FileText, Download
} from 'lucide-react';

const typeLabels: Record<string, string> = {
  subscription_charge: 'Subscription',
  credit_purchase: 'Credits',
  exam_fee: 'Exam Conduction'
};

const typeColors: Record<string, string> = {
  subscription_charge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  credit_purchase: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  exam_fee: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

export default function TransactionsDashboard() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    fetchTransactions();
    window.addEventListener('refresh-tables', fetchTransactions);
    return () => window.removeEventListener('refresh-tables', fetchTransactions);
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('payment_history')
      .select('*, schools(name), exams(title)')
      .order('created_at', { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  };

  const exportCSV = () => {
    const rows = filteredTx.map(t => [
      t.schools?.name,
      typeLabels[t.payment_type] || t.payment_type,
      t.exams?.title || '-',
      t.amount_paid,
      t.created_at ? new Date(t.created_at).toLocaleDateString() : '-',
      t.razorpay_payment_id
    ]);
    const header = ['School', 'Type', 'Exam', 'Amount (INR)', 'Date', 'Razorpay Payment ID'];
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'transactions.csv';
    a.click();
  };

  const filteredTx = transactions
    .filter(t => {
      const matchesSearch =
        t.schools?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.exams?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.razorpay_payment_id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || t.payment_type === filterType;
      return matchesSearch && matchesType;
    });

  const totalPages = Math.max(1, Math.ceil(filteredTx.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedTx = filteredTx.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border mb-4">
        <div className="relative w-full md:max-w-[260px] shrink-0">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
          />
        </div>

        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
          {(searchQuery || filterType !== 'all') ? (
            <>
              <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}><X size={10} /></button>
                </span>
              )}
              {filterType !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-500 text-[11px] font-medium border border-violet-500/20 shrink-0 capitalize">
                  {typeLabels[filterType] || filterType}
                  <button onClick={() => setFilterType('all')}><X size={10} /></button>
                </span>
              )}
            </>
          ) : (
            <span className="text-[12px] text-text-muted italic">{filteredTx.length} transaction{filteredTx.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(1); }}
              className="pl-3 pr-8 py-1.5 rounded-lg bg-surface-hover border border-border text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary appearance-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="subscription_charge">Subscription</option>
              <option value="credit_purchase">Credits</option>
              <option value="exam_fee">Exam Conduction</option>
            </select>
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
        ) : pagedTx.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center mx-auto mb-3">
              <CreditCard size={28} />
            </div>
            <p className="text-text-muted text-sm">No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-surface-hover/50">
                  {['School', 'Type', 'Details / Exam', 'Amount', 'Date', 'Razorpay ID'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedTx.map(tx => (
                  <tr key={tx.id} onClick={() => tx.school_id && router.push(`/super-admin/schools/${tx.school_id}`)} className="hover:bg-surface-hover/40 transition-colors cursor-pointer group">
                    <td className="px-4 py-3 text-sm font-semibold text-text-main whitespace-nowrap group-hover:text-accent-primary transition-colors">{tx.schools?.name ?? '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${typeColors[tx.payment_type] ?? ''}`}>
                        {typeLabels[tx.payment_type] || tx.payment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-main whitespace-nowrap">
                      {tx.payment_type === 'exam_fee' ? (
                        <span className="flex items-center gap-1">
                          <FileText size={12} className="text-text-muted" />
                          {tx.exams?.title || 'Exam Conduction'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-text-muted" />
                          Legacy Credit / Subscription Purchase
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-text-main whitespace-nowrap">
                      ₹{tx.amount_paid}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">
                      {tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-[11px] text-text-muted font-mono max-w-[140px] truncate">
                      {tx.razorpay_payment_id ?? '—'}
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
              Page {safePage} of {totalPages} · {filteredTx.length} total
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
