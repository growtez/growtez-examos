'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Plus, X, Download, Monitor, CheckCircle, Clock } from 'lucide-react';
import { TableRowsSkeleton } from '@/components/ui/Skeleton';

export interface AppVersionRecord {
    id: string;
    platform: string;
    latest_version: string;
    min_supported_version: string;
    download_url: string;
    release_notes: string | null;
    is_mandatory: boolean;
    is_active: boolean;
    created_at: string;
}

export default function UpdatesListPage() {
    const [updates, setUpdates] = useState<AppVersionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState<Partial<AppVersionRecord>>({
        platform: 'windows',
        latest_version: '',
        min_supported_version: '',
        download_url: '',
        release_notes: '',
        is_mandatory: false,
        is_active: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const supabase = createClient();

    useEffect(() => {
        fetchUpdates();
    }, []);

    const fetchUpdates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_versions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUpdates(data || []);
        } catch (err) {
            console.error('Failed to fetch updates:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');

        try {
            if (formData.is_active) {
                // Deactivate others for the same platform first
                const { error: updateErr } = await supabase
                    .from('app_versions')
                    .update({ is_active: false })
                    .eq('platform', formData.platform);
                    
                if (updateErr) throw updateErr;
            }

            if (formData.id) {
                // Update existing
                const { error } = await supabase
                    .from('app_versions')
                    .update({
                        platform: formData.platform,
                        latest_version: formData.latest_version,
                        min_supported_version: formData.min_supported_version,
                        download_url: formData.download_url,
                        release_notes: formData.release_notes,
                        is_mandatory: formData.is_mandatory,
                        is_active: formData.is_active,
                    })
                    .eq('id', formData.id);
                if (error) throw error;
            } else {
                // Create new
                const { error } = await supabase
                    .from('app_versions')
                    .insert([{
                        platform: formData.platform,
                        latest_version: formData.latest_version,
                        min_supported_version: formData.min_supported_version,
                        download_url: formData.download_url,
                        release_notes: formData.release_notes,
                        is_mandatory: formData.is_mandatory,
                        is_active: formData.is_active,
                    }]);
                if (error) throw error;
            }

            setIsFormOpen(false);
            setFormData({
                platform: 'windows',
                latest_version: '',
                min_supported_version: '',
                download_url: '',
                release_notes: '',
                is_mandatory: false,
                is_active: true
            });
            fetchUpdates();
        } catch (err: any) {
            setErrorMsg(err.message || 'An error occurred while saving the update.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditForm = (update: AppVersionRecord) => {
        setFormData(update);
        setIsFormOpen(true);
    };

    const filteredUpdates = updates.filter(u => 
        u.latest_version.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (u.release_notes && u.release_notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-4">
            
            {/* List Control */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border">
                {/* Search Box */}
                <div className="relative w-full md:max-w-[260px] shrink-0">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Search versions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            setFormData({
                                platform: 'windows',
                                latest_version: '',
                                min_supported_version: '',
                                download_url: '',
                                release_notes: '',
                                is_mandatory: false,
                                is_active: true
                            });
                            setIsFormOpen(true);
                        }}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent-primary text-white hover:bg-accent-secondary transition-colors text-[12px] font-bold cursor-pointer border-none shadow-[0_2px_6px_rgba(5,150,105,0.2)]"
                    >
                        <Plus size={14} /> Add Release
                    </button>
                </div>
            </div>

            {/* Updates List Container */}
            <div className="w-full bg-surface rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[950px]">
                    <thead>
                        <tr className="border-b border-border bg-surface-hover">
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main w-[20%]">Version</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main w-[15%]">Platform</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main w-[25%]">Release Notes</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main w-[15%]">Status</th>
                            <th className="py-3 px-4 text-[12px] font-bold text-text-main text-right w-[25%]">Date Added</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <TableRowsSkeleton rows={5} columns={5} />
                        ) : filteredUpdates.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-text-muted text-[13px]">
                                    No updates found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredUpdates.map((update) => (
                                <tr
                                    key={update.id}
                                    onClick={() => openEditForm(update)}
                                    className="group even:bg-bg hover:bg-surface-hover border-b border-border/40 last:border-b-0 transition-colors cursor-pointer"
                                >
                                    <td className="py-2.5 px-4 align-middle">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-text-main text-[13px] group-hover:text-accent-primary transition-colors">
                                                v{update.latest_version}
                                            </span>
                                            {update.min_supported_version && (
                                                <span className="text-[11px] text-text-muted">
                                                    Min: v{update.min_supported_version}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-2.5 px-4 align-middle">
                                        <div className="flex items-center gap-1.5 text-[12px] text-text-main font-medium capitalize">
                                            <Monitor size={14} className="text-gray-500" />
                                            {update.platform}
                                        </div>
                                    </td>
                                    <td className="py-2.5 px-4 align-middle">
                                        <span className="text-[12px] text-text-muted truncate max-w-[250px] block" title={update.release_notes || ''}>
                                            {update.release_notes || '—'}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-4 align-middle">
                                        <div className="flex flex-col items-start gap-1">
                                            {update.is_active ? (
                                                <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-600 font-bold text-[11px] px-2 py-0.5 rounded-full border border-green-500/20">
                                                    <CheckCircle size={10} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-gray-500/10 text-gray-500 font-bold text-[11px] px-2 py-0.5 rounded-full border border-gray-500/20">
                                                    <Clock size={10} /> History
                                                </span>
                                            )}
                                            {update.is_mandatory && (
                                                <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                                    Mandatory
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-2.5 px-4 align-middle text-right">
                                        <div className="flex items-center justify-end gap-3 text-[12px]">
                                            <span className="text-text-muted">{new Date(update.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-surface rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-hover">
                            <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                                <Download size={18} className="text-accent-primary"/>
                                {formData.id ? 'Edit Update Release' : 'Publish New Update'}
                            </h2>
                            <button onClick={() => setIsFormOpen(false)} className="text-text-muted hover:text-red-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleFormSubmit} className="overflow-y-auto p-6 flex flex-col gap-4">
                            {errorMsg && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Platform</label>
                                    <select
                                        required
                                        value={formData.platform}
                                        onChange={e => setFormData({ ...formData, platform: e.target.value })}
                                        className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary"
                                    >
                                        <option value="windows">Windows</option>
                                        <option value="mac">macOS</option>
                                        <option value="linux">Linux</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Latest Version *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 0.2.1"
                                        value={formData.latest_version}
                                        onChange={e => setFormData({ ...formData, latest_version: e.target.value })}
                                        className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary placeholder-text-muted/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Min Supported Version</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 0.2.0 (Optional)"
                                    value={formData.min_supported_version || ''}
                                    onChange={e => setFormData({ ...formData, min_supported_version: e.target.value })}
                                    className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary placeholder-text-muted/50"
                                />
                                <p className="text-[10px] text-text-muted">Users below this version will be forced to update.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Download URL *</label>
                                <input
                                    type="url"
                                    required
                                    placeholder="https://..."
                                    value={formData.download_url}
                                    onChange={e => setFormData({ ...formData, download_url: e.target.value })}
                                    className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary placeholder-text-muted/50"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Release Notes</label>
                                <textarea
                                    rows={4}
                                    placeholder="What's new in this version?"
                                    value={formData.release_notes || ''}
                                    onChange={e => setFormData({ ...formData, release_notes: e.target.value })}
                                    className="w-full px-3 py-2 bg-surface-hover border border-border rounded-lg text-sm text-text-main focus:outline-none focus:border-accent-primary resize-none placeholder-text-muted/50"
                                />
                            </div>

                            <div className="flex gap-6 mt-2 pt-4 border-t border-border">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-accent-primary rounded border-border focus:ring-accent-primary"
                                    />
                                    <span className="text-sm font-medium text-text-main group-hover:text-accent-primary transition-colors">Set as Active</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_mandatory}
                                        onChange={e => setFormData({ ...formData, is_mandatory: e.target.checked })}
                                        className="w-4 h-4 text-accent-primary rounded border-border focus:ring-accent-primary"
                                    />
                                    <span className="text-sm font-medium text-text-main group-hover:text-accent-primary transition-colors">Mandatory Update</span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-accent-primary text-white text-sm font-bold rounded-lg hover:bg-accent-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_6px_rgba(5,150,105,0.2)]"
                                >
                                    {isSubmitting ? 'Saving...' : formData.id ? 'Update Release' : 'Publish Release'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
