export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="bg-blue-900 text-white p-4">
        <h1 className="text-xl font-bold">School Administration Panel</h1>
      </header>
      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r p-4 hidden md:block">
          <nav className="space-y-2">
            <a href="#" className="block p-2 rounded bg-blue-50 text-blue-700 font-medium">Dashboard</a>
            <a href="#" className="block p-2 rounded hover:bg-slate-50">Teachers</a>
            <a href="#" className="block p-2 rounded hover:bg-slate-50">Students (CSV)</a>
            <a href="#" className="block p-2 rounded hover:bg-slate-50">Exams</a>
            <a href="#" className="block p-2 rounded hover:bg-slate-50">Question Banks</a>
          </nav>
        </aside>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
