import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // We use the regular server client to verify the user is logged in
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify this user is a school admin
    if (user.user_metadata?.role !== 'school_admin') {
      return NextResponse.json({ error: 'Only school admins can complete this registration' }, { status: 403 });
    }

    const schoolName = user.user_metadata?.school_name;
    if (!schoolName) {
      return NextResponse.json({ error: 'Missing school name in user metadata' }, { status: 400 });
    }

    // We use the service role key to perform the database operations safely
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Check if the school admin already has a school_id linked (to prevent double creation)
    const { data: existingProfile } = await supabaseAdmin
      .from('school_admins')
      .select('school_id')
      .eq('id', user.id)
      .single();
      
    if (existingProfile?.school_id) {
      return NextResponse.json({ 
        success: true, 
        message: 'School already linked' 
      }, { status: 200 });
    }

    // 1. Create the School record
    const { data: newSchool, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name: schoolName,
        contact_email: user.email,
        is_active: true,
      })
      .select('id')
      .single();

    if (schoolError || !newSchool) {
      console.error('Error creating school:', schoolError);
      return NextResponse.json({ error: 'Failed to create school record' }, { status: 500 });
    }

    // 2. Link the school to the school_admin profile (using upsert in case the DB trigger didn't run)
    const { error: profileError } = await supabaseAdmin
      .from('school_admins')
      .upsert({ 
        id: user.id,
        full_name: user.user_metadata?.full_name || 'School Admin',
        email: user.email,
        school_id: newSchool.id 
      });

    if (profileError) {
      // Rollback: delete the school if linking fails
      await supabaseAdmin.from('schools').delete().eq('id', newSchool.id);
      console.error('Error updating school_admin profile:', profileError);
      return NextResponse.json({ error: 'Failed to link admin profile' }, { status: 500 });
    }

    // 3. Update the auth user metadata to remove school_name and add school_id (clean up)
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        role: 'school_admin',
        full_name: user.user_metadata?.full_name,
        school_id: newSchool.id,
      }
    });

    return NextResponse.json({ 
      success: true, 
      school_id: newSchool.id,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Registration completion error:', error);
    return NextResponse.json({ error: error.message || 'Registration completion failed' }, { status: 500 });
  }
}
