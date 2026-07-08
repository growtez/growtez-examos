'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Download, X, ChevronLeft, ChevronRight, School as SchoolIcon, Globe, Plus, Hash } from 'lucide-react';
import { TableRowsSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import DeleteSchoolButton from './DeleteSchoolButton';

export default function SchoolsListPage() {
    const router = useRouter();
    const [schools, setSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(8);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('schools')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSchools(data || []);
        } catch (err) {
            console.error('Failed to fetch schools:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredSchools = schools
        .filter(sch => {
            const matchesSearch = sch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (sch.domain && sch.domain.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesFilter = filterStatus === 'all' || 
                (filterStatus === 'active' && sch.is_active !== false) ||
                (filterStatus === 'inactive' && sch.is_active === false);

            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'status') return (a.is_active !== false ? 'active' : 'inactive').localeCompare(b.is_active !== false ? 'active' : 'inactive');
            return 0;
        });

    const totalPages = Math.max(1, Math.ceil(filteredSchools.length / perPage));
    const safePage = Math.min(page, totalPages);
    const pagedSchools = filteredSchools.slice((safePage - 1) * perPage, safePage * perPage);

    const getPaginationPages = () => {
        if (totalPages <= 3) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (safePage === totalPages) {
            return [1, '...', totalPages];
        }
        if (safePage === totalPages - 1) {
            return [safePage - 1, safePage, totalPages];
        }
        return [safePage, '...', totalPages];
    };

    const toggleSort = (newSort: string) => {
        if (sortBy === newSort) {
            setSortBy(newSort === 'newest' ? 'oldest' : newSort === 'name' ? 'newest' : 'newest');
        } else {
            setSortBy(newSort);
        }
    };

    const getSortIcon = (field: string) => {
        if (sortBy === field) return <ArrowUp size={14} />;
        if (field === 'newest' && sortBy === 'oldest') return <ArrowDown size={14} />;
        return <ArrowUpDown size={14} className="opacity-30" />;
    };

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Name,Domain,Status,Max Students,Created At\n"
            + filteredSchools.map(r => `${r.name},${r.domain || ''},${r.is_active !== false ? 'Active' : 'Inactive'},${r.max_students ?? 500},${new Date(r.created_at).toLocaleDateString()}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `schools_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            
            {/* List Control */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border">
                {/* Search Box */}
                <div className="relative w-full md:max-w-[260px] shrink-0">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Search Schools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                    />
                </div>

                {/* Inline Active Filters */}
                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0 px-2 md:border-x md:border-border/50 py-1 md:py-0">
                    {(searchQuery || filterStatus !== 'all' || sortBy !== 'newest') ? (
                        <>
                            <span className="text-[11px] text-text-muted font-medium uppercase tracking-wider shrink-0 mr-1">Active:</span>
                            {searchQuery && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    "{searchQuery}"
                                    <button onClick={() => setSearchQuery('')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            {filterStatus !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                                    <button onClick={() => setFilterStatus('all')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            {sortBy !== 'newest' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-medium border border-blue-500/20 shrink-0">
                                    {sortBy === 'oldest' ? 'Oldest' : sortBy === 'name' ? 'A-Z' : sortBy === 'status' ? 'Status' : sortBy}
                                    <button onClick={() => setSortBy('newest')} className="hover:text-blue-700 focus:outline-none flex items-center justify-center bg-transparent border-none cursor-pointer p-0 ml-1"><X size={10} /></button>
                                </span>
                            )}
                            <button 
                                onClick={() => { setSearchQuery(''); setFilterStatus('all'); setSortBy('newest'); setPage(1); }}
                                className="text-[11px] text-text-muted hover:text-red-500 transition-colors ml-1 bg-transparent border-none cursor-pointer font-medium shrink-0"
                            >
                                Clear
                            </button>
                        </>
                    ) : (
                        <span className="text-[11px] text-text-muted italic opacity-50">No active filters</span>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between md:justify-start gap-1 shrink-0 md:border-x md:border-border/50 px-3 py-1.5 md:py-0 w-full md:w-auto">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                        <ChevronLeft size={14} />
                    </button>
                    <div className="flex items-center justify-center gap-1 w-[80px]">
                        {getPaginationPages().map((p, i) => p === '...' ? (
                            <div key={`ellipsis-${i}`} className="w-6 h-6 flex items-center justify-center text-[11px] text-text-muted">…</div>
                        ) : (
                            <button key={p} onClick={() => setPage(p as number)} className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-semibold transition-colors border-none cursor-pointer ${safePage === p ? 'bg-accent-primary text-white' : 'text-text-muted hover:bg-surface-hover bg-transparent'}`}>{p as number}</button>
                        ))}
                    </div>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-transparent border-none cursor-pointer">
                        <ChevronRight size={14} />
                    </button>
                </div>

                {/* Per-page & Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                    <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="py-1.5 px-2 rounded-lg border border-border bg-surface text-text-main text-[12px] focus:outline-none focus:ring-1 focus:ring-accent-primary cursor-pointer flex-1 md:flex-none">
                        {[8, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
                    </select>
                    <div className="relative group flex-1 md:flex-none">
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-surface text-text-main hover:bg-surface-hover transition-colors text-[12px] font-medium"
                        >
                            <Filter size={14} className="text-accent-primary" /> Filter
                        </button>
                        <div className={`absolute right-0 top-full mt-2 w-32 bg-surface border border-border rounded-xl shadow-lg transition-all z-50 flex flex-col overflow-hidden py-1 ${
                            isFilterOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
                        }`}>
                            {['all', 'active', 'inactive'].map(status => (
                                <button key={status} onClick={() => { setFilterStatus(status); setIsFilterOpen(false); }} className={`px-4 py-2 text-left text-[13px] hover:bg-surface-hover transition-colors ${filterStatus === status ? 'text-accent-primary font-medium bg-blue-500/5' : 'text-text-main'}`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleExport}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors text-[12px] font-medium cursor-pointer border-none flex-1 md:flex-none"
                    >
                        <Download size={14} /> Export
                    </button>
                </div>
            </div>

            {/* Schools List Container */}
            <div className="w-full bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                {/* Desktop View Table */}
                <table className="hidden md:table w-full text-left border-collapse whitespace-nowrap table-fixed">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[30%]" onClick={() => toggleSort('name')}>
                                <div className="flex items-center gap-2">
                                    School Name {getSortIcon('name')}
                                </div>
                            </th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent cursor-pointer hover:bg-surface-hover transition-colors w-[15%]" onClick={() => toggleSort('status')}>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    Status {getSortIcon('status')}
                                </div>
                            </th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[25%]">Domain</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent w-[15%]">Max Students</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main bg-transparent text-right w-[15%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <TableRowsSkeleton rows={perPage} columns={5} />
                        ) : filteredSchools.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-text-muted text-[13px]">
                                    No schools found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            <>
                                {pagedSchools.map((sch) => (
                                    <tr
                                        key={sch.id}
                                        onClick={() => router.push(`/schools/${sch.id}`)}
                                        className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors cursor-pointer"
                                    >
                                        <td className="py-2.5 px-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-500 text-[12px] shrink-0">
                                                    {sch.name[0].toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-text-main text-[13px] group-hover:text-accent-primary transition-colors max-w-[220px] truncate block" title={sch.name}>{sch.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4 align-middle">
                                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded bg-surface-hover border border-border/40 ${sch.is_active !== false ? 'text-green-500' : 'text-red-500'}`}>
                                                {sch.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 align-middle">
                                            <div className="flex items-center gap-2 text-[12px] text-text-main">
                                                <Globe size={12} className="text-blue-500 shrink-0" />
                                                <span className="max-w-[200px] inline-block truncate" title={sch.domain || '—'}>{sch.domain || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4 align-middle">
                                            <div className="flex items-center gap-2 text-[12px] text-text-main">
                                                <Hash size={12} className="text-blue-500 shrink-0" />
                                                <span>{sch.max_students ?? 500}</span>
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-4 align-middle text-right">
                                            <div 
                                                className="flex items-center justify-end gap-3"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <DeleteSchoolButton schoolId={sch.id} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {perPage - pagedSchools.length > 0 && Array.from({ length: perPage - pagedSchools.length }).map((_, idx) => (
                                    <tr key={`empty-${idx}`} className="border-b border-border/40 last:border-b-0 opacity-0 pointer-events-none">
                                        <td colSpan={5} className="py-2.5 px-4 align-middle">
                                            <div className="h-8"></div>
                                        </td>
                                    </tr>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="block md:hidden divide-y divide-border/40">
                    {loading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map(n => (
                                <div key={n} className="animate-pulse flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-border/40" />
                                            <div className="h-4 bg-border/40 rounded w-28" />
                                        </div>
                                        <div className="h-4 bg-border/40 rounded w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredSchools.length === 0 ? (
                        <div className="text-center py-10 text-text-muted text-[13px]">
                            No schools found matching your criteria.
                        </div>
                    ) : (
                        pagedSchools.map((sch) => (
                            <div
                                key={sch.id}
                                className="p-4 hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors flex flex-col gap-2.5"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-500 text-[12px] shrink-0">
                                            {sch.name[0].toUpperCase()}
                                        </div>
                                        <span className="font-semibold text-text-main text-[13px] group-hover:text-accent-primary transition-colors truncate" title={sch.name}>{sch.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded bg-surface-hover border border-border/40 ${sch.is_active !== false ? 'text-green-500' : 'text-red-500'}`}>
                                            {sch.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-1.5 pl-11">
                                    {sch.domain && (
                                        <div className="flex items-center gap-2 text-[12px] text-text-main">
                                            <Globe size={12} className="text-blue-500 shrink-0" />
                                            <span className="truncate">{sch.domain}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-[11px] text-text-muted mt-1 pt-1.5 border-t border-border/20">
                                        <span>Max Students: <span className="font-semibold text-text-main">{sch.max_students ?? 500}</span></span>
                                        <div className="flex items-center gap-3">
                                            <Link href={`/schools/${sch.id}`} prefetch={true} className="font-bold text-accent-primary">View</Link>
                                            <DeleteSchoolButton schoolId={sch.id} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
