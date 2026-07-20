import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { full_name, roll_number, date_of_birth, exam_id, course = 'General', batch = 'Main', session = '2024-25' } = body;

    if (!full_name || !roll_number || !date_of_birth || !exam_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) }
    });

    // 1. Check if exam exists
    const { data: exam, error: examError } = await adminSupabase
      .from('exams')
      .select('id')
      .eq('id', exam_id)
      .single();

    if (examError || !exam) {
      console.error('Exam fetch error in create student:', examError, 'exam_id:', exam_id);
      return NextResponse.json({ error: `Exam not found: ${examError?.message || 'No exam returned'}. ID: ${exam_id}` }, { status: 404 });
    }

    // 2. Insert into students table directly (exam_id + roll_number must be unique)
    const { data: newStudent, error: insertError } = await adminSupabase
      .from('students')
      .insert({
        exam_id,
        full_name,
        roll_number,
        date_of_birth,
        course,
        batch,
        session,
        status: 'assigned'
      })
      .select('*')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'A student with this roll number is already registered for this exam.' }, { status: 400 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      student: newStudent
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
