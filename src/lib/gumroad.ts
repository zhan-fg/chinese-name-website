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

export interface VerifiedGumroadSale {
  saleId: string;
  email: string;
  price: number;
  currency: string;
  productId: string;
  permalink: string;
  productName: string;
}

export async function verifyGumroadSale(saleId: string): Promise<VerifiedGumroadSale | null> {
  const token = process.env.GUMROAD_ACCESS_TOKEN;
  if (!token || !saleId) return null;

  const res = await fetch(`https://api.gumroad.com/v2/sales/${encodeURIComponent(saleId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const json = await res.json();
  const sale = json.sale;
  if (
    !json.success ||
    !sale ||
    sale.id !== saleId ||
    sale.refunded ||
    sale.disputed ||
    sale.chargebacked ||
    !sale.email
  ) return null;

  return {
    saleId: sale.id,
    email: sale.email.toLowerCase().trim(),
    price: Number(sale.price || 0),
    currency: String(sale.currency || "usd").toLowerCase(),
    productId: String(sale.product_id || ""),
    permalink: String(sale.product_permalink || sale.permalink || ""),
    productName: String(sale.product_name || ""),
  };
}

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
