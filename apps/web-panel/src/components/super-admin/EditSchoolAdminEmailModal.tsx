'use client';

import { useState } from 'react';
import { updateSchoolAdminEmail } from '@/app/actions/school';
import { Mail, Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface EditSchoolAdminEmailModalProps {
  adminId: string;
  adminName?: string;
  currentEmail: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newEmail: string) => void;
}

export default function EditSchoolAdminEmailModal({
  adminId,
  adminName,
  currentEmail,
  isOpen,
  onClose,
  onSuccess
}: EditSchoolAdminEmailModalProps) {
  const [newEmail, setNewEmail] = useState(currentEmail || '');
  const [updateContactEmail, setUpdateContactEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || newEmail.trim() === currentEmail) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const result = await updateSchoolAdminEmail(adminId, newEmail, updateContactEmail);
      if (!result.success) {
        setError(result.error || 'Failed to update email');
      } else {
        setSuccess(true);
        if (onSuccess) onSuccess(newEmail.trim().toLowerCase());
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('refresh-tables'));
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-text-muted hover:text-text-main p-1 rounded-lg hover:bg-surface-hover transition-colors bg-transparent border-none cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary shrink-0">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-text-main">Change Admin Email</h3>
            {adminName && <p className="text-xs text-text-muted">School Admin: <span className="font-semibold text-text-main">{adminName}</span></p>}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>Email updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">
              Current Email
            </label>
            <input
              type="text"
              readOnly
              value={currentEmail}
              className="w-full px-3.5 py-2.5 bg-bg/50 border border-border rounded-xl text-xs text-text-muted font-medium cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-muted mb-1.5 uppercase tracking-wider">
              New Email Address *
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="admin@school.com"
              className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm text-text-main focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-text-main pt-1">
            <input
              type="checkbox"
              checked={updateContactEmail}
              onChange={(e) => setUpdateContactEmail(e.target.checked)}
              className="w-4 h-4 rounded border-border text-accent-primary focus:ring-accent-primary"
            />
            <span>Also update school contact email</span>
          </label>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text-main bg-surface-hover rounded-xl transition-colors cursor-pointer border-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newEmail.trim() || newEmail.trim() === currentEmail}
              className="px-5 py-2 text-xs font-bold text-white bg-accent-primary hover:bg-accent-hover rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer border-none shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Email'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
