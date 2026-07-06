export default function SchoolAdminPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">School Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-500">
          <h3 className="text-lg font-medium text-slate-700">Total Students</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-green-500">
          <h3 className="text-lg font-medium text-slate-700">Active Exams</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-purple-500">
          <h3 className="text-lg font-medium text-slate-700">Question Bank</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-orange-500">
          <h3 className="text-lg font-medium text-slate-700">Teachers</h3>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
      </div>
    </div>
  );
}
