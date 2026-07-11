import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, password, schoolName, fullName } = await req.json();

    if (!email || !password || !schoolName || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    if (existingUser?.users?.some(u => u.email === email)) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // 2. Create the School record first
    const { data: newSchool, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name: schoolName,
        contact_email: email,
        is_active: true,
      })
      .select('id')
      .single();

    if (schoolError || !newSchool) {
      console.error('Error creating school:', schoolError);
      return NextResponse.json({ error: 'Failed to create school record' }, { status: 500 });
    }

    // 3. Create the user using Supabase Admin API
    // Passing school_id in metadata so the trigger on_auth_user_created handles the profile correctly
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'school_admin',
        full_name: fullName,
        school_id: newSchool.id,
      }
    });

    if (userError) {
      console.error('Error creating auth user:', userError);
      // Cleanup the school if user creation fails
      await supabaseAdmin.from('schools').delete().eq('id', newSchool.id);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Account created successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
