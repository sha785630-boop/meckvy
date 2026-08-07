"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("demo@meckvy.mv");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mt-8 rounded-2xl border border-line bg-foam p-6 shadow-sm"
    >
      <label className="block text-sm">
        <span className="font-medium text-ink-soft">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none ring-lagoon focus:ring-2"
        />
      </label>
      <label className="mt-4 block text-sm">
        <span className="font-medium text-ink-soft">Password</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none ring-lagoon focus:ring-2"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="mt-6 w-full rounded-full bg-lagoon py-3 text-sm font-semibold text-foam hover:bg-lagoon-deep disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-coral" role="alert">
          {error}
        </p>
      )}
      <p className="mt-4 text-xs text-ink-soft">
        Demo: <code>demo@meckvy.mv</code> / <code>demo1234</code>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-sand">
      <header className="flex items-center justify-between border-b border-line bg-foam px-6 py-5">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-lagoon-deep"
        >
          Meckvy
        </Link>
        <Link href="/register" className="text-sm font-medium text-ink-soft">
          Create account
        </Link>
      </header>
      <div className="mx-auto w-full max-w-md px-6 py-14">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Each guesthouse gets its own inbox and data.
        </p>
        <Suspense fallback={<p className="mt-8 text-sm text-ink-soft">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
