"use client";

import Link from "next/link";
import { useAppEnv } from "@/lib/app-env";

export function AppPromo() {
  const env = useAppEnv();
  if (!env.ready || (env.standalone && env.permission === "granted")) return null;

  const text = env.standalone
    ? "Turn on alerts to get a ding for every new guest enquiry."
    : "Get the Meckvy app on your phone — and a ding for every new enquiry.";

  return (
    <Link
      href="/dashboard/app"
      className="btn-lift mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-lagoon to-lagoon-deep px-5 py-4 text-foam shadow-lg shadow-lagoon/20"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/app-icon/96" alt="" className="h-11 w-11 shrink-0 rounded-xl" />
      <span className="min-w-0 flex-1 text-sm font-medium">{text}</span>
      <span className="shrink-0 rounded-full bg-foam px-4 py-2 text-sm font-semibold text-lagoon-deep">
        {env.standalone ? "Turn on" : "Get the app"}
      </span>
    </Link>
  );
}
