import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { NmpLogo } from "@/components/layout/NmpLogo";
import { PageTransition } from "@/components/layout/PageTransition";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/lib/auth";
import type { NotificationItem } from "@/lib/notifications";
import { LOGIN } from "@/lib/navigation";
import { pathToSlot } from "@/lib/sessions";
import { cn } from "@/lib/utils";

export type NavItem = { to: string; label: string; badge?: number; icon?: LucideIcon };

export type NavSection = {
  title?: string;
  items: NavItem[];
};

type DashboardShellProps = {
  portalTitle: string;
  /** Flat list — rendered as one section (client / records). */
  nav?: NavItem[];
  /** Grouped sections with optional collapsible headers (admin). */
  navSections?: NavSection[];
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

function sectionKey(section: NavSection, index: number) {
  return section.title ?? `section-${index}`;
}

function itemIsActive(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function DashboardShell({
  portalTitle,
  nav,
  navSections,
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
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const profileRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(
    () => navSections ?? (nav ? [{ items: nav }] : []),
    [nav, navSections],
  );

  useEffect(() => {
    setCollapsedSections((prev) => {
      const next = { ...prev };
      let changed = false;
      sections.forEach((section, index) => {
        if (!section.title) return;
        const key = sectionKey(section, index);
        const hasActive = section.items.some((item) => itemIsActive(pathname, item.to));
        if (hasActive && next[key] === true) {
          next[key] = false;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [pathname, sections]);

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: prev[key] !== true }));
  };

  const isSectionOpen = (key: string, section: NavSection) => {
    if (!section.title) return true;
    return collapsedSections[key] !== true;
  };

  const renderNavItem = (item: NavItem) => {
    const active = itemIsActive(pathname, item.to);
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
  };

  const renderNavSections = () =>
    sections.map((section, index) => {
      const key = sectionKey(section, index);
      const open = isSectionOpen(key, section);
      const hasTitledGroup = Boolean(section.title) && section.items.length > 0;

      if (!hasTitledGroup) {
        return (
          <div key={key} className="space-y-1">
            {index === 0 && !section.title ? (
              <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Menu
              </p>
            ) : null}
            {section.items.map(renderNavItem)}
          </div>
        );
      }

      return (
        <div key={key} className="sidebar-nav-section">
          <button
            type="button"
            onClick={() => toggleSection(key)}
            className="sidebar-nav-section-toggle"
            aria-expanded={open}
          >
            <span>{section.title}</span>
            <ChevronDown
              className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200", !open && "-rotate-90")}
              aria-hidden
            />
          </button>
          {open ? <div className="sidebar-nav-section-items">{section.items.map(renderNavItem)}</div> : null}
        </div>
      );
    });

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

      <nav className="workspace-scroll flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {renderNavSections()}
      </nav>

      <div className="sidebar-footer hidden lg:block">
        <p className="sidebar-footer-text">National Museum of the Philippines</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="workspace-sidebar hidden w-[17rem] shrink-0 lg:block">
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
          <aside className="workspace-sidebar relative h-full w-72 max-w-[85vw] border-r border-border shadow-2xl">
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
              className="header-icon-btn text-muted-foreground lg:hidden"
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
                className="profile-trigger flex items-center gap-2 px-2.5 py-1.5 text-sm"
              >
                <span className="profile-avatar flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-primary/15">
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
