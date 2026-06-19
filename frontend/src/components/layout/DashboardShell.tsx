import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NmpLogo } from "@/components/layout/NmpLogo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/lib/auth";
import type { NotificationItem } from "@/lib/notifications";
import { loginForSlot } from "@/lib/navigation";
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
      void navigate({ to: loginForSlot(activeSlot), replace: true });
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

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
                "flex items-center justify-between gap-2 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "sidebar-nav-active"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-80" /> : null}
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
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border shadow-sm lg:block">{sidebar}</aside>

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
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-lg sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold lg:hidden">{portalTitle}</span>
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
                className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 text-sm shadow-sm hover:bg-muted/60"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                  {userInitials(user?.name, user?.email)}
                </span>
                <span className="max-w-[8rem] truncate">{user?.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {profileOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
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

        <main className="workspace-main flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
