export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface RazorpayCheckoutParams {
  amount: number; // in INR
  schoolId: string;
  examId?: string;
  planId?: string;
  planName?: string;
  userEmail?: string;
  userContact?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const openRazorpayCheckout = async (params: RazorpayCheckoutParams) => {
  const { amount, examId, planId, planName, schoolId, userEmail, userContact, onSuccess, onError } = params;

  try {
    const res = await loadRazorpayScript();
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      if (onError) onError(new Error('SDK failed to load'));
      return;
    }

    // Create an order via backend
    const orderResponse = await fetch('/api/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, planId, schoolId, planName }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      throw new Error(orderData.error || 'Failed to create order');
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Use NEXT_PUBLIC variable
      amount: orderData.amount, // in paise
      currency: orderData.currency,
      name: 'ParikshaOS',
      description: `Purchase ${planName}`,
      image: '/logo_nobg.png', // Assuming we have a logo
      order_id: orderData.orderId,
      prefill: {
        email: userEmail || '',
        contact: userContact || '',
      },
      notes: {
        website: 'parikshaos',
        school_id: schoolId,
      },
      theme: {
        color: '#4F46E5', // Indigo-600
      },
      handler: async function (response: any) {
        try {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              schoolId,
              examId,
              planId,
              amount
            }),
          });
          
          if (!verifyRes.ok) {
            throw new Error('Payment verification failed on server');
          }
          
          if (onSuccess) onSuccess();
        } catch (err) {
          if (onError) onError(err);
        }
      },
    };

    const paymentObject = new (window as any).Razorpay(options);
    
    paymentObject.on('payment.failed', function (response: any) {
      if (onError) onError(response.error);
    });

    paymentObject.open();

  } catch (err) {
    if (onError) onError(err);
  }
};
