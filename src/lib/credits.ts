import { supabaseAdmin } from "./supabase";

const FREE_USES = 3; // Number of free name generations per anonymous user

/**
 * Ensure a user record exists for the given anonymous ID.
 * Creates one with 3 free uses if it doesn't exist.
 */
export async function ensureUser(anonymousId: string) {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id, free_uses_remaining, credits_remaining, subscription_status")
    .eq("anonymous_id", anonymousId)
    .single();

  if (existing) {
    return existing;
  }

  // Create new user with 3 free uses
  const { data: created, error } = await supabaseAdmin
    .from("users")
    .insert({
      anonymous_id: anonymousId,
      free_uses_remaining: FREE_USES,
      credits_remaining: 0,
      subscription_status: "none",
    })
    .select("id, free_uses_remaining, credits_remaining, subscription_status")
    .single();

  if (error) {
    console.error("Failed to create user:", error);
    // Fallback: treat as unlimited free for now
    return {
      id: "fallback",
      free_uses_remaining: FREE_USES,
      credits_remaining: 0,
      subscription_status: "none",
    };
  }

  return created;
}

/**
 * Get available uses (free + paid) for a user.
 */
export async function getAvailableUses(anonymousId: string): Promise<{
  freeRemaining: number;
  creditsRemaining: number;
  totalRemaining: number;
  isSubscriber: boolean;
}> {
  const user = await ensureUser(anonymousId);

  const isSubscriber = user.subscription_status === "active";

  return {
    freeRemaining: user.free_uses_remaining,
    creditsRemaining: user.credits_remaining,
    totalRemaining:
      user.free_uses_remaining + user.credits_remaining + (isSubscriber ? 999_999 : 0), // Subscribers get unlimited
    isSubscriber,
  };
}

/**
 * Check if user can generate a name. Returns what kind of credit to use.
 */
export async function checkCanGenerate(anonymousId: string): Promise<{
  canGenerate: boolean;
  reason?: "no_credits" | "ok";
  usingFreeUse: boolean;
  usingCredit: boolean;
  usingSubscription: boolean;
}> {
  const { freeRemaining, creditsRemaining, isSubscriber } =
    await getAvailableUses(anonymousId);

  if (isSubscriber) {
    return { canGenerate: true, usingFreeUse: false, usingCredit: false, usingSubscription: true };
  }

  if (freeRemaining > 0) {
    return { canGenerate: true, usingFreeUse: true, usingCredit: false, usingSubscription: false };
  }

  if (creditsRemaining > 0) {
    return { canGenerate: true, usingFreeUse: false, usingCredit: true, usingSubscription: false };
  }

  return {
    canGenerate: false,
    reason: "no_credits",
    usingFreeUse: false,
    usingCredit: false,
    usingSubscription: false,
  };
}

/**
 * Deduct one use. Subtracts from free uses first, then paid credits.
 */
export async function deductUse(anonymousId: string): Promise<void> {
  const user = await ensureUser(anonymousId);

  if (user.subscription_status === "active") {
    // Subscriber — no deduction needed
    return;
  }

  if (user.free_uses_remaining > 0) {
    await supabaseAdmin
      .from("users")
      .update({
        free_uses_remaining: user.free_uses_remaining - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  } else if (user.credits_remaining > 0) {
    await supabaseAdmin
      .from("users")
      .update({
        credits_remaining: user.credits_remaining - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  }
}

/**
 * Add credits to a user (called by Stripe webhook)
 */
export async function addCredits(stripeCustomerId: string, amount: number): Promise<void> {
  const { error } = await supabaseAdmin.rpc("add_credits", {
    p_stripe_customer_id: stripeCustomerId,
    p_amount: amount,
  });

  if (error) {
    // Fallback: direct update
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, credits_remaining")
      .eq("stripe_customer_id", stripeCustomerId)
      .single();

    if (user) {
      await supabaseAdmin
        .from("users")
        .update({
          credits_remaining: (user.credits_remaining || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
  }
}

/**
 * Set subscription status (called by Stripe webhook)
 */
export async function setSubscriptionStatus(
  stripeCustomerId: string,
  status: "active" | "cancelled" | "past_due",
  subscriptionEnd?: string
): Promise<void> {
  await supabaseAdmin
    .from("users")
    .update({
      subscription_status: status,
      subscription_end: subscriptionEnd || null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_customer_id", stripeCustomerId);
}

/**
 * Link a Stripe customer to the user (called after Checkout)
 */
export async function linkStripeCustomer(
  anonymousId: string,
  stripeCustomerId: string,
  email?: string
): Promise<void> {
  await supabaseAdmin
    .from("users")
    .update({
      stripe_customer_id: stripeCustomerId,
      email: email || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("anonymous_id", anonymousId);
}
