export interface RazorpayCheckoutOptions {
  key: string;
  amountPaise: number;
  currency?: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  themeColor?: string;
  onSuccess: (paymentId: string) => void;
  onDismiss?: () => void;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (resp: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay requires a browser environment.'));
  }
  if (window.Razorpay) {
    return Promise.resolve();
  }
  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => {
        razorpayScriptPromise = null;
        reject(new Error('Unable to load Razorpay Checkout script.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayScriptPromise = null;
      reject(new Error('Unable to load Razorpay Checkout script.'));
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export async function openRazorpayCheckout(opts: RazorpayCheckoutOptions): Promise<void> {
  await loadRazorpayScript();
  if (!window.Razorpay) {
    throw new Error('Razorpay Checkout SDK did not initialize.');
  }

  const instance = new window.Razorpay({
    key: opts.key.trim(),
    amount: Math.max(100, Math.round(opts.amountPaise)),
    currency: opts.currency || 'INR',
    name: opts.name,
    description: opts.description,
    prefill: opts.prefill || {},
    notes: opts.notes || {},
    theme: {
      color: opts.themeColor || '#0071E3',
    },
    handler: (response: { razorpay_payment_id?: string }) => {
      if (response?.razorpay_payment_id) {
        opts.onSuccess(response.razorpay_payment_id);
      }
    },
    modal: {
      ondismiss: () => {
        if (opts.onDismiss) opts.onDismiss();
      },
    },
  });

  instance.open();
}
