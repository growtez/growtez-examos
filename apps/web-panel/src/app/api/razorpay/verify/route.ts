import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const body = await req.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      schoolId, 
      examId,
      planId, 
      amount 
    } = body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Razorpay secret not configured' }, { status: 500 });
    }

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Insert into payment_history
    const { error: insertError } = await supabase.from('payment_history').insert({
      school_id: schoolId,
      plan_id: planId || null,
      exam_id: examId || null,
      razorpay_payment_id: razorpay_payment_id,
      amount_paid: amount,
      payment_type: examId ? 'exam_fee' : 'credit_purchase'
    });

    if (insertError) {
      // Could be duplicate payment id if webhook processed it first
      if (insertError.code !== '23505') { 
        throw insertError;
      }
    } else {
      // If paying for an exam
      if (examId) {
        await supabase.from('exams').update({ is_paid: true }).eq('id', examId);
      }
      // If buying credits (legacy support)
      else if (planId) {
        const { data: planData } = await supabase.from('plans').select('credits_awarded').eq('id', planId).single();
        if (planData && planData.credits_awarded) {
          const { data: schoolData } = await supabase.from('schools').select('exam_credits').eq('id', schoolId).single();
          const currentCredits = schoolData?.exam_credits || 0;
          await supabase.from('schools').update({
            exam_credits: currentCredits + planData.credits_awarded
          }).eq('id', schoolId);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}
