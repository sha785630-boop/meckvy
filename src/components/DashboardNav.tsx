"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Guests",
    items: [
      { href: "/dashboard", label: "Overview", icon: "🏠" },
      { href: "/dashboard/inbox", label: "Inbox", icon: "💬" },
      { href: "/dashboard/my-page", label: "My booking page", icon: "🌴" },
      { href: "/dashboard/connect", label: "Share & connect", icon: "🔗" },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/dashboard/templates", label: "Templates", icon: "📝" },
      { href: "/dashboard/automations", label: "Automations", icon: "⚡" },
    ],
  },
  {
    title: "Grow",
    items: [
      { href: "/dashboard/invite", label: "Invite & earn", icon: "🎁" },
      { href: "/dashboard/review", label: "Leave a review", icon: "⭐" },
    ],
  },
];

export function DashboardNav({ unread, isAdmin }: { unread: number; isAdmin: boolean }) {
  const pathname = usePathname();
  const groups = [
    ...GROUPS,
    {
      title: "Account",
      items: [
        { href: "/dashboard/billing", label: "Plan & billing", icon: "💳" },
        { href: "/dashboard/app", label: "Get the app", icon: "📱" },
        { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
        ...(isAdmin ? [{ href: "/dashboard/leads", label: "Admin", icon: "🛡️" }] : []),
      ],
    },
  ];

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:gap-0 md:overflow-visible md:pb-4">
      {groups.map((group) => (
        <div key={group.title} className="contents md:mb-4 md:block">
          <p className="hidden px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60 md:block">
            {group.title}
          </p>
          {group.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-lagoon text-foam shadow-sm"
                    : "text-ink-soft hover:bg-sand hover:text-ink"
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span>{item.label}</span>
                {item.href === "/dashboard/inbox" && unread > 0 && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      active ? "bg-foam text-lagoon-deep" : "bg-coral text-foam"
                    }`}
                  >
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
