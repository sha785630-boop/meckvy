"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copy",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={`btn-lift rounded-full px-4 py-2 text-sm font-semibold ${
        copied ? "bg-emerald-600 text-white" : "bg-lagoon text-foam hover:bg-lagoon-deep"
      } ${className}`}
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}
