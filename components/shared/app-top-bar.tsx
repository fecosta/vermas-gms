"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { BellIcon, MenuIcon, SearchIcon } from "lucide-react";

import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
      return [
        ...base,
        ...pipeline,
        { href: "/strategy", label: "Strategy" },
        { href: "/criteria", label: "Criteria" },
      ];
    case "AL":
    case "AT":
      return [...base, ...pipeline, { href: "/intake", label: "Intake" }];
    case "AD":
      return [...base, { href: "/legal", label: "Legal DD" }];
    case "TL":
      return [...base, { href: "/initiatives", label: "Pipeline" }];
    case "PEER_REVIEWER":
      return [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/reviews", label: "My reviews" },
      ];
    case "ADMIN":
      return [
        ...base,
        ...pipeline,
        { href: "/intake", label: "Intake" },
        { href: "/strategy", label: "Strategy" },
        { href: "/criteria", label: "Criteria" },
        { href: "/admin", label: "Admin" },
      ];
    default:
      return base;
  }
}

function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-baseline font-serif text-lg tracking-tight text-panel-foreground",
        className
      )}
    >
      VélezReyes<span className="text-yellow">+</span>
    </Link>
  );
}

export function AppTopBar({
  user,
  unreadCount,
}: {
  user: SessionUser;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const items = navItemsForRole(user.role);
  const [open, setOpen] = React.useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const linkClass = (active: boolean) =>
    cn(
      "rounded-lg px-3 py-1.5 text-sm transition-colors",
      active
        ? "bg-white/10 font-medium text-panel-foreground"
        : "text-white/70 hover:bg-white/5 hover:text-panel-foreground"
    );

  return (
    <header className="sticky top-0 z-50 bg-panel text-panel-foreground">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-4 px-4">
        {/* Mobile menu trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open menu"
                className="text-white/80 hover:bg-white/10 hover:text-panel-foreground lg:hidden"
              />
            }
          >
            <MenuIcon />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="border-white/10 bg-panel text-panel-foreground"
          >
            <SheetHeader>
              <SheetTitle className="text-panel-foreground">
                <Wordmark />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-2 flex flex-col gap-1">
              {items.map((item) => (
                <SheetClose
                  key={item.href}
                  render={
                    <Link
                      href={item.href}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm",
                        isActive(item.href)
                          ? "bg-white/10 font-medium text-panel-foreground"
                          : "text-white/70 hover:bg-white/5 hover:text-panel-foreground"
                      )}
                    />
                  }
                >
                  {item.label}
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Wordmark />

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClass(isActive(item.href))}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
          {user.role !== "PEER_REVIEWER" && (
            <form action="/search" className="hidden items-center sm:flex">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-white/40" />
                <input
                  name="q"
                  placeholder="Search…"
                  aria-label="Search"
                  className="h-8 w-40 rounded-full border border-white/15 bg-white/5 pr-3 pl-8 text-sm text-panel-foreground placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                />
              </div>
            </form>
          )}

          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-panel-foreground"
          >
            <BellIcon className="size-4" />
            {unreadCount && unreadCount > 0 ? (
              <span className="absolute top-1 right-1 size-2 rounded-full bg-yellow ring-2 ring-panel" />
            ) : null}
          </Link>

          <div className="hidden items-center gap-2 sm:flex">
            <Avatar name={user.name} />
            <span className="text-xs text-white/70">
              {user.role.replace("_", " ")}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-white/70 hover:bg-white/10 hover:text-panel-foreground"
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
