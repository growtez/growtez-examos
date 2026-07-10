import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { OnboardingWizard } from '@/components/super-admin/OnboardingWizard';
import { HalfOnboardedSchools } from '@/components/super-admin/HalfOnboardedSchools';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { School, FileText, ArrowRight, CreditCard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SuperAdminDashboard({
  searchParams,
}: {
  searchParams: { resume?: string };
}) {
  const supabase = createAdminClient();

  // Fetch recent schools, exams, and subscriptions concurrently
  const [schoolsRes, examsRes, subsRes] = await Promise.all([
    supabase
      .from('schools')
      .select('id, name, domain, created_at')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('exams')
      .select('id, title, duration_minutes, created_at, schools(name)')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('subscriptions')
      .select('id, status, created_at, schools(name), plans(name)')
      .order('created_at', { ascending: false })
      .limit(4)
  ]);

  const recentSchools = schoolsRes.data || [];
  const recentExams = examsRes.data || [];
  const recentSubs = subsRes.data || [];

  return (
    <div className="space-y-6">
      
      {/* Row 1: Onboarding Card & Incomplete Onboarding Card (Commented out for now)
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="flex justify-center lg:justify-start items-start w-full">
          <OnboardingWizard 
            className="h-[420px] max-w-[480px] w-full" 
            resumeSchoolId={searchParams.resume}
          />
        </div>
        <div className="flex justify-center lg:justify-start items-start w-full">
          <HalfOnboardedSchools className="h-[420px] max-w-[480px] w-full" />
        </div>
      </div>
      */}

      {/* Row 2: Recent Schools, Recent Exams & Recent Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Card 1: Recent Schools */}
        <Card className="shadow-sm border-border flex flex-col w-full min-h-[300px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <School size={16} className="text-blue-500" />
              Recent Schools
            </CardTitle>
            <Link href="/schools" className="text-[11px] font-bold text-accent-primary flex items-center gap-0.5 hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="pt-3 flex-grow flex flex-col justify-start">
            <div className="divide-y divide-border/40 w-full">
              {recentSchools.length === 0 ? (
                <p className="text-xs text-text-muted py-8 text-center">No schools created yet.</p>
              ) : (
                recentSchools.map((school) => (
                  <Link 
                    key={school.id} 
                    href={`/schools/${school.id}`}
                    className="flex items-center justify-between py-2.5 hover:bg-surface-hover/30 rounded px-1 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-main truncate">{school.name}</p>
                      <p className="text-[10px] text-text-muted truncate">{school.domain || 'no domain'}</p>
                    </div>
                    <span className="text-[9px] text-text-muted shrink-0 ml-2">
                      {new Date(school.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Recent Exams */}
        <Card className="shadow-sm border-border flex flex-col w-full min-h-[300px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText size={16} className="text-purple-500" />
              Recent Exams
            </CardTitle>
            <Link href="/exams" className="text-[11px] font-bold text-accent-primary flex items-center gap-0.5 hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="pt-3 flex-grow flex flex-col justify-start">
            <div className="divide-y divide-border/40 w-full">
              {recentExams.length === 0 ? (
                <p className="text-xs text-text-muted py-8 text-center">No exams created yet.</p>
              ) : (
                recentExams.map((exam: any) => (
                  <Link 
                    key={exam.id} 
                    href={`/exams/${exam.id}`}
                    className="flex items-center justify-between py-2.5 hover:bg-surface-hover/30 rounded px-1 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-main truncate">{exam.title}</p>
                      <p className="text-[10px] text-text-muted truncate">
                        {exam.schools?.name || 'Unknown School'} • {exam.duration_minutes}m
                      </p>
                    </div>
                    <span className="text-[9px] text-text-muted shrink-0 ml-2">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Recent Subscriptions */}
        <Card className="shadow-sm border-border flex flex-col w-full min-h-[300px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-500" />
              Recent Subscriptions
            </CardTitle>
            <Link href="/subscriptions" className="text-[11px] font-bold text-accent-primary flex items-center gap-0.5 hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="pt-3 flex-grow flex flex-col justify-start">
            <div className="divide-y divide-border/40 w-full">
              {recentSubs.length === 0 ? (
                <p className="text-xs text-text-muted py-8 text-center">No subscriptions active.</p>
              ) : (
                recentSubs.map((sub: any) => (
                  <div 
                    key={sub.id} 
                    className="flex items-center justify-between py-2.5 px-1 hover:bg-surface-hover/30 rounded"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-main truncate">{sub.schools?.name || 'Unknown School'}</p>
                      <p className="text-[10px] text-text-muted truncate">
                        {sub.plans?.name || 'Custom Plan'} • <span className={`capitalize font-medium ${sub.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`}>{sub.status}</span>
                      </p>
                    </div>
                    <span className="text-[9px] text-text-muted shrink-0 ml-2">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
