const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";

const PAYPAL_API =
  PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// ============================================================
// Pricing plans (same structure as before)
// ============================================================

export const PRICING_PLANS = {
  credit_5: {
    id: "credit_5",
    name: "5 Name Credits",
    description: "Generate 5 more Chinese names",
    amount: 599, // $5.99 in cents
    credits: 5,
    type: "one_time" as const,
  },
  credit_15: {
    id: "credit_15",
    name: "15 Name Credits",
    description: "Best value — just $0.87 per name",
    amount: 1299, // $12.99 in cents
    credits: 15,
    type: "one_time" as const,
    featured: true,
  },
  subscription: {
    id: "subscription",
    name: "50 Names/Day",
    description: "30 days, 50 names per day — save, share, unlimited creativity",
    amount: 499, // $4.99
    credits: -1, // unlimited (handled by subscription_status in DB)
    type: "one_time" as const, // simplified: one-time purchase for 30 days
  },
} as const;

export type PricingPlanId = keyof typeof PRICING_PLANS;

// ============================================================
// PayPal OAuth
// ============================================================

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString(
          "base64"
        ),
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

// ============================================================
// Create PayPal Order
// ============================================================

export async function createCheckoutSession(params: {
  planId: PricingPlanId;
  anonymousId: string;
  successUrl: string;
  cancelUrl: string;
  email?: string;
}): Promise<string> {
  const plan = PRICING_PLANS[params.planId];
  const token = await getAccessToken();

  const body: Record<string, unknown> = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: (plan.amount / 100).toFixed(2),
        },
        description: plan.name,
        custom_id: JSON.stringify({
          plan_id: params.planId,
          anonymous_id: params.anonymousId,
        }),
      },
    ],
    application_context: {
      brand_name: "Shan Shui",
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
      return_url: params.successUrl,
      cancel_url: params.cancelUrl,
    },
  };

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "PayPal-Request-Id": `${params.planId}-${params.anonymousId}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create order failed: ${err}`);
  }

  const data = await res.json();

  // Find the approval URL
  const approveLink = data.links?.find(
    (l: { rel: string; href: string }) => l.rel === "approve"
  );

  return approveLink?.href || params.successUrl;
}

// ============================================================
// Capture PayPal Order
// ============================================================

export async function capturePayPalOrder(orderId: string): Promise<{
  planId: string;
  anonymousId: string;
  status: string;
  payerEmail: string;
}> {
  const token = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal capture failed: ${err}`);
  }

  const data = await res.json();

  // Extract payer email from PayPal response
  const payerEmail = data.payer?.email_address || "";

  // Extract metadata from custom_id
  const purchaseUnit = data.purchase_units?.[0];
  let planId = "";
  let anonymousId = "";

  if (purchaseUnit?.payments?.captures?.[0]?.custom_id) {
    // If custom_id was set on capture, use it
    const meta = JSON.parse(purchaseUnit.payments.captures[0].custom_id);
    planId = meta.plan_id;
    anonymousId = meta.anonymous_id;
  } else if (purchaseUnit?.custom_id) {
    const meta = JSON.parse(purchaseUnit.custom_id);
    planId = meta.plan_id;
    anonymousId = meta.anonymous_id;
  }

  return { planId, anonymousId, status: data.status, payerEmail };
}
