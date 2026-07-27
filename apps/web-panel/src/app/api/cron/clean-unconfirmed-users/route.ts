import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Cron: Clean Unconfirmed Auth Users
 *
 * Removes orphaned auth.users rows where:
 *   - email_confirmed_at IS NULL  (OTP was never verified)
 *   - created_at is older than 24 hours
 *
 * Why this matters:
 *   1. Prevents "ghost" accounts that silently block re-registration with the same email.
 *      Without this, if someone starts a signup but never verifies, the email address
 *      is permanently "reserved" and Supabase just silently re-sends OTPs without error.
 *
 *   2. Mitigates email hijacking: if a malicious user tries to take over another
 *      person's email by initiating a signup with it, the unverified entry is
 *      automatically purged within 24 hours. The real owner can then register freely
 *      (a new OTP is issued to whoever clicks "Register" next).
 *
 * Schedule: Run daily (e.g. 02:00 UTC) via Vercel Cron or cron-job.org.
 *
 * Add to vercel.json:
 *   {
 *     "crons": [
 *       { "path": "/api/cron/clean-unconfirmed-users", "schedule": "0 2 * * *" },
 *       { "path": "/api/cron/clean-trash",             "schedule": "0 3 * * *" }
 *     ]
 *   }
 *
 * Security: Protected by CRON_SECRET env variable.
 *   Set CRON_SECRET=<your-secret> in your Vercel project settings.
 *   Vercel automatically sends this as a Bearer token when invoking cron routes.
 */
export async function GET(req: Request) {
  // Security: verify the secret header to prevent public abuse
  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Cutoff: 24 hours ago
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);
    const cutoffIso = cutoff.toISOString();

    // Page through all users — the Supabase admin API doesn't support
    // filtering by email_confirmed_at directly, so we filter in-memory.
    let page = 1;
    const perPage = 1000;
    let totalDeleted = 0;
    const errors: string[] = [];

    while (true) {
      const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (listError) {
        console.error('[clean-unconfirmed-users] Error listing users:', listError.message);
        return NextResponse.json({ error: listError.message }, { status: 500 });
      }

      if (!users || users.length === 0) break;

      // Filter: unconfirmed + older than 24h + self-registered school_admin
      // We only clean self-registered signups. Super-admin-created users are
      // confirmed immediately (email_confirm: true) and won't appear here.
      const toDelete = users.filter(u =>
        !u.email_confirmed_at &&
        u.created_at < cutoffIso &&
        u.user_metadata?.role === 'school_admin'
      );

      await Promise.all(
        toDelete.map(async (u) => {
          const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(u.id);
          if (deleteError) {
            errors.push(`Failed to delete ${u.email}: ${deleteError.message}`);
          } else {
            totalDeleted++;
            console.log(`[clean-unconfirmed-users] Deleted unconfirmed user: ${u.email}`);
          }
        })
      );

      // If fewer results than requested, we're on the last page
      if (users.length < perPage) break;
      page++;
    }

    const message = `Cleaned ${totalDeleted} unconfirmed user(s) older than 24h.`;
    console.log('[clean-unconfirmed-users]', message);

    return NextResponse.json({
      success: true,
      deleted: totalDeleted,
      message,
      ...(errors.length > 0 ? { errors } : {}),
    });
  } catch (error: any) {
    console.error('[clean-unconfirmed-users] Cron job error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
