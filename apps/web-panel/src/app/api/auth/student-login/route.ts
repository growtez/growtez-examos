import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roll_number, dob, school_id } = body;

    if (!roll_number || !dob || !school_id) {
      return NextResponse.json({ error: 'Missing required credentials' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!supabaseServiceKey || !jwtSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // We must find the student by roll_number and date_of_birth.
    // However, the student is now tied to an exam_id, not school_id directly.
    // So we need to find exams that belong to this school, and see if the student is registered.
    
    // 1. Get all active exams for this school
    const { data: exams, error: examsError } = await adminSupabase
      .from('exams')
      .select('id')
      .eq('school_id', school_id)
      .eq('status', 'active');

    if (examsError || !exams || exams.length === 0) {
      return NextResponse.json({ error: 'No active exams found for your school' }, { status: 404 });
    }

    const examIds = exams.map(e => e.id);

    // 2. Find the student in one of these exams
    const { data: student, error: studentError } = await adminSupabase
      .from('students')
      .select('*')
      .in('exam_id', examIds)
      .eq('roll_number', roll_number)
      .eq('date_of_birth', dob)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Invalid login credentials or not assigned to any active exam.' }, { status: 401 });
    }

    // 3. Generate Custom JWT for Supabase RLS
    const payload = {
      role: 'authenticated', // Gives them authenticated access in Postgres
      iss: 'supabase',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
      sub: student.id,
      student_id: student.id,
      exam_id: student.exam_id
    };

    const token = jwt.sign(payload, jwtSecret);

    return NextResponse.json({
      access_token: token,
      student: student
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
