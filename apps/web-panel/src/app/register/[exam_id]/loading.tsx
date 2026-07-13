export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden animate-pulse">
        <div className="h-32 bg-gray-200"></div>
        <div className="p-8">
          <div className="h-8 bg-gray-200 w-3/4 mx-auto rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-200 w-1/2 mx-auto rounded-lg mb-8"></div>
          
          <div className="space-y-4">
            <div className="h-12 bg-gray-100 rounded-xl"></div>
            <div className="h-12 bg-gray-100 rounded-xl"></div>
            <div className="h-12 bg-gray-100 rounded-xl"></div>
          </div>
          
          <div className="h-12 bg-gray-300 rounded-xl w-full mt-8"></div>
        </div>
      </div>
    </div>
  );
}
