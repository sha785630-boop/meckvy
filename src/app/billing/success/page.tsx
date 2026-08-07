"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SuccessBody() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("Confirming your subscription…");
  const [plan, setPlan] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("Missing session — if you paid, open the dashboard.");
      return;
    }

    void fetch("/api/stripe/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          ok?: boolean;
          plan?: string;
          error?: string;
        };
        if (data.ok) {
          setPlan(data.plan ?? "");
          setStatus("Payment successful — your plan is active.");
        } else {
          setStatus(data.error ?? "Could not confirm payment yet. Check dashboard shortly.");
        }
      })
      .catch(() => setStatus("Could not confirm payment. Try the dashboard."));
  }, [sessionId]);

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
        Thank you
      </h1>
      <p className="mt-3 text-ink-soft">{status}</p>
      {plan && (
        <p className="mt-2 text-sm capitalize text-lagoon-deep">
          Plan: {plan}
        </p>
      )}
      <Link
        href="/dashboard"
        className="mt-8 inline-flex rounded-full bg-lagoon px-6 py-3 text-sm font-semibold text-foam hover:bg-lagoon-deep"
      >
        Go to dashboard
      </Link>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <main className="min-h-screen bg-sand">
      <header className="border-b border-line bg-foam px-6 py-5">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-lagoon-deep"
        >
          Meckvy
        </Link>
      </header>
      <Suspense fallback={<p className="p-10 text-center text-ink-soft">Loading…</p>}>
        <SuccessBody />
      </Suspense>
    </main>
  );
}
