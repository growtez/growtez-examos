import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { student_id, exam_id } = await req.json();

    if (!student_id || !exam_id) {
      return NextResponse.json({ error: 'Missing student_id or exam_id' }, { status: 400 });
    }

    // 1. Reset the student status to 'assigned' and clear timestamps
    const { error: e1 } = await supabaseAdmin
      .from('students')
      .update({ 
        status: 'assigned',
        started_at: null,
        submitted_at: null,
        active_device_id: null,
        last_active_at: null
      })
      .eq('id', student_id);

    if (e1) throw e1;

    // 2. Delete the student's results
    const { error: e2 } = await supabaseAdmin
      .from('results')
      .delete()
      .eq('student_id', student_id)
      .eq('exam_id', exam_id);

    if (e2) throw e2;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reset student exam error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
