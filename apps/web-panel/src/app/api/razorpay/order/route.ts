import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { amount, planId, schoolId, planName } = await req.json();

    if (!amount || !planId || !schoolId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
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
      amount: amount * 100, // Razorpay amount is in currency subunits (paise)
      currency: 'INR',
      receipt: receiptId,
      notes: {
        website: 'parikshaos',
        school_id: schoolId,
        plan_id: planId,
        plan_name: planName,
        type: 'credit_purchase'
      },
    };

    const order = await instance.orders.create(orderOptions);

    return NextResponse.json({ orderId: order.id, amount: orderOptions.amount, currency: orderOptions.currency }, { status: 200 });

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
