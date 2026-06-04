import { supabaseAdmin } from "./supabase";

const FREE_USES = 3;
const MAX_FREE_ACCOUNTS_PER_IP = 2;

export async function ensureUser(anonymousId: string, ip?: string) {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id, free_uses_remaining, credits_remaining, subscription_status")
    .eq("anonymous_id", anonymousId)
    .single();

  if (existing) return existing;

  let freeUses = FREE_USES;

  if (ip) {
    try {
      const { count } = await supabaseAdmin
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gt("free_uses_remaining", 0);
      if (count && count >= MAX_FREE_ACCOUNTS_PER_IP) freeUses = 0;
    } catch {}
  }

  const { data: created, error } = await supabaseAdmin
    .from("users")
    .insert({
      anonymous_id: anonymousId,
      free_uses_remaining: freeUses,
      credits_remaining: 0,
      subscription_status: "none",
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

  if (ip && created) {
    try {
      await supabaseAdmin.from("users").update({ ip_address: ip }).eq("id", created.id);
    } catch {}
  }

  return created;
}

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
      user.free_uses_remaining + user.credits_remaining + (isSubscriber ? 999_999 : 0),
    isSubscriber,
  };
}

export async function deductUse(anonymousId: string): Promise<void> {
  const user = await ensureUser(anonymousId);

  if (user.id === "fallback") {
    throw new Error("Cannot deduct: using fallback user");
  }

  if (user.subscription_status === "active") {
    return; // Subscribers get unlimited
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
    if (error) throw new Error(`Deduction failed: ${error.message}`);
  } else if (user.credits_remaining > 0) {
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        credits_remaining: user.credits_remaining - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .eq("credits_remaining", user.credits_remaining);
    if (error) throw new Error(`Deduction failed: ${error.message}`);
  }
}

export async function addCredits(stripeCustomerId: string, amount: number): Promise<void> {
  const { error } = await supabaseAdmin.rpc("add_credits", {
    p_stripe_customer_id: stripeCustomerId, p_amount: amount,
  });
  if (error) {
    const { data: user } = await supabaseAdmin.from("users").select("id, credits_remaining").eq("stripe_customer_id", stripeCustomerId).single();
    if (user) {
      await supabaseAdmin.from("users").update({ credits_remaining: (user.credits_remaining || 0) + amount, updated_at: new Date().toISOString() }).eq("id", user.id);
    }
  }
}

export async function addCreditsByAnonymousId(anonymousId: string, amount: number): Promise<void> {
  const { data: user } = await supabaseAdmin.from("users").select("id, credits_remaining").eq("anonymous_id", anonymousId).single();
  if (!user) return;
  await supabaseAdmin.from("users").update({ credits_remaining: (user.credits_remaining || 0) + amount, updated_at: new Date().toISOString() }).eq("id", user.id);
}

export async function setSubscriptionStatus(stripeCustomerId: string, status: "active" | "cancelled" | "past_due", subscriptionEnd?: string): Promise<void> {
  await supabaseAdmin.from("users").update({ subscription_status: status, subscription_end: subscriptionEnd || null, updated_at: new Date().toISOString() }).eq("stripe_customer_id", stripeCustomerId);
}

export async function linkStripeCustomer(anonymousId: string, stripeCustomerId: string, email?: string): Promise<void> {
  await supabaseAdmin.from("users").update({ stripe_customer_id: stripeCustomerId, email: email || undefined, updated_at: new Date().toISOString() }).eq("anonymous_id", anonymousId);
}
