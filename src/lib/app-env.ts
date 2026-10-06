"use client";

import { useSyncExternalStore } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __meckvyInstallPrompt?: InstallPromptEvent | null;
  }
}

const EVENT = "meckvy:app-env";

export function emitAppEnvChange() {
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("appinstalled", cb);
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("appinstalled", cb);
    mq.removeEventListener("change", cb);
  };
}

export type AppEnv = {
  ready: boolean;
  standalone: boolean;
  ios: boolean;
  canPrompt: boolean;
  pushSupported: boolean;
  permission: NotificationPermission | "unsupported";
};

const SERVER_ENV = "0|0|0|0|0|unsupported";

function snapshot(): string {
  const nav = navigator as Navigator & { standalone?: boolean };
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
  const ios =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const pushSupported = "serviceWorker" in navigator && "PushManager" in window;
  const permission = "Notification" in window ? Notification.permission : "unsupported";
  return [
    1,
    standalone ? 1 : 0,
    ios ? 1 : 0,
    window.__meckvyInstallPrompt ? 1 : 0,
    pushSupported ? 1 : 0,
    permission,
  ].join("|");
}

export function useAppEnv(): AppEnv {
  const raw = useSyncExternalStore(subscribe, snapshot, () => SERVER_ENV);
  const [ready, standalone, ios, canPrompt, pushSupported, permission] = raw.split("|");
  return {
    ready: ready === "1",
    standalone: standalone === "1",
    ios: ios === "1",
    canPrompt: canPrompt === "1",
    pushSupported: pushSupported === "1",
    permission: permission as AppEnv["permission"],
  };
}

export async function promptInstall(): Promise<boolean> {
  const evt = window.__meckvyInstallPrompt;
  if (!evt) return false;
  await evt.prompt();
  const choice = await evt.userChoice;
  window.__meckvyInstallPrompt = null;
  emitAppEnvChange();
  return choice.outcome === "accepted";
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function enableEnquiryAlerts(): Promise<{ ok: boolean; message: string }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, message: "This browser can’t show notifications." };
  }
  const permission = await Notification.requestPermission();
  emitAppEnvChange();
  if (permission !== "granted") {
    return {
      ok: false,
      message: "Notifications are blocked — allow them in your phone settings for Meckvy.",
    };
  }
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const { publicKey } = (await fetch("/api/push").then((r) => r.json())) as {
    publicKey: string | null;
  };
  if (!publicKey) {
    return { ok: false, message: "Alerts aren’t set up on the server yet." };
  }
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));
  const res = await fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  const data = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok || !data.ok) {
    return { ok: false, message: data.error ?? "Could not turn on alerts." };
  }
  return { ok: true, message: "Alerts are on — we just sent you a test ding 🔔" };
}
