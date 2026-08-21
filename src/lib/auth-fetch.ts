import { supabase } from "./supabase";

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("AUTH_REQUIRED");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export async function ensureEmailSession(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const { data } = await supabase.auth.getSession();
  if (data.session?.user.email?.toLowerCase() === normalized) return true;

  if (data.session) await supabase.auth.signOut();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: { emailRedirectTo: window.location.href },
  });
  if (error) throw error;
  return false;
}
