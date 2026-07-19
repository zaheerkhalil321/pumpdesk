"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  {
    title: "General",
    href: "/settings",
  },
  {
    title: "Business",
    href: "/settings/business",
  },
  {
    title: "Billing",
    href: "/settings/billing",
  },
  {
    title: "Fleet",
    href: "/settings/fleet",
  },
  {
    title: "Users",
    href: "/settings/users",
  },
  {
    title: "Integrations",
    href: "/settings/integrations",
  },
  {
    title: "Appearance",
    href: "/settings/appearance",
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-20 h-fit">

      <h2 className="mb-6 text-lg font-semibold">
        Settings
      </h2>

      <nav className="space-y-1">

        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            {item.title}
          </Link>
        ))}

      </nav>

    </aside>
  );
}