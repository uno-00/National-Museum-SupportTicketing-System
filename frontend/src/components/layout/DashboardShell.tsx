import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NmpLogo } from "@/components/layout/NmpLogo";
import { PageTransition } from "@/components/layout/PageTransition";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/lib/auth";
import type { NotificationItem } from "@/lib/notifications";
import { LOGIN } from "@/lib/navigation";
import { pathToSlot } from "@/lib/sessions";
import { cn } from "@/lib/utils";

export type NavItem = { to: string; label: string; badge?: number; icon?: LucideIcon };

type DashboardShellProps = {
  portalTitle: string;
  nav: NavItem[];
  notifications?: NotificationItem[];
  notificationsLoading?: boolean;
  notificationsViewAllTo?: string;
  notificationsEmptyMessage?: string;
  children: ReactNode;
};

function userInitials(name?: string, email?: string) {
  const source = name ?? email ?? "?";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function DashboardShell({
  portalTitle,
  nav,
  notifications = [],
  notificationsLoading,
  notificationsViewAllTo,
  notificationsEmptyMessage,
  children,
}: DashboardShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeSlot = pathToSlot(pathname);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const close = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [profileOpen]);

  const signOut = () => {
    setProfileOpen(false);
    if (activeSlot) {
      logout(activeSlot);
      void navigate({ to: LOGIN, replace: true });
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-card">
      <div className="workspace-sidebar-brand">
        <div className="workspace-sidebar-brand-inner">
          <div className="sidebar-brand-logo-ring">
            <NmpLogo
              size="sm"
              className="brightness-0 invert drop-shadow-[0_4px_14px_rgba(255,255,255,0.18)]"
            />
          </div>
          <div className="sidebar-brand-copy">
            <p className="sidebar-brand-eyebrow">National Museum of the Philippines</p>
            <h2 className="sidebar-brand-title">{portalTitle}</h2>
          </div>
        </div>
        <div className="sidebar-brand-divider" aria-hidden />
      </div>

      <nav className="workspace-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        {nav.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center justify-between gap-2 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all",
                active
                  ? "sidebar-nav-active"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                {Icon ? (
                  <span
                    className={cn(
                      "sidebar-nav-icon",
                      active ? "sidebar-nav-icon-active" : "sidebar-nav-icon-idle",
                      !active && "group-hover:bg-muted group-hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                ) : null}
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    active ? "bg-maroon/15 text-maroon" : "bg-destructive text-white",
                  )}
                >
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer hidden lg:block">
        <p className="sidebar-footer-text">National Museum of the Philippines</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border/70 bg-gradient-to-b from-card via-card to-card/95 shadow-[4px_0_24px_color-mix(in_oklab,var(--maroon-deep)_4%,transparent)] lg:block">
        {sidebar}
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85vw] border-r border-border shadow-2xl">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg bg-card/90 p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="workspace-header relative sticky top-0 z-40 flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold lg:hidden">{portalTitle}</span>
              <span className="hidden text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground lg:block">
                {portalTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell
              items={notifications}
              loading={notificationsLoading}
              viewAllTo={notificationsViewAllTo}
              emptyMessage={notificationsEmptyMessage}
            />
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border/80 bg-card px-2.5 py-1.5 text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-maroon/25 hover:bg-muted/50 hover:shadow-md"
              >
                <span className="profile-avatar flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-[10px] font-bold text-primary ring-2 ring-primary/15">
                  {userInitials(user?.name, user?.email)}
                </span>
                <span className="max-w-[8rem] truncate">{user?.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {profileOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border/80 bg-card/95 py-1 shadow-xl backdrop-blur-md">
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="truncate text-sm font-medium">{user?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="workspace-main workspace-scroll flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
