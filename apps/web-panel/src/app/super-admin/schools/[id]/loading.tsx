export default function SchoolDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="h-4 w-48 bg-surface-hover rounded"></div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-hover shrink-0"></div>
            <div>
              <div className="h-7 w-64 bg-surface-hover rounded mb-2"></div>
              <div className="h-4 w-32 bg-surface-hover rounded"></div>
            </div>
          </div>
          <div className="h-6 w-20 bg-surface-hover rounded-xl"></div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-hover shrink-0"></div>
            <div className="w-full">
              <div className="h-3 w-24 bg-surface-hover rounded mb-2"></div>
              <div className="h-6 w-12 bg-surface-hover rounded"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School Info Skeleton */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-6 h-[250px]">
                <div className="h-5 w-40 bg-surface-hover rounded mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i}>
                            <div className="h-3 w-24 bg-surface-hover rounded mb-2"></div>
                            <div className="h-4 w-48 bg-surface-hover rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* School Admin Skeleton */}
        <div className="lg:col-span-1">
            <div className="bg-surface border border-border rounded-2xl p-6 h-[250px]">
                <div className="h-5 w-32 bg-surface-hover rounded mb-8"></div>
                <div className="flex flex-col items-center justify-center pt-4">
                    <div className="w-16 h-16 rounded-full bg-surface-hover mb-4"></div>
                    <div className="h-4 w-32 bg-surface-hover rounded mb-2"></div>
                    <div className="h-3 w-40 bg-surface-hover rounded"></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
