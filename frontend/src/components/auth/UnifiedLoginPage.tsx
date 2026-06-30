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
      <MuseumBackdrop />

      <div className="login-center">
        <div className="login-card">
          <div className="login-form-inner">
            <NmpLogo size="md" className="mx-auto mb-4 h-20 w-20 drop-shadow-[0_6px_18px_rgba(0,0,0,0.32)]" />

            <div className="mb-5 text-center">
              <span className="login-eyebrow">TARF System</span>
              <h1 className="login-title mt-2 text-balance text-lg font-semibold tracking-tight">
                Sign in
              </h1>
            </div>

            {apiHealth === "down" ? (
              <div className="login-alert-error mb-4" role="alert">
                <p className="font-medium">API server is not running</p>
                <p className="mt-1 text-xs leading-relaxed opacity-90">
                  From project root run{" "}
                  <code className="rounded bg-black/20 px-1">npm run start</code> and ensure
                  MongoDB is running.
                </p>
              </div>
            ) : null}

            {apiHealth === "checking" ? (
              <p className="login-alert-info mb-4 text-center">Checking API connection…</p>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs text-white/90">
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
                    "h-9 text-sm border-white/25 bg-white/92 text-foreground shadow-sm",
                    "placeholder:text-muted-foreground focus-visible:border-white/50 focus-visible:ring-white/30",
                  )}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-white/90">
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
                      "h-9 text-sm border-white/25 bg-white/92 pr-9 text-foreground shadow-sm",
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
                <p className="login-alert-error text-center" role="alert">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                size="sm"
                className="h-9 w-full"
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
          </div>
        </div>
      </div>
    </div>
  );
}
