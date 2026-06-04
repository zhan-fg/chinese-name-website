import { supabaseAdmin } from "./supabase";

const FREE_USES = 3; // Number of free name generations per anonymous user
const MAX_FREE_ACCOUNTS_PER_IP = 2; // Max distinct users that get free uses from same IP

/**
 * Ensure a user record exists for the given anonymous ID.
 * Creates one with 3 free uses if it doesn't exist.
 * Limits free accounts per IP to prevent incognito abuse.
 */
export async function ensureUser(anonymousId: string, ip?: string) {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id, free_uses_remaining, credits_remaining, subscription_status")
    .eq("anonymous_id", anonymousId)
    .single();

  if (existing) {
    return existing;
  }

  // Determine free uses for new user
  let freeUses = FREE_USES;

  if (ip) {
    // Count how many existing users already got free uses from this IP
    const { count } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gt("free_uses_remaining", 0); // only count accounts that actually got free uses

    if (count && count >= MAX_FREE_ACCOUNTS_PER_IP) {
      freeUses = 0; // No more free lunches from this IP
    }
  }

  // Create new user
  const { data: created, error } = await supabaseAdmin
    .from("users")
    .insert({
      anonymous_id: anonymousId,
      free_uses_remaining: freeUses,
      credits_remaining: 0,
      subscription_status: "none",
      ip_address: ip || null,
    })
    .select("id, free_uses_remaining, credits_remaining, subscription_status")
    .single();

  if (error) {
    console.error("Failed to create user:", error);
    return {
      id: "fallback",
      free_uses_remaining: freeUses,
      credits_remaining: 0,
      subscription_status: "none",
    };
  }

  return created;
}

/**
 * Get available uses (free + paid) for a user.
 */
export async function getAvailableUses(anonymousId: string, ip?: string): Promise<{
  freeRemaining: number;
  creditsRemaining: number;
  totalRemaining: number;
  isSubscriber: boolean;
}> {
  const user = await ensureUser(anonymousId, ip);

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

  // If Supabase returned a fallback user, deduction can't work
  if (user.id === "fallback") {
    throw new Error("Cannot deduct: using fallback user (Supabase insert failed)");
  }

  if (user.subscription_status === "active") {
    return;
  }

  if (user.free_uses_remaining > 0) {
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        free_uses_remaining: user.free_uses_remaining - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .eq("free_uses_remaining", user.free_uses_remaining); // optimistic lock

    if (error) {
      throw new Error(`Deduction update failed: ${error.message}`);
    }
  } else if (user.credits_remaining > 0) {
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        credits_remaining: user.credits_remaining - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .eq("credits_remaining", user.credits_remaining);

    if (error) {
      throw new Error(`Deduction update failed: ${error.message}`);
    }
  }
}

/**
 * Add credits to a user by stripe_customer_id (legacy Stripe, kept for compatibility)
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
 * Add credits to a user by anonymous_id (PayPal flow)
 */
export async function addCreditsByAnonymousId(
  anonymousId: string,
  amount: number
): Promise<void> {
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, credits_remaining")
    .eq("anonymous_id", anonymousId)
    .single();

  if (!user) {
    console.error("addCreditsByAnonymousId: user not found:", anonymousId);
    return;
  }

  await supabaseAdmin
    .from("users")
    .update({
      credits_remaining: (user.credits_remaining || 0) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
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
