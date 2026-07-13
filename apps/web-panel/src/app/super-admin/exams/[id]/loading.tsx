export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-1/3"></div>
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-24"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-32"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl"></div>
        ))}
      </div>
      <div className="h-[400px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl mt-8"></div>
    </div>
  );
}
