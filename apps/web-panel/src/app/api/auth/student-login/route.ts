import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, roll_number, dob, school_id, student_id } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!supabaseServiceKey || !jwtSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // ── action: 'select_exam' — called after student picks one from the UI ────
    if (action === 'select_exam') {
      if (!student_id) {
        return NextResponse.json({ error: 'Missing student_id' }, { status: 400, headers: corsHeaders });
      }

      const { data: student, error: studentError } = await adminSupabase
        .from('students')
        .select('*, exams(*)')
        .eq('id', student_id)
        .single();

      if (studentError || !student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404, headers: corsHeaders });
      }

      if (student.status === 'submitted') {
        return NextResponse.json({ error: 'You have already submitted this exam.' }, { status: 403, headers: corsHeaders });
      }

      await adminSupabase
        .from('students')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', student.id);

      const payload = {
        role: 'authenticated',
        iss: 'supabase',
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
        sub: student.id,
        student_id: student.id,
        exam_id: student.exam_id,
      };

      const token = jwt.sign(payload, jwtSecret);
      return NextResponse.json({ access_token: token, student }, { headers: corsHeaders });
    }

    // ── Default: initial login — find all matching student rows ───────────────
    if (!roll_number || !dob || !school_id) {
      return NextResponse.json({ error: 'Missing required credentials' }, { status: 400, headers: corsHeaders });
    }

    // 1. Get all active/published exams for this school
    const { data: exams, error: examsError } = await adminSupabase
      .from('exams')
      .select('id')
      .eq('school_id', school_id)
      .in('status', ['active', 'published']);

    if (examsError || !exams || exams.length === 0) {
      return NextResponse.json({ error: 'No active exams found for your school.' }, { status: 404, headers: corsHeaders });
    }

    const examIds = exams.map(e => e.id);

    // 2. Find ALL student rows matching roll+dob across those exams (no .single()!)
    const { data: students, error: studentsError } = await adminSupabase
      .from('students')
      .select('*, exams(*)')
      .in('exam_id', examIds)
      .eq('roll_number', roll_number)
      .eq('date_of_birth', dob);

    if (studentsError || !students || students.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials or not assigned to any active exam.' }, { status: 401, headers: corsHeaders });
    }

    // 3. Exclude already-submitted rows — nothing left to do there
    const pending = students.filter((s: any) => s.status !== 'submitted');

    if (pending.length === 0) {
      return NextResponse.json(
        { error: 'You have already submitted all your assigned exams. Re-entry is not allowed.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Touch last_active_at for all pending matching student rows
    const pendingIds = pending.map((s: any) => s.id);
    await adminSupabase
      .from('students')
      .update({ last_active_at: new Date().toISOString() })
      .in('id', pendingIds);

    // 4. Single pending exam → issue JWT immediately (no picker needed)
    if (pending.length === 1) {
      const s = pending[0];
      const payload = {
        role: 'authenticated',
        iss: 'supabase',
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
        sub: s.id,
        student_id: s.id,
        exam_id: s.exam_id,
      };
      const token = jwt.sign(payload, jwtSecret);
      return NextResponse.json({ mode: 'direct', access_token: token, student: s }, { headers: corsHeaders });
    }

    // 5. Multiple pending exams → let the client show the exam picker
    return NextResponse.json({ mode: 'select', students: pending }, { headers: corsHeaders });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
