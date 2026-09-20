"use client";

import { useEffect, useState } from "react";

export default function InstallApiHint() {
  const [origin, setOrigin] = useState("https://meckvy.vercel.app");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <p className="mt-2 text-sm text-zinc-500">
      Click the LinkShield icon → set API server to{" "}
      <code className="rounded bg-black px-1.5 py-0.5 text-xs font-semibold text-zinc-200">
        {origin}
      </code>{" "}
      → Save.
    </p>
  );
}
