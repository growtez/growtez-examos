import { Loader2 } from 'lucide-react';

export default function SchoolAdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 animate-in fade-in duration-500">
      <Loader2 className="w-10 h-10 animate-spin text-accent-primary" />
      <p className="text-sm font-semibold text-text-muted animate-pulse">Loading...</p>
    </div>
  );
}
