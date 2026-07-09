import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { OnboardingWizard } from '@/components/super-admin/OnboardingWizard';

export const dynamic = 'force-dynamic';

export default async function SuperAdminDashboard() {
  const supabase = createAdminClient();

  return (
    <div className="space-y-6">

      {/* Onboarding Wizard */}
      <div className="mt-8">
        <OnboardingWizard />
      </div>
    </div>
  );
}
