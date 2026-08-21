import { NextRequest } from "next/server";
import { requireSupabaseAdmin } from "./supabase";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export async function requireAuthenticatedUser(
  request: NextRequest,
): Promise<AuthenticatedUser> {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error("UNAUTHORIZED");

  const { data, error } = await requireSupabaseAdmin().auth.getUser(match[1]);
  const email = data.user?.email?.toLowerCase().trim();
  if (error || !data.user || !email) throw new Error("UNAUTHORIZED");

  return { id: data.user.id, email };
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof Error && error.message === "UNAUTHORIZED";
}
