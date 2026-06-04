import { supabaseAdmin } from "./supabase";

const FREE_USES = 3;
const MAX_FREE_ACCOUNTS_PER_IP = 2;
const DAILY_LIMIT = 50;

// Detect if daily tracking columns exist (cached in module scope)
let _dailyColumnsExist: boolean | null = null;
async function dailyColumnsReady(): Promise<boolean> {
  if (_dailyColumnsExist !== null) return _dailyColumnsExist;
  try {
    const { error } = await supabaseAdmin
      .from("users")
      .select("daily_uses")
      .limit(1);
    _dailyColumnsExist = !error;
  } catch {
    _dailyColumnsExist = false;
  }
  return _dailyColumnsExist;
}

export async function ensureUser(anonymousId: string, ip?: string) {
  const hasDaily = await dailyColumnsReady();
  const cols = hasDaily
    ? "id, free_uses_remaining, credits_remaining, subscription_status, daily_uses, daily_date"
    : "id, free_uses_remaining, credits_remaining, subscription_status";

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select(cols)
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

  // Build insert object — include daily columns only if they exist
  const insertObj: Record<string, unknown> = {
    anonymous_id: anonymousId,
    free_uses_remaining: freeUses,
    credits_remaining: 0,
    subscription_status: "none",
  };
  if (hasDaily) {
    insertObj.daily_uses = 0;
    insertObj.daily_date = new Date().toISOString().slice(0, 10);
  }

  const { data: created, error } = await supabaseAdmin
    .from("users")
    .insert(insertObj)
    .select(cols)
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
      await supabaseAdmin.from("users").update({ ip_address: ip }).eq("id", (created as unknown as Record<string, unknown>).id);
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

  if (isSubscriber) {
    const u = user as Record<string, unknown>;
    if (u.daily_uses !== undefined) {
      const today = new Date().toISOString().slice(0, 10);
      const du = (u.daily_uses as number) || 0;
      const dd = (u.daily_date as string) || "";
      const used = dd === today ? du : 0;
      const remaining = Math.max(0, DAILY_LIMIT - used);
      return {
        freeRemaining: user.free_uses_remaining,
        creditsRemaining: user.credits_remaining,
        totalRemaining: remaining > 0 ? 999_999 : 0,
        isSubscriber,
        dailyRemaining: remaining,
      };
    }
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
  if (user.id === "fallback") throw new Error("Cannot deduct: using fallback user");

  const u = user as Record<string, unknown>;

  if (user.subscription_status === "active") {
    if (u.daily_uses !== undefined) {
      const today = new Date().toISOString().slice(0, 10);
      const du = (u.daily_uses as number) || 0;
      const dd = (u.daily_date as string) || "";
      const newDaily = dd === today ? du + 1 : 1;

      if (newDaily > DAILY_LIMIT) {
        throw new Error(`Daily limit reached (${DAILY_LIMIT}/day)`);
      }

      const { error } = await supabaseAdmin
        .from("users")
        .update({ daily_uses: newDaily, daily_date: today, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw new Error(`Subscriber deduction failed: ${error.message}`);
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
