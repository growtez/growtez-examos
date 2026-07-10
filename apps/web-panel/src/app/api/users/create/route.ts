import { createClient } from '@supabase/supabase-js';
import { createClient as createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { email } = body;
    const { password, full_name, role, school_id, roll_number, date_of_birth, course, batch, session, department } = body;

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role === 'teacher' && !department) {
      return NextResponse.json({ error: 'Department is required for teachers' }, { status: 400 });
    }

    // 1. Initialize admin client to create user securely and bypass email confirmation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Check for duplicate student before attempting to create the user
    if (role === 'student' && school_id && roll_number) {
      const { data: existingStudent } = await adminSupabase
        .from('students')
        .select('id')
        .eq('school_id', school_id)
        .eq('roll_number', roll_number)
        .eq('course', course || 'General')
        .eq('batch', batch || 'Main')
        .eq('session', session || '2024-25')
        .single();
        
      if (existingStudent) {
        return NextResponse.json({ error: 'already registerd with the rollno check the rollno or contacct with admin' }, { status: 400 });
      }
      // Override email for students to ensure uniqueness even if roll numbers duplicate across batches
      if (date_of_birth) {
        const dobStr = date_of_birth.replace(/-/g, '');
        email = `${roll_number}_${dobStr}@${school_id}.student.examos.local`;
      }
    }

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        school_id: school_id || null,
        roll_number: roll_number || null,
        date_of_birth: date_of_birth || null,
        course: course || 'General',
        batch: batch || 'Main',
        session: session || '2024-25',
        department: department || null,
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
