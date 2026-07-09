'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { School, FileText, Users } from 'lucide-react';

export function HeaderStats() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    schools: 0,
    exams: 0,
    students: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: schoolCount },
          { count: examCount },
          { count: studentCount }
        ] = await Promise.all([
          supabase.from('schools').select('*', { count: 'exact', head: true }),
          supabase.from('exams').select('*', { count: 'exact', head: true }),
          supabase.from('students').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          schools: schoolCount ?? 0,
          exams: examCount ?? 0,
          students: studentCount ?? 0
        });
      } catch (err) {
        console.error('Failed to fetch header stats', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="hidden lg:flex items-center gap-4">
        <div className="h-8 w-24 bg-surface-hover rounded animate-pulse" />
        <div className="h-8 w-24 bg-surface-hover rounded animate-pulse" />
        <div className="h-8 w-24 bg-surface-hover rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Total Schools</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-text-main leading-none">{stats.schools}</span>
          </div>
        </div>
      </div>
      <div className="w-px h-6 bg-border" />
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Total Exams</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-text-main leading-none">{stats.exams}</span>
          </div>
        </div>
      </div>
      <div className="w-px h-6 bg-border" />
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Total Students</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-text-main leading-none">{stats.students}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
