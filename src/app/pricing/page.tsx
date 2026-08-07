"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlanId } from "@/lib/leads";

const PLANS: {
  id: PlanId;
  name: string;
  price: string;
  blurb: string;
  features: string[];
}[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$29 / month",
    blurb: "One guesthouse · WhatsApp inbox + translation",
    features: [
      "Unified WhatsApp inbox",
      "Guest-language translation",
      "Booking & transfer templates",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$59 / month",
    blurb: "WhatsApp + email · automations that save hours",
    features: [
      "Everything in Starter",
      "Email channel",
      "Check-in & FAQ automations",
      "Priority onboarding help",
    ],
  },
];

export default function PricingPage() {
  const [plan, setPlan] = useState<PlanId>("pro");
  const [form, setForm] = useState({
    guesthouseName: "",
    island: "",
    contactName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const [registerHref, setRegisterHref] = useState("/register");
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState("");
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    void fetch("/api/stripe/checkout")
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => setStripeReady(Boolean(d.configured)))
      .catch(() => setStripeReady(false));
  }, []);

  async function payWithStripe(selected: PlanId) {
    setPayBusy(true);
    setPayError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        url?: string;
        error?: string;
        login?: string;
      };
      if (res.status === 401) {
        window.location.href = data.login || "/login?next=/pricing";
        return;
      }
      if (!res.ok || !data.url) {
        setPayError(data.error ?? "Could not start checkout");
        return;
      }
      window.location.href = data.url;
    } finally {
      setPayBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone("");
    try {
      const snapshot = { ...form, plan };
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Signup failed");
        return;
      }
      setDone(data.message ?? "Saved");
      setRegisterHref(
        `/register?${new URLSearchParams({
          plan: snapshot.plan,
          guesthouse: snapshot.guesthouseName,
          island: snapshot.island,
        }).toString()}`,
      );
      setForm({
        guesthouseName: "",
        island: "",
        contactName: "",
        email: "",
        phone: "",
        notes: "",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-sand">
      <header className="flex items-center justify-between border-b border-line bg-foam px-6 py-5 md:px-10">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-lagoon-deep"
        >
          Meckvy
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-ink-soft hover:text-ink"
        >
          Sign in
        </Link>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-14 md:px-10">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold text-ink md:text-5xl">
          Simple pricing for island guesthouses
        </h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Subscribe with Stripe (monthly). Sign in first, then pay — or leave
          your details below and we’ll follow up.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl border px-6 py-6 text-left transition ${
                plan === p.id
                  ? "border-lagoon bg-foam shadow-sm ring-2 ring-lagoon/30"
                  : "border-line bg-foam/70"
              }`}
            >
              <button
                type="button"
                onClick={() => setPlan(p.id)}
                className="w-full text-left"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-xl font-semibold text-ink">{p.name}</h2>
                  <span className="font-[family-name:var(--font-display)] text-lg text-lagoon-deep">
                    {p.price}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-soft">{p.blurb}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
                  {p.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
              </button>
              <button
                type="button"
                disabled={payBusy}
                onClick={() => void payWithStripe(p.id)}
                className="mt-5 w-full rounded-full bg-lagoon py-2.5 text-sm font-semibold text-foam hover:bg-lagoon-deep disabled:opacity-50"
              >
                {payBusy ? "Redirecting…" : `Pay ${p.price} with Stripe`}
              </button>
            </div>
          ))}
        </div>
        {payError && (
          <p className="mt-3 text-sm text-coral" role="alert">
            {payError}
          </p>
        )}
        <p className="mt-3 text-xs text-ink-soft">
          {stripeReady
            ? "Stripe is connected. You must be signed in to checkout."
            : "Add STRIPE_SECRET_KEY to .env.local to enable card payments."}{" "}
          <Link href="/login?next=/pricing" className="text-lagoon-deep underline">
            Sign in
          </Link>
        </p>

        <form
          onSubmit={(e) => void submit(e)}
          className="mt-12 rounded-2xl border border-line bg-foam p-6 md:p-8"
        >
          <h2 className="text-lg font-semibold text-ink">
            Sign up — {plan === "pro" ? "Pro" : "Starter"}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Tell us about your guesthouse. We’ll reach out on WhatsApp or email.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(
              [
                ["guesthouseName", "Guesthouse name", "Lagoon Pearl"],
                ["island", "Island", "Maafushi"],
                ["contactName", "Your name", "Ahmed"],
                ["email", "Email", "you@guesthouse.mv"],
                ["phone", "WhatsApp / phone", "9607xxxxxxx"],
              ] as const
            ).map(([key, label, placeholder]) => (
              <label key={key} className="block text-sm">
                <span className="font-medium text-ink-soft">{label}</span>
                <input
                  required
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                  placeholder={placeholder}
                  type={key === "email" ? "email" : "text"}
                  className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none ring-lagoon focus:ring-2"
                />
              </label>
            ))}
          </div>

          <label className="mt-4 block text-sm md:col-span-2">
            <span className="font-medium text-ink-soft">Notes (optional)</span>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="How many rooms? Main guest languages?"
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none ring-lagoon focus:ring-2"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="mt-6 rounded-full bg-coral px-7 py-3 text-sm font-semibold text-foam hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Request access"}
          </button>

          {done && (
            <div className="mt-4 space-y-2" role="status">
              <p className="text-sm text-lagoon-deep">{done}</p>
              <Link
                href={registerHref}
                className="inline-flex rounded-full bg-lagoon px-5 py-2 text-sm font-semibold text-foam hover:bg-lagoon-deep"
              >
                Create your login next
              </Link>
            </div>
          )}
          {error && (
            <p className="mt-4 text-sm text-coral" role="alert">
              {error}
            </p>
          )}
          <p className="mt-4 text-xs text-ink-soft">
            Already know you want an account?{" "}
            <Link href="/register" className="text-lagoon-deep underline">
              Register directly
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
