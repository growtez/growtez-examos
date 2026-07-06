export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="bg-slate-900 text-white p-4">
        <h1 className="text-xl font-bold">Growtez ExamOS - Super Admin Panel</h1>
      </header>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
