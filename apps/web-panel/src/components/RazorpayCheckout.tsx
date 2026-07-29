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
  amount: number;
  schoolId: string;
  examId?: string;
  planId?: string;
  planName?: string;
  userEmail?: string;
  userContact?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

// ─── Skeleton helpers ────────────────────────────────────────────────────────

const injectSkeletonStyles = () => {
  if (document.getElementById('rzp-skeleton-style')) return;
  const style = document.createElement('style');
  style.id = 'rzp-skeleton-style';
  style.textContent = [
    '@keyframes rzp-fadein{from{opacity:0}to{opacity:1}}',
    '@keyframes rzp-slideup{from{transform:translateY(100%)}to{transform:translateY(0)}}',
    '@keyframes rzp-glow{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}',
    '@keyframes rzp-glowmobile{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:.9;transform:scale(1.03)}}',
  ].join('');
  document.head.appendChild(style);
};

// Razorpay shield SVG — matches the actual Razorpay brand icon
const rzpShieldSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90" width="90" height="104">
  <defs>
    <linearGradient id="rzpShieldGrad" x1="0%" y1="0%" x2="60%" y2="100%">
      <stop offset="0%" stop-color="#5B8DEF"/>
      <stop offset="100%" stop-color="#1A3ED4"/>
    </linearGradient>
  </defs>
  <path d="M40 2 L74 16 L74 46 C74 65 58 80 40 88 C22 80 6 65 6 46 L6 16 Z"
    fill="url(#rzpShieldGrad)"
    style="filter:drop-shadow(0 6px 18px rgba(30,62,212,0.45))"/>
  <polygon points="50,24 32,24 26,50 38,50 34,66 56,38 44,38" fill="white" opacity="0.95"/>
</svg>`;

// Mobile shield — lighter, more muted blue (matches Razorpay's mobile variant)
const rzpShieldSVGMobile = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90" width="120" height="138">
  <defs>
    <linearGradient id="rzpShieldGradM" x1="10%" y1="0%" x2="70%" y2="100%">
      <stop offset="0%" stop-color="#a8c2f5"/>
      <stop offset="100%" stop-color="#6e9fe8"/>
    </linearGradient>
  </defs>
  <path d="M40 2 L74 16 L74 46 C74 65 58 80 40 88 C22 80 6 65 6 46 L6 16 Z"
    fill="url(#rzpShieldGradM)"
    style="filter:drop-shadow(0 8px 24px rgba(110,159,232,0.35))"/>
  <polygon points="50,24 32,24 26,50 38,50 34,66 56,38 44,38" fill="white" opacity="0.9"/>
</svg>`;

// Razorpay wordmark SVG (italic bold "Razorpay" in blue)
const rzpWordmarkSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 22" width="100" height="19">
  <text x="0" y="17" font-family="Arial,sans-serif" font-size="16" font-weight="900"
    font-style="italic" fill="#1A3ED4" letter-spacing="-0.3">Razorpay</text>
</svg>`;

const buildRazorpayLoadingHTML = (): string => `
  <div style="
    width:100%;
    height:100%;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    background:#f1f2f4;
    border-radius:14px;
    position:relative;
    animation:rzp-fadein 0.18s ease;
  ">
    <!-- Shield logo centered -->
    <div style="animation:rzp-glow 2s ease-in-out infinite;display:flex;align-items:center;justify-content:center;">
      ${rzpShieldSVG}
    </div>

    <!-- "Secured By Razorpay" footer row -->
    <div style="
      position:absolute;
      bottom:28px;
      left:50%;
      transform:translateX(-50%);
      display:flex;
      align-items:center;
      gap:7px;
      white-space:nowrap;
    ">
      <span style="font-size:12px;color:#9098a3;font-family:Arial,sans-serif;letter-spacing:.01em;">Secured By</span>
      <!-- Small lightning bolt icon -->
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 16" width="9" height="14">
        <polygon points="7,0 2,8 5.5,8 3,16 10,6 6,6" fill="#1A3ED4"/>
      </svg>
      ${rzpWordmarkSVG}
    </div>
  </div>`;

// Mobile: bottom sheet sliding up from the bottom
const buildMobileBottomSheetHTML = (): string => `
  <div style="
    width:100%;
    height:100%;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    background:#f5f6f8;
    position:relative;
  ">
    <div style="animation:rzp-glowmobile 2.2s ease-in-out infinite;display:flex;align-items:center;justify-content:center;">
      ${rzpShieldSVGMobile}
    </div>
    <div style="
      position:absolute;
      bottom:32px;
      left:50%;
      transform:translateX(-50%);
      display:flex;
      align-items:center;
      gap:6px;
      white-space:nowrap;
    ">
      <span style="font-size:12px;color:#9098a3;font-family:Arial,sans-serif;">Secured By</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 16" width="9" height="14">
        <polygon points="7,0 2,8 5.5,8 3,16 10,6 6,6" fill="#1A3ED4"/>
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 22" width="88" height="17">
        <text x="0" y="17" font-family="Arial,sans-serif" font-size="16" font-weight="900"
          font-style="italic" fill="#1A3ED4" letter-spacing="-0.3">Razorpay</text>
      </svg>
    </div>
  </div>`;

const showRazorpaySkeleton = (_planName?: string, _amount?: number) => {
  if (typeof window === 'undefined') return;
  const existing = document.getElementById('razorpay-skeleton-modal');
  if (existing) existing.remove();

  injectSkeletonStyles();

  const container = document.createElement('div');
  container.id = 'razorpay-skeleton-modal';

  const isDesktop = window.innerWidth >= 700;

  if (isDesktop) {
    // ── Desktop: centered modal card (820×504) ──
    Object.assign(container.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)',
    });

    const modal = document.createElement('div');
    Object.assign(modal.style, {
      width: '820px',
      height: '504px',
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      animation: 'rzp-fadein 0.2s ease',
    });
    modal.innerHTML = buildRazorpayLoadingHTML();
    container.appendChild(modal);

  } else {
    // ── Mobile: bottom sheet sliding up ──
    Object.assign(container.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      display: 'flex',
      alignItems: 'flex-end',   // anchor to bottom
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(3px)',
    });

    const sheet = document.createElement('div');
    const sheetH = Math.round(window.innerHeight * 0.58); // ~58% of screen height
    Object.assign(sheet.style, {
      width: '100%',
      height: `${sheetH}px`,
      borderRadius: '22px 22px 0 0',
      overflow: 'hidden',
      boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
      animation: 'rzp-slideup 0.32s cubic-bezier(0.32,0.72,0,1)',
    });
    sheet.innerHTML = buildMobileBottomSheetHTML();
    container.appendChild(sheet);
  }

  document.body.appendChild(container);
};

const hideRazorpaySkeleton = () => {
  if (typeof window === 'undefined') return;
  const modal = document.getElementById('razorpay-skeleton-modal');
  if (modal) {
    modal.style.transition = 'opacity 0.15s ease';
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 180);
  }
};

// ─── Main checkout function ───────────────────────────────────────────────────

export const openRazorpayCheckout = async (params: RazorpayCheckoutParams) => {
  const { amount, examId, planId, planName, schoolId, userEmail, userContact, onSuccess, onError } = params;

  showRazorpaySkeleton(planName, amount);

  try {
    const res = await loadRazorpayScript();
    if (!res) {
      hideRazorpaySkeleton();
      alert('Razorpay SDK failed to load. Are you online?');
      if (onError) onError(new Error('SDK failed to load'));
      return;
    }

    const orderResponse = await fetch('/api/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, planId, examId, schoolId, planName }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      hideRazorpaySkeleton();
      if (orderData.error === 'Already purchased') {
        if (onSuccess) onSuccess();
        return;
      }
      throw new Error(orderData.error || 'Failed to create order');
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'ParikshaOS',
      description: `Purchase ${planName}`,
      image: '/ParikshaOS_logo.png',
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
        color: '#008080',
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
              amount,
            }),
          });
          if (!verifyRes.ok) throw new Error('Payment verification failed on server');
          if (onSuccess) onSuccess();
        } catch (err) {
          if (onError) onError(err);
        }
      },
    };

    const paymentObject = new (window as any).Razorpay(options);

    paymentObject.on('payment.failed', function (response: any) {
      hideRazorpaySkeleton();
      if (onError) onError(response.error);
    });

    paymentObject.open();

    // Dismiss our skeleton once Razorpay's own modal takes over
    setTimeout(() => hideRazorpaySkeleton(), 500);

  } catch (err) {
    hideRazorpaySkeleton();
    if (onError) onError(err);
  }
};
