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

  // Fetch recent schools, exams, and transactions concurrently
  const [schoolsRes, examsRes, txsRes] = await Promise.all([
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
      .from('payment_history')
      .select('id, amount_paid, payment_type, created_at, schools(name)')
      .order('created_at', { ascending: false })
      .limit(4)
  ]);

  const recentSchools = schoolsRes.data || [];
  const recentExams = examsRes.data || [];
  const recentTxs = txsRes.data || [];

  const txTypeLabels: Record<string, string> = {
    subscription_charge: 'Subscription',
    credit_purchase: 'Credits',
    exam_fee: 'Exam Conduction'
  };

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

      {/* Row 2: Recent Schools, Recent Exams & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Card 1: Recent Schools */}
        <Card className="shadow-sm border-border flex flex-col w-full min-h-[300px]">
          <CardHeader className="flex flex-row items-center justify-between pb-4 pt-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-primary/5 flex items-center justify-center border border-accent-primary/10 shadow-sm">
                <School size={16} className="text-accent-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold text-text-main leading-tight">
                  Recent Schools
                </CardTitle>
                <p className="text-[10px] font-medium text-text-muted mt-0.5">Latest onboarded schools</p>
              </div>
            </div>
            <Link href="/schools" className="group flex items-center gap-1.5 text-[10px] font-bold text-text-main hover:text-accent-primary bg-surface-hover hover:bg-accent-primary/10 border border-border/50 hover:border-accent-primary/30 px-3 py-1.5 rounded-full transition-all duration-300 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-accent-primary/20">
              View all <ArrowRight size={12} className="text-text-muted group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all duration-300" />
            </Link>
          </CardHeader>
          <CardContent className="pt-3 flex-grow flex flex-col justify-start">
            <div className="space-y-3 w-full">
              {recentSchools.length === 0 ? (
                <p className="text-xs text-text-muted py-8 text-center">No schools onboarded.</p>
              ) : (
                recentSchools.map((school) => (
                  <Link 
                    key={school.id} 
                    href={`/schools/${school.id}`}
                    className="block p-3 rounded-xl border border-border bg-surface hover:border-accent-primary hover:bg-accent-primary/5 hover:shadow-md hover:shadow-accent-primary/5 transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300 rounded-l-xl"></div>
                    <div className="flex justify-between items-start pl-1">
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="text-xs font-bold text-text-main group-hover:text-accent-primary transition-colors truncate">{school.name}</h4>
                        <p className="text-[10px] text-text-muted group-hover:text-accent-primary/70 font-medium mt-0.5 transition-colors truncate">{school.domain || 'No domain set'}</p>
                      </div>
                      <span className="text-[9px] font-medium text-text-muted group-hover:text-accent-primary shrink-0 bg-surface-hover/50 group-hover:bg-accent-primary/10 border border-border/50 group-hover:border-accent-primary/20 transition-all px-1.5 py-0.5 rounded">
                        {new Date(school.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Recent Exams */}
        <Card className="shadow-sm border-border flex flex-col w-full min-h-[300px]">
          <CardHeader className="flex flex-row items-center justify-between pb-4 pt-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-primary/5 flex items-center justify-center border border-accent-primary/10 shadow-sm">
                <FileText size={16} className="text-accent-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold text-text-main leading-tight">
                  Recent Exams
                </CardTitle>
                <p className="text-[10px] font-medium text-text-muted mt-0.5">Latest assessments</p>
              </div>
            </div>
            <Link href="/exams" className="group flex items-center gap-1.5 text-[10px] font-bold text-text-main hover:text-accent-primary bg-surface-hover hover:bg-accent-primary/10 border border-border/50 hover:border-accent-primary/30 px-3 py-1.5 rounded-full transition-all duration-300 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-accent-primary/20">
              View all <ArrowRight size={12} className="text-text-muted group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all duration-300" />
            </Link>
          </CardHeader>
          <CardContent className="pt-3 flex-grow flex flex-col justify-start">
            <div className="space-y-3 w-full">
              {recentExams.length === 0 ? (
                <p className="text-xs text-text-muted py-8 text-center">No exams scheduled.</p>
              ) : (
                recentExams.map((exam: any) => (
                  <Link 
                    key={exam.id} 
                    href={`/exams`}
                    className="block p-3 rounded-xl border border-border bg-surface hover:border-accent-primary hover:bg-accent-primary/5 hover:shadow-md hover:shadow-accent-primary/5 transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300 rounded-l-xl"></div>
                    <div className="flex justify-between items-start pl-1">
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="text-xs font-bold text-text-main group-hover:text-accent-primary transition-colors truncate">{exam.title}</h4>
                        <p className="text-[10px] text-text-muted group-hover:text-accent-primary/70 font-medium mt-0.5 transition-colors truncate">
                          {exam.schools?.name || 'Unknown School'} • {exam.duration_minutes}m
                        </p>
                      </div>
                      <span className="text-[9px] font-medium text-text-muted group-hover:text-accent-primary shrink-0 bg-surface-hover/50 group-hover:bg-accent-primary/10 border border-border/50 group-hover:border-accent-primary/20 transition-all px-1.5 py-0.5 rounded">
                        {new Date(exam.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Recent Transactions */}
        <Card className="shadow-sm border-border flex flex-col w-full min-h-[300px]">
          <CardHeader className="flex flex-row items-center justify-between pb-4 pt-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-primary/5 flex items-center justify-center border border-accent-primary/10 shadow-sm">
                <CreditCard size={16} className="text-accent-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-extrabold text-text-main leading-tight">
                  Recent Transactions
                </CardTitle>
                <p className="text-[10px] font-medium text-text-muted mt-0.5">Latest payments</p>
              </div>
            </div>
            <Link href="/subscriptions" className="group flex items-center gap-1.5 text-[10px] font-bold text-text-main hover:text-accent-primary bg-surface-hover hover:bg-accent-primary/10 border border-border/50 hover:border-accent-primary/30 px-3 py-1.5 rounded-full transition-all duration-300 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-accent-primary/20">
              View all <ArrowRight size={12} className="text-text-muted group-hover:text-accent-primary group-hover:translate-x-0.5 transition-all duration-300" />
            </Link>
          </CardHeader>
          <CardContent className="pt-3 flex-grow flex flex-col justify-start">
            <div className="space-y-3 w-full">
              {recentTxs.length === 0 ? (
                <p className="text-xs text-text-muted py-8 text-center">No transactions recorded.</p>
              ) : (
                recentTxs.map((tx: any) => (
                  <div 
                    key={tx.id} 
                    className="block p-3 rounded-xl border border-border bg-surface hover:border-accent-primary hover:bg-accent-primary/5 hover:shadow-md hover:shadow-accent-primary/5 transition-all duration-300 group relative overflow-hidden cursor-default"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center duration-300 rounded-l-xl"></div>
                    <div className="flex justify-between items-start pl-1">
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="text-xs font-bold text-text-main group-hover:text-accent-primary transition-colors truncate">{tx.schools?.name || 'Unknown School'}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold text-text-main group-hover:text-accent-primary transition-colors">₹{tx.amount_paid}</span>
                          <span className="text-[9px] text-text-muted group-hover:text-accent-primary/70 font-medium transition-colors truncate">• {txTypeLabels[tx.payment_type] || tx.payment_type}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-medium text-text-muted group-hover:text-accent-primary shrink-0 bg-surface-hover/50 group-hover:bg-accent-primary/10 border border-border/50 group-hover:border-accent-primary/20 transition-all px-1.5 py-0.5 rounded">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </span>
                    </div>
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
