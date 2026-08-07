# Meckvy

Guesthouse automation for the Maldives — unified **WhatsApp + Email** inbox with **translation** and ready-made booking / transfer / check-in automations.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, then **Try the demo** → dashboard.

## What you can sell

- Unified inbox (WhatsApp + email)
- Reply in English; send in guest language (ZH, RU, DE, IT, FR, AR, HI, DV, EN)
- Templates for booking, transfers, check-in, FAQ, checkout
- Automations (instant booking ack, 24h check-in, transfer FAQ)

## Go live — WhatsApp

1. Copy `.env.example` → `.env.local` and add Meta **access token** + **Phone number ID**.
2. Run the app (`npm run dev`), expose HTTPS (`ngrok http 3000`).
3. In Meta WhatsApp → Configuration → Webhook:
   - Callback: `https://YOUR_NGROK/api/whatsapp/webhook`
   - Verify token: same as `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to `messages`
4. Open **Dashboard → Settings** → send a test message.
5. Inbox replies on WhatsApp threads send for real when credentials are set.

## Database

SQLite file at `data/meckvy.db` (created automatically). Inbox messages and pricing signups persist across restarts. Demo messages seed once if the DB is empty.

## Go live — Email (Resend)

1. Add `RESEND_API_KEY` and `EMAIL_FROM` to `.env.local`.
2. Restart the app. Open **Settings** → send a test email.
3. For inbound: Resend webhook `email.received` → `https://YOUR_HOST/api/email/webhook`.

Inbox email replies send via Resend when the key is set.

## Accounts

- `/login` · `/register` · demo `demo@meckvy.mv` / `demo1234`
- Set `AUTH_SECRET` in `.env.local` for production

## Billing (Stripe)

1. Add `STRIPE_SECRET_KEY` (test: `sk_test_…`) and `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000`.
2. Sign in → **Pricing** → **Pay with Stripe**.
3. Optional: `stripe listen --forward-to localhost:3000/api/stripe/webhook` + `STRIPE_WEBHOOK_SECRET`.
4. After pay, `/billing/success` activates the plan (even without webhook).

## Deploy (Vercel + Turso)

Local DB is a file in `data/`. **Vercel needs Turso** (free):

1. Create a DB at [turso.tech](https://turso.tech) → copy `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
2. Push this repo to GitHub.
3. Import the project on [vercel.com](https://vercel.com) (region `sin1` for Maldives/Asia).
4. Set env vars in Vercel: `AUTH_SECRET`, `TURSO_*`, `NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app`, plus WhatsApp/Resend/Stripe when ready.
5. Deploy → add your custom domain in Vercel → Domains.

Docker (VPS): `docker build -t meckvy . && docker run -p 3000:3000 -v meckvy-data:/app/data --env-file .env.local meckvy`
