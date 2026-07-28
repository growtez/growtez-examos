import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Check if user exists in any of our role tables
    const [adminRes, superRes, teacherRes] = await Promise.all([
      supabaseAdmin.from('school_admins').select('id').eq('email', email).maybeSingle(),
      supabaseAdmin.from('super_admins').select('id').eq('email', email).maybeSingle(),
      supabaseAdmin.from('teachers').select('id').eq('email', email).maybeSingle()
    ]);

    if (adminRes.data || superRes.data || teacherRes.data) {
      return NextResponse.json({ exists: true }, { status: 200 });
    }

    return NextResponse.json({ exists: false }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to check account' }, { status: 500 });
  }
}
