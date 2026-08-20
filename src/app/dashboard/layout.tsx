import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/inbox", label: "Inbox" },
  { href: "/dashboard/templates", label: "Templates" },
  { href: "/dashboard/automations", label: "Automations" },
  { href: "/dashboard/leads", label: "Signups" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="sand-glow flex min-h-screen flex-col bg-sand md:flex-row">
      <aside className="flex flex-col border-b border-line/80 bg-foam/90 backdrop-blur-sm md:w-56 md:border-b-0 md:border-r md:min-h-screen">
        <div className="flex items-center justify-between px-5 py-5">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-xl font-semibold text-lagoon-deep"
          >
            Meckvy
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:flex-col md:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-sand hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden space-y-3 px-5 pb-5 md:block">
          <p className="text-xs text-ink-soft/90">
            {session?.guesthouseName ?? "Guesthouse"}
            {session?.island ? ` · ${session.island}` : ""}
          </p>
          <p className="truncate text-[11px] text-ink-soft/70">
            {session?.email}
          </p>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</div>
    </div>
  );
}
