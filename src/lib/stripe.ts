import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-06-16.acacia" as Stripe.LatestApiVersion,
  typescript: true,
});

// ============================================================
// Pricing plans
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
    name: "Unlimited Monthly",
    description: "Generate unlimited names + save history + PDF certificate",
    amount: 499, // $4.99/month
    credits: -1, // unlimited
    type: "subscription" as const,
  },
} as const;

export type PricingPlanId = keyof typeof PRICING_PLANS;

/**
 * Create a Stripe Checkout session for a one-time payment or subscription.
 */
export async function createCheckoutSession(params: {
  planId: PricingPlanId;
  anonymousId: string;
  successUrl: string;
  cancelUrl: string;
  email?: string;
}): Promise<string> {
  const plan = PRICING_PLANS[params.planId];

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: plan.name,
          description: plan.description,
        },
        unit_amount: plan.amount,
        ...(plan.type === "subscription"
          ? { recurring: { interval: "month" as const } }
          : {}),
      },
      quantity: 1,
    },
  ];

  const session = await stripe.checkout.sessions.create({
    mode: plan.type === "subscription" ? "subscription" : "payment",
    payment_method_types: ["card"],
    ...(params.email ? { customer_email: params.email } : {}),
    line_items: lineItems,
    metadata: {
      plan_id: params.planId,
      anonymous_id: params.anonymousId,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
  });

  return session.url || params.successUrl;
}

/**
 * Construct a Stripe webhook event from the raw request.
 */
export async function constructWebhookEvent(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  return stripe.webhooks.constructEvent(body, signature, secret);
}
