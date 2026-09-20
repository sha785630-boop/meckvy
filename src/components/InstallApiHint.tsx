"use client";

import { useEffect, useState } from "react";

export default function InstallApiHint() {
  const [origin, setOrigin] = useState("https://your-app.vercel.app");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <p className="mt-2 text-sm text-ink/70">
      Click the LinkShield icon → set API server to{" "}
      <code className="rounded bg-sand px-1.5 py-0.5 text-xs font-semibold text-ink">
        {origin}
      </code>{" "}
      → Save.
    </p>
  );
}
