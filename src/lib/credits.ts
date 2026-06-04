import { supabaseAdmin } from "./supabase";

const FREE_USES = 3;
const MAX_FREE_ACCOUNTS_PER_IP = 2;
const SUBSCRIBER_DAILY_LIMIT = 50;

/**
 * Ensure a user record exists.
 */
export async function ensureUser(anonymousId: string, ip?: string) {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id, free_uses_remaining, credits_remaining, subscription_status, daily_uses, daily_date")
    .eq("anonymous_id", anonymousId)
    .single();

  if (existing) {
    return existing;
  }

  // Determine free uses for new user
  let freeUses = FREE_USES;

  if (ip) {
    try {
      const { count } = await supabaseAdmin
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gt("free_uses_remaining", 0);

      if (count && count >= MAX_FREE_ACCOUNTS_PER_IP) {
        freeUses = 0;
      }
    } catch {
      // IP lookup failed — allow free uses
    }
  }

  const { data: created, error } = await supabaseAdmin
    .from("users")
    .insert({
      anonymous_id: anonymousId,
      free_uses_remaining: freeUses,
      credits_remaining: 0,
      subscription_status: "none",
      daily_uses: 0,
      daily_date: new Date().toISOString().slice(0, 10),
    })
    .select("id, free_uses_remaining, credits_remaining, subscription_status, daily_uses, daily_date")
    .single();

  if (error) {
    console.error("Failed to create user:", error);
    return {
      id: "fallback",
      free_uses_remaining: freeUses,
      credits_remaining: 0,
      subscription_status: "none",
      daily_uses: 0,
      daily_date: new Date().toISOString().slice(0, 10),
    };
  }

  if (ip && created) {
    supabaseAdmin
      .from("users")
      .update({ ip_address: ip })
      .eq("id", created.id)
      .then(() => {}, () => {});
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
  dailyRemaining?: number;
}> {
  const user = await ensureUser(anonymousId, ip);
  const isSubscriber = user.subscription_status === "active";

  let subscriberDailyLeft: number | undefined;
  if (isSubscriber) {
    const today = new Date().toISOString().slice(0, 10);
    const dailyUses = (user as Record<string, unknown>).daily_uses as number || 0;
    const dailyDate = (user as Record<string, unknown>).daily_date as string || "";
    
    if (dailyDate !== today) {
      subscriberDailyLeft = SUBSCRIBER_DAILY_LIMIT;
    } else {
      subscriberDailyLeft = Math.max(0, SUBSCRIBER_DAILY_LIMIT - dailyUses);
    }
    
    return {
      freeRemaining: user.free_uses_remaining,
      creditsRemaining: user.credits_remaining,
      totalRemaining: subscriberDailyLeft > 0 ? 999_999 : 0,
      isSubscriber,
      dailyRemaining: subscriberDailyLeft,
    };
  }

  return {
    freeRemaining: user.free_uses_remaining,
    creditsRemaining: user.credits_remaining,
    totalRemaining: user.free_uses_remaining + user.credits_remaining,
    isSubscriber,
  };
}

/**
 * Deduct one use. Subtracts from free uses first, then paid credits.
 * Subscribers get 50/day limit.
 */
export async function deductUse(anonymousId: string): Promise<void> {
  const user = await ensureUser(anonymousId);

  if (user.id === "fallback") {
    throw new Error("Cannot deduct: using fallback user");
  }

  if (user.subscription_status === "active") {
    const today = new Date().toISOString().slice(0, 10);
    const dailyUses = (user as Record<string, unknown>).daily_uses as number || 0;
    const dailyDate = (user as Record<string, unknown>).daily_date as string || "";
    
    const newDailyUses = dailyDate !== today ? 1 : dailyUses + 1;
    
    if (newDailyUses > SUBSCRIBER_DAILY_LIMIT) {
      throw new Error(`Daily limit reached (${SUBSCRIBER_DAILY_LIMIT}/day)`);
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({
        daily_uses: newDailyUses,
        daily_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      throw new Error(`Subscriber deduction failed: ${error.message}`);
    }
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
      .eq("free_uses_remaining", user.free_uses_remaining);

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
 * Add credits to a user by stripe_customer_id (legacy).
 */
export async function addCredits(stripeCustomerId: string, amount: number): Promise<void> {
  const { error } = await supabaseAdmin.rpc("add_credits", {
    p_stripe_customer_id: stripeCustomerId,
    p_amount: amount,
  });

  if (error) {
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
 * Add credits to a user by anonymous_id.
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
 * Set subscription status.
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
 * Link a Stripe customer to the user.
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
