import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabaseAuth = createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { examId, schoolId } = await req.json();

    if (!examId || !schoolId) {
      return NextResponse.json({ error: 'Missing examId or schoolId' }, { status: 400 });
    }

    // Verify user belongs to this school
    const { data: adminData } = await supabaseAuth
      .from('school_admins')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!adminData || adminData.school_id !== schoolId) {
      return NextResponse.json({ error: 'Unauthorized for this school' }, { status: 403 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Fetch exam to check if already paid
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('is_paid')
      .eq('id', examId)
      .eq('school_id', schoolId)
      .single();
      
    if (examError || !examData) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (examData.is_paid) {
      return NextResponse.json({ success: true, message: 'Already paid' }, { status: 200 });
    }

    // Check credits
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .select('exam_credits')
      .eq('id', schoolId)
      .single();

    if (schoolError || !schoolData) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const currentCredits = schoolData.exam_credits || 0;
    
    if (currentCredits < 1) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Deduct 1 credit
    const { error: updateSchoolError } = await supabase
      .from('schools')
      .update({ exam_credits: currentCredits - 1 })
      .eq('id', schoolId);
      
    if (updateSchoolError) {
      throw updateSchoolError;
    }

    // Mark exam as paid
    const { error: updateExamError } = await supabase
      .from('exams')
      .update({ is_paid: true })
      .eq('id', examId);

    if (updateExamError) {
      // Rollback (best effort)
      await supabase.from('schools').update({ exam_credits: currentCredits }).eq('id', schoolId);
      throw updateExamError;
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Error publishing with credit:', error);
    return NextResponse.json({ error: error.message || 'Failed to process' }, { status: 500 });
  }
}
