/**
 * Gumroad product URLs.
 * Update these when you create each product on Gumroad.
 */
export const GUMROAD_PRODUCTS = {
  credit_5: {
    url: "https://zhanqiuhui.gumroad.com/l/uawodz",
    name: "5 Name Credits",
  },
  credit_15: {
    url: "https://zhanqiuhui.gumroad.com/l/uawodz",
    name: "15 Name Credits",
  },
  report: {
    url: "https://zhanqiuhui.gumroad.com/l/kqzwc",
    name: "Chinese Identity Report — $4.99",
  },
} as const;

export type GumroadProductId = keyof typeof GUMROAD_PRODUCTS;

/**
 * Verify a Gumroad purchase by polling the Gumroad API.
 * Fallback when webhook hasn't fired yet.
 */
export async function verifyPurchase(email: string): Promise<boolean> {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  const productId = process.env.GUMROAD_PRODUCT_ID;
  if (!token || !productId) return false;

  try {
    const res = await fetch("https://api.gumroad.com/v2/sales", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return (data.sales || []).some(
      (s: any) =>
        s.product_id === productId &&
        s.email?.toLowerCase() === email.toLowerCase() &&
        !s.refunded
    );
  } catch {
    return false;
  }
}
