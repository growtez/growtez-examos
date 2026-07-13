export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 bg-surface-hover rounded-xl w-1/4"></div>
        <div className="h-10 bg-surface-hover rounded-xl w-32"></div>
      </div>
      
      <div className="flex gap-6">
        {/* Sidebar skeleton */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-surface border border-border rounded-xl"></div>
          ))}
        </div>
        
        {/* Main content skeleton */}
        <div className="flex-1 space-y-6">
          <div className="h-32 bg-surface border border-border rounded-2xl p-6">
             <div className="h-6 bg-surface-hover rounded w-1/3 mb-4"></div>
             <div className="h-4 bg-surface-hover rounded w-full mb-2"></div>
             <div className="h-4 bg-surface-hover rounded w-5/6"></div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-surface border border-border rounded-2xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
