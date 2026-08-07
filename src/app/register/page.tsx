"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    guesthouseName: params.get("guesthouse") ?? "",
    island: params.get("island") ?? "",
    plan: (params.get("plan") as "starter" | "pro") || "starter",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not create account");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mt-8 space-y-4 rounded-2xl border border-line bg-foam p-6"
    >
      {(
        [
          ["name", "Your name", "Ahmed"],
          ["email", "Email", "you@guesthouse.mv"],
          ["password", "Password (min 6)", "••••••••"],
          ["guesthouseName", "Guesthouse name", "Lagoon Pearl"],
          ["island", "Island", "Maafushi"],
        ] as const
      ).map(([key, label, placeholder]) => (
        <label key={key} className="block text-sm">
          <span className="font-medium text-ink-soft">{label}</span>
          <input
            required
            type={
              key === "password" ? "password" : key === "email" ? "email" : "text"
            }
            value={form[key]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink outline-none ring-lagoon focus:ring-2"
          />
        </label>
      ))}
      <label className="block text-sm">
        <span className="font-medium text-ink-soft">Plan</span>
        <select
          value={form.plan}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              plan: e.target.value as "starter" | "pro",
            }))
          }
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-ink"
        >
          <option value="starter">Starter — $29/mo</option>
          <option value="pro">Pro — $59/mo</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-coral py-3 text-sm font-semibold text-foam hover:brightness-110 disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create guesthouse account"}
      </button>
      {error && (
        <p className="text-sm text-coral" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-sand">
      <header className="flex items-center justify-between border-b border-line bg-foam px-6 py-5">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-lagoon-deep"
        >
          Meckvy
        </Link>
        <Link href="/login" className="text-sm font-medium text-ink-soft">
          Sign in
        </Link>
      </header>
      <div className="mx-auto max-w-md px-6 py-14">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          One login per guesthouse — your inbox stays private.
        </p>
        <Suspense fallback={<p className="mt-8 text-sm text-ink-soft">Loading…</p>}>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
