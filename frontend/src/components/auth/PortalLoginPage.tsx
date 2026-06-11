import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { NmpLogo } from "@/components/layout/NmpLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useApiHealth } from "@/lib/use-api-health";
import type { ApiUser } from "@/lib/api/types";

type PortalLoginPageProps = {
  portalLabel: string;
  title: string;
  subtitle: string;
  footerNote: string;
  successTo: string;
  demoEmail: string;
  demoPassword: string;
  /** When true, stay on the same URL after login (landing page shows app when authenticated). */
  stayOnPage?: boolean;
  validateRole: (user: ApiUser) => boolean;
  wrongRoleMessage: string;
};

export function PortalLoginPage({
  portalLabel,
  title,
  subtitle,
  footerNote,
  successTo,
  demoEmail,
  demoPassword,
  stayOnPage = false,
  validateRole,
  wrongRoleMessage,
}: PortalLoginPageProps) {
  const navigate = useNavigate();
  const { isAuthenticated, login, logout, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiHealth = useApiHealth();

  const waitingForUser = isAuthenticated && !user;
  const wrongPortalSession = isAuthenticated && user && !validateRole(user);
  const sessionReady =
    isAuthenticated &&
    !waitingForUser &&
    !wrongPortalSession &&
    Boolean(user && validateRole(user));

  // Wrong account type — clear session so username/password always shows
  useEffect(() => {
    if (wrongPortalSession) {
      logout();
    }
  }, [wrongPortalSession, logout]);

  useEffect(() => {
    if (stayOnPage || !isAuthenticated || waitingForUser || wrongPortalSession) return;
    if (user && validateRole(user)) {
      void navigate({ to: successTo, replace: true });
    }
  }, [
    isAuthenticated,
    navigate,
    successTo,
    stayOnPage,
    user,
    validateRole,
    waitingForUser,
    wrongPortalSession,
  ]);

  if (stayOnPage && sessionReady) return null;

  if (
    !stayOnPage &&
    (waitingForUser || wrongPortalSession || (isAuthenticated && user && validateRole(user)))
  ) {
    return (
      <div className="login-page flex min-h-screen items-center justify-center">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {wrongPortalSession ? "Preparing sign in…" : "Opening workspace…"}
        </p>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const loggedInUser = await login(username, password);
      if (!loggedInUser) {
        setError("Incorrect email or password.");
        return;
      }
      if (!validateRole(loggedInUser)) {
        setError(wrongRoleMessage);
        return;
      }
      if (!stayOnPage) {
        void navigate({ to: successTo, replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page flex min-h-screen items-center justify-center px-4 py-12">
      <div className="login-card w-full max-w-md px-8 py-10 sm:px-10 sm:py-12">
        <NmpLogo size="lg" className="mb-6 drop-shadow-[0_10px_30px_rgba(80,18,18,0.2)]" />
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-maroon">{portalLabel}</p>
          <h1 className="mt-2 text-balance text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          <p className="mt-2 text-sm font-medium tracking-wide text-muted-foreground">{subtitle}</p>
        </div>

        {apiHealth === "down" ? (
          <div
            className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-destructive"
            role="alert"
          >
            <p className="font-medium">API server is not running</p>
            <p className="mt-1 text-xs leading-relaxed">
              Open a <strong>second</strong> terminal and run:{" "}
              <code className="rounded bg-destructive/10 px-1">cd backend</code> then{" "}
              <code className="rounded bg-destructive/10 px-1">npm run dev</code>
              <br />
              Or from project root:{" "}
              <code className="rounded bg-destructive/10 px-1">npm run start</code>
              <br />
              MongoDB must be open first. If you see &quot;port 4000 in use&quot;, the API is
              already running — only start the frontend.
            </p>
          </div>
        ) : null}

        {apiHealth === "checking" ? (
          <p className="mb-4 text-center text-xs text-muted-foreground">Checking API connection…</p>
        ) : null}

        <form onSubmit={onSubmit} className="mt-2 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username">Email or username</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              className="h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="h-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="h-10 w-full shadow-sm"
            disabled={isSubmitting || apiHealth === "down"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Signing in…
              </>
            ) : (
              "Log in"
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {footerNote}
        </p>

        <p className="mt-6 rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          Demo: <span className="font-mono">{demoEmail}</span> /{" "}
          <span className="font-mono">{demoPassword}</span>
        </p>
      </div>
    </div>
  );
}

