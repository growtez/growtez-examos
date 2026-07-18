import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabaseAuth = createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      planId
    } = body;

    let calculatedAmount = 300; // Default fallback
    if (planId) {
      const { data: planData } = await supabase
        .from('plans')
        .select('price')
        .eq('id', planId)
        .single();
      if (!planData) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }
      calculatedAmount = Number(planData.price);
    }

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

    // Verify the amount paid matches what we expected (prevents underpayment attacks)
    const { amount: clientAmount } = body;
    if (clientAmount && Math.round(Number(clientAmount)) !== Math.round(calculatedAmount)) {
      console.error(`Amount mismatch: expected ${calculatedAmount}, got ${clientAmount}`);
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
    }

    // Step 12: Prevent Double Verification
    const { data: existingPayment } = await supabase
      .from('payment_history')
      .select('id')
      .eq('razorpay_payment_id', razorpay_payment_id)
      .single();

    if (existingPayment) {
      // Already verified, return success without inserting again
      return NextResponse.json({ success: true, message: 'Already verified' }, { status: 200 });
    }

    // Insert into payment_history
    const { error: insertError } = await supabase.from('payment_history').insert({
      school_id: schoolId,
      plan_id: planId || null,
      razorpay_payment_id: razorpay_payment_id,
      amount_paid: calculatedAmount,
      payment_type: 'credit_purchase'
    });

    if (insertError) {
      // Could be duplicate payment id if webhook processed it first
      if (insertError.code !== '23505') { 
        throw insertError;
      }
    } else {
      if (planId) {
        const { data: planData } = await supabase.from('plans').select('credits_awarded').eq('id', planId).single();
        if (planData && planData.credits_awarded) {
          await supabase.rpc('increment_credits', { 
            school_id: schoolId, 
            amount: planData.credits_awarded 
          });
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}
