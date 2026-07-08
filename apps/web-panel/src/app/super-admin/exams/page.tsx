import { FileText, Plus, Search } from 'lucide-react';

export default function ExamsDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Exams Management</h1>
          <p className="text-sm text-text-muted">Monitor and track exams across all registered schools.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-xl text-sm font-semibold hover:bg-accent-primary/95 transition-colors">
          <Plus size={16} /> Create Global Template
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 w-full bg-surface p-3 md:p-2 rounded-xl shadow-sm border border-border">
        <div className="relative w-full md:max-w-[260px] shrink-0">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search Exams..."
            className="w-full py-2 pl-4 pr-10 bg-surface-hover border border-border rounded-full text-text-main text-[13px] focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all"
          />
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-text-muted italic">
          Coming Soon: Global exam metrics, template builders, and unified scheduling.
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center mx-auto mb-4">
          <FileText size={32} />
        </div>
        <h3 className="text-lg font-bold text-text-main mb-1">No Exams Logged</h3>
        <p className="text-text-muted text-sm max-w-sm mx-auto mb-6">
          Schools build and run their exams independently. A global unified exam log is under development.
        </p>
      </div>
    </div>
  );
}
