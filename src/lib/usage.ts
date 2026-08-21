import { requireSupabaseAdmin } from "./supabase";

export async function reserveGeneration(
  anonymousId: string,
  requestId: string,
): Promise<void> {
  const { data, error } = await requireSupabaseAdmin().rpc("reserve_name_generation", {
    p_anonymous_id: anonymousId,
    p_request_id: requestId,
  });

  if (error) {
    console.error("reserve_name_generation failed", { code: error.code });
    throw new Error("USAGE_SERVICE_UNAVAILABLE");
  }
  if (data !== "reserved" && data !== "already_reserved") {
    throw new Error("INSUFFICIENT_BALANCE");
  }
}

export async function completeGeneration(requestId: string): Promise<void> {
  const { error } = await requireSupabaseAdmin().rpc("complete_name_generation", {
    p_request_id: requestId,
  });
  if (error) console.error("complete_name_generation failed", { code: error.code });
}

export async function refundGeneration(requestId: string): Promise<void> {
  const { error } = await requireSupabaseAdmin().rpc("refund_name_generation", {
    p_request_id: requestId,
  });
  if (error) console.error("refund_name_generation failed", { code: error.code });
}
