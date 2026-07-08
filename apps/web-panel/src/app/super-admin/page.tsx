import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { School, Users, FileText, Plus, List } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default async function SuperAdminDashboard() {
  const supabase = createAdminClient();

  // Fetch stats concurrently
  const [
    { count: schoolCount },
    { count: studentCount },
    { count: examCount }
  ] = await Promise.all([
    supabase.from('schools').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('exams').select('*', { count: 'exact', head: true })
  ]);

  const stats = [
    {
      label: 'Total Schools',
      value: schoolCount ?? 0,
      icon: <School size={24} />,
      color: 'blue' as const,
      path: '/schools',
    },
    {
      label: 'Total Exams',
      value: examCount ?? 0,
      icon: <FileText size={24} />,
      color: 'purple' as const,
    },
    {
      label: 'Total Students',
      value: studentCount ?? 0,
      icon: <Users size={24} />,
      color: 'green' as const,
    }
  ];

  return (
    <div className="space-y-6">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            path={stat.path}
          />
        ))}
      </div>

      {/* Quick Actions & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="cursor-pointer hover:border-accent-primary/40 transition-colors group/card">
          <CardHeader className="group-hover/card:text-accent-primary transition-colors">
            <CardTitle>Quick Actions</CardTitle>
            
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Link 
                href="/schools"
                className="flex gap-3 p-2 rounded-xl bg-surface-hover items-center cursor-pointer transition-colors hover:bg-border group/sub"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis text-text-main group-hover/sub:text-accent-primary transition-colors">
                    View All Schools
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Manage existing schools in the system
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <List size={16} />
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
