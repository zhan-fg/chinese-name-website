import { supabaseAdmin } from "./supabase";

const FREE_USES = 3;
const MAX_FREE_ACCOUNTS_PER_IP = 2;
const SUBSCRIBER_DAILY_LIMIT = 50;

export async function ensureUser(anonymousId: string, ip?: string) {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id, free_uses_remaining, credits_remaining, subscription_status, daily_uses, daily_date")
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

  // Try INSERT with daily columns; fall back without if columns don't exist
  let created: Record<string, unknown> | null = null;
  let insertErr: { message: string } | null = null;

  // Attempt 1: with daily columns
  const res1 = await supabaseAdmin
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

  if (!res1.error) {
    created = res1.data;
  } else if (res1.error.message?.includes("daily_uses") || res1.error.message?.includes("daily_date")) {
    // Columns don't exist — retry without them
    const res2 = await supabaseAdmin
      .from("users")
      .insert({
        anonymous_id: anonymousId,
        free_uses_remaining: freeUses,
        credits_remaining: 0,
        subscription_status: "none",
      })
      .select("id, free_uses_remaining, credits_remaining, subscription_status")
      .single();
    if (!res2.error) {
      created = { ...res2.data, daily_uses: 0, daily_date: null };
    } else {
      insertErr = res2.error;
    }
  } else {
    insertErr = res1.error;
  }

  if (insertErr || !created) {
    console.error("Failed to create user:", insertErr);
    return {
      id: "fallback",
      free_uses_remaining: freeUses,
      credits_remaining: 0,
      subscription_status: "none",
      daily_uses: 0,
      daily_date: null,
    };
  }

  if (ip && created.id) {
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
  dailyRemaining?: number;
}> {
  const user = await ensureUser(anonymousId, ip);
  const isSubscriber = user.subscription_status === "active";

  if (isSubscriber && user.daily_date != null) {
    // Daily tracking columns exist — enforce limit
    const today = new Date().toISOString().slice(0, 10);
    const dailyUses = (user as Record<string, unknown>).daily_uses as number || 0;
    const dailyDate = (user as Record<string, unknown>).daily_date as string || "";
    const used = dailyDate === today ? dailyUses : 0;
    const remaining = Math.max(0, SUBSCRIBER_DAILY_LIMIT - used);
    return {
      freeRemaining: user.free_uses_remaining,
      creditsRemaining: user.credits_remaining,
      totalRemaining: remaining > 0 ? 999_999 : 0,
      isSubscriber,
      dailyRemaining: remaining,
    };
  }

  return {
    freeRemaining: user.free_uses_remaining,
    creditsRemaining: user.credits_remaining,
    totalRemaining: user.free_uses_remaining + user.credits_remaining + (isSubscriber ? 999_999 : 0),
    isSubscriber,
  };
}

export async function deductUse(anonymousId: string): Promise<void> {
  const user = await ensureUser(anonymousId);

  if (user.id === "fallback") {
    throw new Error("Cannot deduct: using fallback user");
  }

  if (user.subscription_status === "active") {
    // Daily tracking: only enforce if daily columns exist
    if (user.daily_date != null) {
      const today = new Date().toISOString().slice(0, 10);
      const dailyUses = (user as Record<string, unknown>).daily_uses as number || 0;
      const dailyDate = (user as Record<string, unknown>).daily_date as string || "";
      const newDailyUses = dailyDate === today ? dailyUses + 1 : 1;

      if (newDailyUses > SUBSCRIBER_DAILY_LIMIT) {
        throw new Error(`Daily limit reached (${SUBSCRIBER_DAILY_LIMIT}/day)`);
      }

      const { error } = await supabaseAdmin
        .from("users")
        .update({ daily_uses: newDailyUses, daily_date: today, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw new Error(`Subscriber deduction failed: ${error.message}`);
    }
    return; // Unlimited if no daily tracking
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
