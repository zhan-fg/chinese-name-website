import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import {
  addCredits,
  setSubscriptionStatus,
  linkStripeCustomer,
} from "@/lib/credits";

/**
 * POST /api/stripe-webhook
 * Handles Stripe events: checkout.session.completed, invoice.paid, customer.subscription.*
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event;

  try {
    event = await constructWebhookEvent(body, signature);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // One-time payment completed (credit packs)
      case "checkout.session.completed": {
        const session = event.data.object;
        const planId = session.metadata?.plan_id;
        const anonymousId = session.metadata?.anonymous_id;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        if (!planId || !anonymousId) {
          console.warn("Webhook: missing metadata", session.metadata);
          break;
        }

        // Link Stripe customer to user
        if (customerId) {
          await linkStripeCustomer(
            anonymousId,
            customerId,
            session.customer_details?.email || undefined
          );
        }

        // Add credits for one-time purchases
        if (planId === "credit_5") {
          await addCredits(customerId || anonymousId, 5);
        } else if (planId === "credit_15") {
          await addCredits(customerId || anonymousId, 15);
        }
        // Subscription handled by invoice.paid / customer.subscription.*
        break;
      }

      // Subscription created or renewed
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const status =
          subscription.status === "active"
            ? "active"
            : subscription.status === "past_due"
            ? "past_due"
            : "cancelled";

        await setSubscriptionStatus(
          customerId,
          status as "active" | "cancelled" | "past_due",
          new Date((subscription.current_period_end as number) * 1000).toISOString()
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        await setSubscriptionStatus(customerId, "cancelled");
        break;
      }

      default:
        // Ignore other events
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
