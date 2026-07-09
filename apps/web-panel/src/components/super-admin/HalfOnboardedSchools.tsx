'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { HelpCircle, ArrowRight, Loader2, UserPlus, FileText } from 'lucide-react';
import Link from 'next/link';

export function HalfOnboardedSchools({ className }: { className?: string }) {
  const supabase = createClient();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPartialSchools() {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id, name, created_at, school_admins(id), exams(id)')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter schools that have missing admin or missing exam
        const partial = (data || []).filter((school: any) => {
          const hasAdmin = school.school_admins && school.school_admins.length > 0;
          const hasExam = school.exams && school.exams.length > 0;
          return !hasAdmin || !hasExam;
        });

        setSchools(partial);
      } catch (err) {
        console.error('Failed to fetch partial schools', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPartialSchools();
  }, []);

  return (
    <Card className={`shadow-md border-border bg-surface w-full flex flex-col justify-between ${className || ''}`}>
      <CardContent className="p-6 flex flex-col gap-4 flex-grow justify-between">
        <div className="w-full">
          <CardHeader className="p-0 pb-2 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <HelpCircle size={16} className="text-amber-500" />
              Incomplete Onboarding
            </CardTitle>
            <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {schools.length} Pending
            </span>
          </CardHeader>

          <div className="pt-3 divide-y divide-border/40 max-h-[280px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-text-muted">
                <Loader2 className="animate-spin mr-2" size={16} />
                <span>Loading pending list...</span>
              </div>
            ) : schools.length === 0 ? (
              <p className="text-xs text-text-muted py-8 text-center">
                All schools are fully onboarded!
              </p>
            ) : (
              schools.map((school) => {
                const hasAdmin = school.school_admins && school.school_admins.length > 0;
                const hasExam = school.exams && school.exams.length > 0;

                return (
                  <div key={school.id} className="flex items-center justify-between py-2.5 hover:bg-surface-hover/30 rounded px-1 transition-colors">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-xs font-semibold text-text-main truncate">{school.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {!hasAdmin && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">
                            <UserPlus size={8} /> Admin Profile
                          </span>
                        )}
                        {!hasExam && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded">
                            <FileText size={8} /> Exam Template
                          </span>
                        )}
                      </div>
                    </div>
                    <Link 
                      href={`/?resume=${school.id}`}
                      className="text-[11px] font-bold text-accent-primary flex items-center gap-0.5 hover:underline whitespace-nowrap shrink-0"
                    >
                      Resume <ArrowRight size={12} />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="text-[11px] text-text-muted border-t border-border pt-3">
          Resume setup to allocate credits and create their initial exam layout.
        </div>
      </CardContent>
    </Card>
  );
}
