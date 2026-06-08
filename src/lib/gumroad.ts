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
  subscription: {
    url: "https://zhanqiuhui.gumroad.com/l/uawodz",
    name: "50/Day — 30 Days",
  },
} as const;

export type GumroadProductId = keyof typeof GUMROAD_PRODUCTS;
