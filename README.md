This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Security setup

Before deploying, copy `.env.example` to `.env.local` and configure Supabase,
the LLM provider, Gumroad, and PayPal. Never expose the service role key or
Gumroad access token through a `NEXT_PUBLIC_*` variable.

Apply `supabase/migrations/202608210001_p0_security.sql` before deploying this
revision. It installs the atomic usage ledger, authenticated report ownership,
payment idempotency indexes, and revocable report sharing.

Configure the Gumroad Ping URL as:

```text
https://your-domain.example/api/gumroad-webhook?secret=<GUMROAD_WEBHOOK_SECRET>
```

The webhook does not trust the Ping request body. It fetches the sale from the
Gumroad API and verifies product ID, price, currency, and refund/dispute state.
Set all three Gumroad product ID variables from the Gumroad product settings.

Paid account and report APIs require a Supabase access token in the
`Authorization: Bearer <token>` header. The browser uses email OTP/magic-link
authentication before calling these endpoints. Add the production site URL and
redirect URLs to the Supabase Auth configuration.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
