import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { MuseumBackdrop } from "@/components/layout/MuseumBackdrop";
import { NmpLogo } from "@/components/layout/NmpLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { dashboardForRole } from "@/lib/navigation";
import { useApiHealth } from "@/lib/use-api-health";
import { cn } from "@/lib/utils";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@nmp.gov.ph", password: "admin123" },
  { role: "Records", email: "records@nmp.gov.ph", password: "records123" },
  { role: "Client", email: "user@nmp.gov.ph", password: "user123" },
] as const;

export function UnifiedLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiHealth = useApiHealth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(username, password);
      if (!loggedInUser) {
        setError("Incorrect email or password.");
        return;
      }
      void navigate({ to: dashboardForRole(loggedInUser.role), replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <MuseumBackdrop variant="login" />

      <div className="login-center">
        <div className="login-card px-2 py-2 sm:px-4">
          <NmpLogo size="lg" className="mx-auto mb-6 drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]" />

          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              TARF System
            </p>
            <h1 className="mt-2 text-balance text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-white/75">
              Use your NMP account. You will be routed to Admin, Records, or Client based on your
              role.
            </p>
          </div>

          {apiHealth === "down" ? (
            <div
              className="mb-4 rounded-md border border-red-300/40 bg-red-950/40 px-3 py-3 text-sm text-red-100"
              role="alert"
            >
              <p className="font-medium">API server is not running</p>
              <p className="mt-1 text-xs leading-relaxed text-red-100/90">
                From project root run{" "}
                <code className="rounded bg-black/20 px-1">npm run start</code> and ensure MongoDB
                is running.
              </p>
            </div>
          ) : null}

          {apiHealth === "checking" ? (
            <p className="mb-4 text-center text-xs text-white/70">Checking API connection…</p>
          ) : null}

          <form onSubmit={onSubmit} className="mt-2 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/90">
                Email or username
              </Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                className={cn(
                  "h-10 border-white/25 bg-white/92 text-foreground shadow-sm",
                  "placeholder:text-muted-foreground focus-visible:border-white/50 focus-visible:ring-white/30",
                )}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className={cn(
                    "h-10 border-white/25 bg-white/92 pr-10 text-foreground shadow-sm",
                    "placeholder:text-muted-foreground focus-visible:border-white/50 focus-visible:ring-white/30",
                  )}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <p
                className="rounded-md border border-red-300/40 bg-red-950/40 px-3 py-2 text-center text-sm text-red-100"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="h-10 w-full border border-white/10 bg-primary shadow-lg shadow-black/20 hover:bg-primary/90"
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

          <div className="login-demo-box mt-6 space-y-2 px-3 py-3 text-[11px] leading-relaxed text-white/75">
            <p className="text-center font-medium text-white/90">Demo accounts</p>
            {DEMO_ACCOUNTS.map(({ role, email, password: demoPassword }) => (
              <p key={role} className="text-center">
                <span className="font-medium text-white/90">{role}:</span>{" "}
                <span className="font-mono">{email}</span> /{" "}
                <span className="font-mono">{demoPassword}</span>
              </p>
            ))}
            <p className="pt-1 text-center text-white/65">
              + 14 more client accounts (e.g. maria.santos@nmp.gov.ph) — all use password{" "}
              <span className="font-mono">user123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
