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
      className="mt-8 rounded-2xl border border-line/80 bg-foam/90 p-6 backdrop-blur-sm"
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
        className="mt-6 w-full rounded-full bg-lagoon py-3 text-sm font-semibold text-foam transition hover:bg-lagoon-deep disabled:opacity-50 btn-lift"
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
    <main className="sand-glow relative flex min-h-screen flex-col overflow-hidden">
      <div
        className="animate-soft-pulse pointer-events-none absolute -right-20 top-24 h-64 w-64 rounded-full bg-lagoon-mist/40 blur-3xl"
        aria-hidden
      />
      <header className="relative z-10 flex items-center justify-between border-b border-line/70 bg-foam/70 px-6 py-5 backdrop-blur-md">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-lagoon-deep"
        >
          Meckvy
        </Link>
        <Link
          href="/register"
          className="btn-lift text-sm font-medium text-ink-soft hover:text-ink"
        >
          Create account
        </Link>
      </header>
      <div className="relative z-10 mx-auto w-full max-w-md px-6 py-14">
        <h1 className="animate-fade-up font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Sign in
        </h1>
        <p className="animate-fade-up-delay mt-2 text-sm text-ink-soft">
          Each guesthouse gets its own inbox and data.
        </p>
        <div className="animate-fade-up-delay-2">
          <Suspense fallback={<p className="mt-8 text-sm text-ink-soft">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
