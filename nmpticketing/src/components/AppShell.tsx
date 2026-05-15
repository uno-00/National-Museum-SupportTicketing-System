import { Link, useNavigate } from "@tanstack/react-router";
import { FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NmpLogo } from "@/components/NmpLogo";
import { useAuth } from "@/lib/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const signOut = () => {
    logout();
    void navigate({ to: "/", replace: true });
  };

  return (
    <div className="workspace-shell flex min-h-screen">
      <aside className="workspace-sidebar relative hidden w-64 shrink-0 flex-col lg:flex">
        <div className="flex flex-1 flex-col px-5 py-6">
          <Link to="/forms/new" className="flex flex-col items-center text-center">
            <NmpLogo size="md" className="mx-0" />
            <p className="mt-4 text-sm font-medium text-paper">Technical Assistance</p>
            <p className="text-xs text-paper/70">Request System</p>
          </Link>

          <nav className="mt-8 flex-1" aria-label="Main">
            <p className="mb-2 px-2 text-xs text-paper/60">Menu</p>
            <ul>
              <li>
                <Link
                  to="/forms/new"
                  className="workspace-nav-active flex items-center gap-2 rounded-md px-2 py-2 text-sm text-paper"
                >
                  <FileText className="h-4 w-4" />
                  New request form
                </Link>
              </li>
            </ul>
          </nav>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="mt-4 w-full justify-start gap-2 text-paper/80 hover:bg-paper/10 hover:text-paper"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 lg:hidden">
          <Link to="/forms/new" className="flex items-center gap-2">
            <NmpLogo size="sm" className="mx-0 h-10 w-10" />
            <span className="text-sm font-medium">NMP TARS</span>
          </Link>
          <Button type="button" variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </header>

        <main className="workspace-main flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
        </main>

        <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
          National Museum of the Philippines — Technical Assistance Request System
        </footer>
      </div>
    </div>
  );
}
