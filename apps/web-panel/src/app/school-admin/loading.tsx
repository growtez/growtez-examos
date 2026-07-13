export default function SchoolAdminLoading() {
  const stats = [1, 2, 3, 4];

  return (
    <div className="animate-pulse">
      <div className="mb-8 border-l-4 border-gray-300 pl-4">
        <div className="h-8 bg-gray-300 w-48 mb-2 rounded"></div>
        <div className="h-4 bg-gray-200 w-64 rounded"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {stats.map((i) => (
          <div key={i} className="border-2 p-5 bg-surface border-gray-200">
            <div className="h-3 bg-gray-200 w-24 mb-3 rounded"></div>
            <div className="h-8 bg-gray-300 w-16 mb-4 rounded"></div>
            <div className="h-1 bg-gray-200 w-full rounded"></div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="bg-surface border-2 border-gray-200 p-6">
        <div className="border-l-4 border-gray-300 pl-3 mb-4">
          <div className="h-5 bg-gray-300 w-32 rounded"></div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="h-10 bg-gray-300 w-36 rounded"></div>
          <div className="h-10 bg-gray-200 w-40 rounded"></div>
          <div className="h-10 bg-gray-200 w-40 rounded"></div>
        </div>
      </div>
    </div>
  );
}
