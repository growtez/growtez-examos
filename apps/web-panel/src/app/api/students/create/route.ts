import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { full_name, roll_number, date_of_birth, exam_id, course = 'General', batch = 'Main', session = '2024-25' } = body;

    if (!full_name || !roll_number || !date_of_birth || !exam_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerClient();
    
    // Get exam to find school_id
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('school_id')
      .eq('id', exam_id)
      .single();

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const school_id = exam.school_id;
    // Construct email using DOB to ensure uniqueness for duplicate roll numbers across batches
    const dobStr = date_of_birth.replace(/-/g, '');
    const email = `${roll_number.trim()}_${dobStr}@${school_id}.student.examos.local`;
    
    // Format password as DDMMYYYY
    const parts = date_of_birth.split('-');
    const password = `${parts[2]}${parts[1]}${parts[0]}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 1. Check if student already exists in this school with the same details
    const { data: existingStudent } = await adminSupabase
      .from('students')
      .select('id')
      .eq('school_id', school_id)
      .eq('roll_number', roll_number)
      .eq('course', course)
      .eq('batch', batch)
      .eq('session', session)
      .single();

    let studentId = existingStudent?.id;

    if (!studentId) {
      // 2. Create auth user if they don't exist
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role: 'student',
          school_id,
          roll_number,
          date_of_birth,
          course,
          batch,
          session
        }
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      if (!authData.user) {
        return NextResponse.json({ error: 'Failed to create auth user' }, { status: 400 });
      }

      studentId = authData.user.id;
      // Give the trigger a moment to create the student profile
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 3. Assign to exam
    const { error: assignError } = await adminSupabase.from('exam_students').insert({
      exam_id: exam_id,

      student_id: studentId,
      status: 'assigned'
    });

    // If error is 23505 (unique constraint violation), it means they are already assigned, which is fine.
    if (assignError && assignError.code !== '23505') {
      console.error('Assign error:', assignError);
      // We don't fail the whole request since the user was processed, but log it
    }

    return NextResponse.json({ 
      success: true, 
      student: {
        id: studentId,
        full_name,
        roll_number,
        date_of_birth,
        course,
        batch,
        session
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
