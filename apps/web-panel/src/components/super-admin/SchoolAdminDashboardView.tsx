'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Users, Users2, FileText, ArrowRight, Activity } from 'lucide-react';
import Link from 'next/link';

export function SchoolAdminDashboardView({ schoolId }: { schoolId: string }) {
  const supabase = createClient();
  const [schoolName, setSchoolName] = useState('Your School');
  const [stats, setStats] = useState([
    { label: 'Total Students', value: 0, color: 'text-[#008080]', bg: 'bg-[#e0f2f2]', border: 'border-[#b2d8d8]', icon: Users2, iconBg: 'bg-[#b2d8d8]/30' },
    { label: 'Teachers', value: 0, color: 'text-[#006666]', bg: 'bg-[#cceded]', border: 'border-[#99d4d4]', icon: Users, iconBg: 'bg-[#99d4d4]/30' },
    { label: 'Total Exams', value: 0, color: 'text-[#004d4d]', bg: 'bg-[#b3e0e0]', border: 'border-[#80cccc]', icon: FileText, iconBg: 'bg-[#80cccc]/30' },
    { label: 'Active Exams', value: 0, color: 'text-white', bg: 'bg-[#008080]', border: 'border-[#006666]', icon: Activity, iconBg: 'bg-white/20' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [
          { data: school },
          { count: sCount },
          { count: tCount },
          { count: eCount },
          { count: aeCount }
        ] = await Promise.all([
          supabase.from('schools').select('name').eq('id', schoolId).single(),
          supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
          supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
          supabase.from('exams').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
          supabase.from('exams').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).in('status', ['published', 'active'])
        ]);

        if (school?.name) setSchoolName(school.name);

        setStats([
          { label: 'Total Students', value: sCount ?? 0, color: 'text-[#008080]', bg: 'bg-[#e0f2f2]', border: 'border-[#b2d8d8]', icon: Users2, iconBg: 'bg-[#b2d8d8]/30' },
          { label: 'Teachers', value: tCount ?? 0, color: 'text-[#006666]', bg: 'bg-[#cceded]', border: 'border-[#99d4d4]', icon: Users, iconBg: 'bg-[#99d4d4]/30' },
          { label: 'Total Exams', value: eCount ?? 0, color: 'text-[#004d4d]', bg: 'bg-[#b3e0e0]', border: 'border-[#80cccc]', icon: FileText, iconBg: 'bg-[#80cccc]/30' },
          { label: 'Active Exams', value: aeCount ?? 0, color: 'text-white', bg: 'bg-[#008080]', border: 'border-[#006666]', icon: Activity, iconBg: 'bg-white/20' },
        ]);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [schoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#008080]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const isDark = i === 3;
          return (
            <div key={stat.label} className={`relative overflow-hidden rounded-2xl border ${stat.border} ${stat.bg} p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 duration-300 group`}>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <span className={`text-sm font-semibold ${isDark ? 'text-white/80' : 'text-[#555555]'}`}>{stat.label}</span>
                  <p className={`text-3xl font-extrabold mt-2 ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg} transition-transform group-hover:scale-110 duration-300`}>
                  <Icon className={`w-5 h-5 ${isDark ? 'text-white' : stat.color}`} />
                </div>
              </div>
              <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${stat.iconBg} blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
