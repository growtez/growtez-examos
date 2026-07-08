import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { School, Users, FileText, Plus, List } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default async function SuperAdminDashboard() {
  const supabase = createClient();

  // Fetch stats
  const { count: schoolCount } = await supabase.from('schools').select('*', { count: 'exact', head: true });
  const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
  const { count: examCount } = await supabase.from('exams').select('*', { count: 'exact', head: true });

  const stats = [
    {
      label: 'Total Schools',
      value: schoolCount ?? 0,
      icon: <School size={24} />,
      color: 'blue' as const,
      path: '/schools',
    },
    {
      label: 'Total Students',
      value: studentCount ?? 0,
      icon: <Users size={24} />,
      color: 'green' as const,
    },
    {
      label: 'Total Exams',
      value: examCount ?? 0,
      icon: <FileText size={24} />,
      color: 'purple' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-main mb-1">Dashboard Overview</h2>
        <p className="text-text-muted text-sm">Welcome to the ParikshaOS command center.</p>
      </div>

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
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></span>
              <span className="text-xs font-medium text-accent-primary uppercase tracking-wider">Live</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Link 
                href="/schools/new"
                className="flex gap-3 p-2 rounded-xl bg-surface-hover items-center cursor-pointer transition-colors hover:bg-border group/sub"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis text-text-main group-hover/sub:text-accent-primary transition-colors">
                    Onboard New School
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Create a new school and admin account
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-8 h-8 rounded-lg bg-accent-primary/10 text-accent-primary flex items-center justify-center">
                    <Plus size={16} />
                  </div>
                </div>
              </Link>
              
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
