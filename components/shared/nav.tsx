"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BellIcon } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

type NavItem = { href: string; label: string };

function navItemsForRole(role: SessionUser["role"]): NavItem[] {
  const base: NavItem[] = [{ href: "/dashboard", label: "Dashboard" }];

  const pipeline: NavItem[] = [
    { href: "/initiatives", label: "Pipeline" },
    { href: "/organizations", label: "Organizations" },
    { href: "/contacts", label: "Contacts" },
  ];

  switch (role) {
    case "CEO":
      return [...base, ...pipeline, { href: "/strategy", label: "Strategy" }];
    case "KMD":
      return [...base, ...pipeline, { href: "/strategy", label: "Strategy" }, { href: "/criteria", label: "Criteria" }];
    case "AL":
    case "AT":
      return [...base, ...pipeline];
    case "AD":
      return [...base, { href: "/legal", label: "Legal DD" }];
    case "TL":
      return [...base, { href: "/initiatives", label: "Pipeline" }];
    case "PEER_REVIEWER":
      return [{ href: "/dashboard", label: "Dashboard" }, { href: "/reviews", label: "My reviews" }];
    case "ADMIN":
      return [...base, ...pipeline, { href: "/strategy", label: "Strategy" }, { href: "/criteria", label: "Criteria" }, { href: "/admin", label: "Admin" }];
    default:
      return base;
  }
}

export function Nav({ user, unreadCount }: { user: SessionUser; unreadCount?: number }) {
  const pathname = usePathname();
  const items = navItemsForRole(user.role);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-6 px-4">
        <Link href="/dashboard" className="font-semibold text-sm">
          Vermas GMS
        </Link>

        <nav className="flex flex-1 items-center gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:block">
            {user.name} · {user.role.replace("_", " ")}
          </span>
          <Link
            href="/notifications"
            className="relative rounded-md p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <BellIcon className="size-4" />
            {unreadCount && unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
