import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
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

    const { planId, examId, schoolId, planName } = await req.json();

    if (!schoolId || (!planId && !examId)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Step 8: Protect Duplicate Payments
    if (examId) {
      const { data: existingExam } = await supabase
        .from('exams')
        .select('is_paid')
        .eq('id', examId)
        .single();
      
      if (existingExam?.is_paid) {
        return NextResponse.json({ error: 'Already purchased' }, { status: 400 });
      }
    }

    let calculatedAmount = 300; // Default fallback
    if (examId) {
      const { data: feePlan } = await supabase
        .from('plans')
        .select('price')
        .eq('name', 'Fixed Payment')
        .single();
      
      if (feePlan) {
        calculatedAmount = Number(feePlan.price);
      }
    } else if (planId) {
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

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay keys are not configured' }, { status: 500 });
    }

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // We use a prefix in the receipt for easy debugging
    const receiptId = `parikshaos_rcpt_${Date.now()}`;

    const orderOptions = {
      amount: calculatedAmount * 100, // Razorpay amount is in currency subunits (paise)
      currency: 'INR',
      receipt: receiptId,
      notes: {
        website: 'parikshaos',
        school_id: schoolId,
        plan_id: planId || '',
        exam_id: examId || '',
        plan_name: planName || '',
        type: examId ? 'exam_fee' : 'credit_purchase'
      },
    };

    const order = await instance.orders.create(orderOptions);

    return NextResponse.json({ orderId: order.id, amount: orderOptions.amount, currency: orderOptions.currency }, { status: 200 });

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
