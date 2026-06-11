import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { LOGIN } from "@/lib/navigation";
import { NmpLogo } from "./NmpLogo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const signOut = () => {
    logout();
    void navigate({ to: LOGIN, replace: true });
  };

  return (
    <div className="workspace-shell flex min-h-screen flex-col">
      <header className="workspace-topbar shrink-0">
        <div className="workspace-topbar-inner mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-7">
          <Link
            to="/"
            className="workspace-brand group flex flex-col items-center gap-3 text-center"
          >
            <NmpLogo
              size="md"
              className="mx-0 h-16 w-16 drop-shadow-[0_6px_24px_rgba(0,0,0,0.28)] transition-transform duration-300 group-hover:scale-[1.04] sm:h-20 sm:w-20"
            />
            <div className="space-y-1">
              <p className="text-balance text-base font-semibold tracking-tight text-paper sm:text-xl">
                Technical Assistance Request System
              </p>
              <p className="text-xs font-medium tracking-wide text-paper/65 sm:text-sm">
                National Museum of the Philippines
              </p>
            </div>
          </Link>
        </div>
      </header>

      <main className="workspace-main flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>
      </main>

      <footer className="workspace-footer shrink-0 border-t border-border/80 px-4 py-6 text-center">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">
          National Museum of the Philippines — Technical Assistance Request System
        </p>
        <button
          type="button"
          onClick={signOut}
          className="mt-2 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Sign out
        </button>
      </footer>
    </div>
  );
}
