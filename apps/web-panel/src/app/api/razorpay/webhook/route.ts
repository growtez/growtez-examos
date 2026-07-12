import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret || !signature) {
      return NextResponse.json({ error: 'Webhook secret or signature missing' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const payment = payload.payload.payment?.entity;
    
    // STRICT DATA SEGREGATION: Only process events for ParikshaOS
    if (!payment?.notes || payment.notes.website !== 'parikshaos') {
      console.log('Webhook ignored: Event does not belong to ParikshaOS', payment?.notes);
      return NextResponse.json({ success: true, message: 'Ignored foreign event' }, { status: 200 });
    }

    if (event === 'order.paid' || event === 'payment.captured') {
      const schoolId = payment.notes.school_id;
      const planId = payment.notes.plan_id;
      const examId = payment.notes.exam_id;
      
      if (!schoolId) {
        return NextResponse.json({ success: true, message: 'No school_id in notes' }, { status: 200 });
      }

      // Check if this payment was already recorded
      const { data: existingPayment } = await supabase
        .from('payment_history')
        .select('id')
        .eq('razorpay_payment_id', payment.id)
        .single();

      if (!existingPayment) {
        // Record payment
        const { error: insertError } = await supabase.from('payment_history').insert({
          school_id: schoolId,
          plan_id: planId || null,
          exam_id: examId || null,
          razorpay_payment_id: payment.id,
          amount_paid: payment.amount / 100, // convert paise to INR
          payment_type: examId ? 'exam_fee' : 'credit_purchase'
        });

        if (!insertError) {
          if (examId) {
            await supabase.from('exams').update({ is_paid: true }).eq('id', examId);
          } else if (planId) {
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
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
