"use client";

import { useState } from "react";
import { AUTOMATIONS, TEMPLATES } from "@/lib/data";
import type { Automation } from "@/lib/types";

export default function AutomationsPage() {
  const [rules, setRules] = useState<Automation[]>(AUTOMATIONS);

  function toggle(id: string) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          Automations
        </h1>
        <p className="mt-1 text-ink-soft">
          Hands-free replies that still sound like your guesthouse — in every
          guest language.
        </p>
      </header>

      <ul className="space-y-4">
        {rules.map((rule) => {
          const tpl = TEMPLATES.find((t) => t.id === rule.templateId);
          return (
            <li
              key={rule.id}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-foam p-5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-ink">{rule.name}</h2>
                  {rule.translateToGuestLanguage && (
                    <span className="rounded-full bg-coral/15 px-2.5 py-0.5 text-xs font-medium text-coral">
                      Auto-translate
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-ink-soft">
                  <span className="font-medium text-ink">When:</span>{" "}
                  {rule.trigger}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  <span className="font-medium text-ink">Then:</span>{" "}
                  {rule.action}
                  {tpl ? ` (${tpl.name})` : ""}
                </p>
                <p className="mt-2 text-xs capitalize text-ink-soft">
                  Channels: {rule.channels.join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggle(rule.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  rule.enabled
                    ? "bg-lagoon text-foam hover:bg-lagoon-deep"
                    : "border border-line text-ink-soft hover:bg-sand"
                }`}
              >
                {rule.enabled ? "On" : "Off"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
