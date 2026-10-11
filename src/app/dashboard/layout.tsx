import Link from "next/link";
import { DashboardNav } from "@/components/DashboardNav";
import { LogoutButton } from "@/components/LogoutButton";
import { isAdminEmail } from "@/lib/admin";
import { getSession } from "@/lib/auth";
import { billingState, getGuesthouseRow } from "@/lib/billing";
import { listMessages } from "@/lib/store";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const unread = session
    ? (await listMessages(session.guesthouseId)).filter((m) => m.status === "unread").length
    : 0;
  const initial = (session?.guesthouseName ?? "G").trim().charAt(0).toUpperCase();
  const gh = session ? await getGuesthouseRow(session.guesthouseId) : null;
  const billing = gh ? billingState(gh) : null;
  const banner =
    billing?.kind === "due"
      ? {
          tone: "bg-coral text-foam",
          text: "Your free trial has ended — guest messages still arrive, but renew to keep using Meckvy.",
          cta: "Renew now",
        }
      : billing && billing.kind !== "demo" && billing.daysLeft <= 3
        ? {
            tone: "bg-amber-100 text-amber-950",
            text:
              billing.kind === "trial"
                ? `Your free trial ends in ${billing.daysLeft} day${billing.daysLeft === 1 ? "" : "s"}.`
                : `Your plan renews in ${billing.daysLeft} day${billing.daysLeft === 1 ? "" : "s"}.`,
            cta: "Pay by bank transfer",
          }
        : null;

  return (
    <div className="sand-glow flex min-h-screen flex-col bg-sand md:flex-row">
      <aside className="sticky top-0 z-20 flex flex-col border-b border-line/80 bg-foam/90 backdrop-blur-md md:h-screen md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-4 md:py-5">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-xl font-semibold text-lagoon-deep"
          >
            Meckvy
          </Link>
          <div className="md:hidden">
            <LogoutButton />
          </div>
        </div>
        <div className="md:flex-1 md:overflow-y-auto">
          <DashboardNav unread={unread} isAdmin={isAdminEmail(session?.email)} />
        </div>
        <div className="hidden border-t border-line px-4 py-4 md:block">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lagoon-mist font-semibold text-lagoon-deep">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {session?.guesthouseName ?? "Guesthouse"}
              </p>
              <p className="truncate text-[11px] text-ink-soft/80">{session?.email}</p>
            </div>
          </div>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>
      <div className="flex-1">
        {banner && (
          <Link
            href="/dashboard/billing"
            className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5 text-center text-sm font-medium ${banner.tone}`}
          >
            <span>{banner.text}</span>
            <span className="underline underline-offset-2">{banner.cta} →</span>
          </Link>
        )}
        <div className="px-4 py-6 md:px-8 md:py-8">{children}</div>
      </div>
    </div>
  );
}
