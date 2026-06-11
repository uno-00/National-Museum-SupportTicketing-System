import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { LOGIN } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { to: string; label: string; badge?: number };

type DashboardShellProps = {
  portalTitle: string;
  nav: NavItem[];
  notificationCount?: number;
  notificationSlot?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({
  portalTitle,
  nav,
  notificationCount,
  notificationSlot,
  children,
}: DashboardShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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
    logout();
    void navigate({ to: LOGIN, replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-lg font-semibold tracking-tight">{portalTitle}</span>
          <div className="flex items-center gap-2">
            {notificationSlot ?? (
              <div className="relative rounded-lg p-2 text-muted-foreground">
                <Bell className="h-5 w-5" />
                {(notificationCount ?? 0) > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                    {notificationCount! > 9 ? "9+" : notificationCount}
                  </span>
                ) : null}
              </div>
            )}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-sm hover:bg-muted"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="hidden max-w-[8rem] truncate sm:inline">{user?.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {profileOpen ? (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
                  <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">{user?.email}</p>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {nav.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
                {item.badge ? (
                  <span className="ml-1.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
