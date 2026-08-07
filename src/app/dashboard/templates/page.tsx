import { TEMPLATES } from "@/lib/data";

const categoryLabel = {
  booking: "Booking",
  checkin: "Check-in",
  transfer: "Transfer",
  faq: "FAQ",
  checkout: "Checkout",
} as const;

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Templates
        </h1>
        <p className="mt-1 text-ink-soft">
          Ready replies for WhatsApp and email — translate on send.
        </p>
      </header>

      <div className="space-y-4">
        {TEMPLATES.map((tpl) => (
          <article
            key={tpl.id}
            className="rounded-2xl border border-line bg-foam p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-ink">{tpl.name}</h2>
              <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                {categoryLabel[tpl.category]}
              </span>
              {tpl.channels.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-lagoon-mist/60 px-2.5 py-0.5 text-xs font-medium capitalize text-lagoon-deep"
                >
                  {c}
                </span>
              ))}
            </div>
            <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-soft">
              {tpl.body}
            </pre>
            <p className="mt-3 text-xs text-ink-soft">
              Variables:{" "}
              {tpl.variables.map((v) => (
                <code
                  key={v}
                  className="mr-1 rounded bg-sand px-1.5 py-0.5 text-[11px]"
                >
                  {`{{${v}}}`}
                </code>
              ))}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
