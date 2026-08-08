"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function WidgetForm() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const embed = search.get("embed") === "1";
  const id = params.id;

  const [info, setInfo] = useState<{ name: string; island: string } | null>(
    null,
  );
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dates: "",
    message: "",
  });

  useEffect(() => {
    void fetch(`/api/public/guesthouse/${id}`)
      .then(async (r) => {
        const data = (await r.json()) as {
          name?: string;
          island?: string;
          error?: string;
        };
        if (!r.ok) {
          setError(data.error ?? "Guesthouse not found");
          return;
        }
        setInfo({ name: data.name!, island: data.island! });
      })
      .catch(() => setError("Could not load guesthouse"));
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone("");
    try {
      const res = await fetch(`/api/public/guesthouse/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Send failed");
        return;
      }
      setDone(data.message ?? "Sent");
      setForm({ name: "", email: "", phone: "", dates: "", message: "" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`min-h-full ${embed ? "bg-transparent p-3" : "bg-sand px-4 py-10"}`}
    >
      <div
        className={`mx-auto max-w-md rounded-2xl border border-line bg-foam p-5 ${
          embed ? "shadow-none" : "shadow-sm"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-lagoon-deep">
          Meckvy
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
          {info?.name ?? "Guesthouse"}
        </h1>
        {info?.island && (
          <p className="mt-1 text-sm text-ink-soft">{info.island}, Maldives</p>
        )}
        <p className="mt-3 text-sm text-ink-soft">
          Send a booking or stay question — the team will reply by email or
          WhatsApp.
        </p>

        <form onSubmit={(e) => void submit(e)} className="mt-5 space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-ink-soft">Your name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-lagoon focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink-soft">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-lagoon focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink-soft">WhatsApp / phone</span>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="9607xxxxxxx"
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-lagoon focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink-soft">Stay dates (optional)</span>
            <input
              value={form.dates}
              onChange={(e) => setForm((f) => ({ ...f, dates: e.target.value }))}
              placeholder="12–15 June"
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-lagoon focus:ring-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink-soft">Message</span>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) =>
                setForm((f) => ({ ...f, message: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none ring-lagoon focus:ring-2"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-lagoon py-3 text-sm font-semibold text-foam hover:bg-lagoon-deep disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send inquiry"}
          </button>
        </form>

        {done && (
          <p className="mt-3 text-sm text-lagoon-deep" role="status">
            {done}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-coral" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function WidgetPage() {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-center text-sm text-ink-soft">Loading…</p>
      }
    >
      <WidgetForm />
    </Suspense>
  );
}
