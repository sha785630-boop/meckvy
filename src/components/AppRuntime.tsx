"use client";

import { useEffect } from "react";
import { emitAppEnvChange } from "@/lib/app-env";

export function AppRuntime() {
  useEffect(() => {
    function onPrompt(e: Event) {
      e.preventDefault();
      window.__meckvyInstallPrompt = e as typeof window.__meckvyInstallPrompt;
      emitAppEnvChange();
    }
    window.addEventListener("beforeinstallprompt", onPrompt);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  return null;
}
