import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { NmpLogo } from "@/components/layout/NmpLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useApiHealth } from "@/lib/use-api-health";
import {
  ADMIN_DASHBOARD,
  CLIENT_DASHBOARD,
  dashboardForRole,
  RECORDS_DASHBOARD,
} from "@/lib/navigation";
import type { PortalSlot } from "@/lib/sessions";

const SLOT_LABEL: Record<PortalSlot, string> = {
  admin: "Admin",
  records: "Records",
  client: "Client",
};

const SLOT_DASHBOARD: Record<PortalSlot, string> = {
  admin: ADMIN_DASHBOARD,
  records: RECORDS_DASHBOARD,
  client: CLIENT_DASHBOARD,
};

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — TARF System" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, sessions, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiHealth = useApiHealth();

  const activeSessions = (["admin", "records", "client"] as PortalSlot[])
    .filter((slot) => sessions[slot])
    .map((slot) => ({ slot, user: sessions[slot]! }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const u = await login(email, password);
      if (!u) {
        setError("Incorrect email or password.");
        return;
      }
      void navigate({ to: dashboardForRole(u.role), replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page flex min-h-screen items-center justify-center px-4 py-12">
      <div className="login-card w-full max-w-md px-8 py-10 sm:px-10 sm:py-12">
        <NmpLogo size="lg" className="mx-auto mb-6" />
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold">TARF System</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Each portal keeps its own login. Signing in as Admin will not sign out Records or Client.
          </p>
        </div>

        {apiHealth === "down" ? (
          <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            API server is not running. Start backend with <code>npm run start</code>.
          </p>
        ) : null}

        {activeSessions.length > 0 ? (
          <div className="mb-5 space-y-2 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm">
            <p className="font-medium text-foreground">Active sessions</p>
            {activeSessions.map(({ slot, user }) => (
              <div key={slot} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span>
                  <strong>{SLOT_LABEL[slot]}</strong> — {user.email}
                </span>
                <div className="flex gap-2">
                  <Link to={SLOT_DASHBOARD[slot]} className="text-maroon hover:underline">
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => logout(slot)}
                    className="text-muted-foreground hover:underline"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={isSubmitting || apiHealth === "down"}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
          </Button>
        </form>

        <div className="mt-6 space-y-1 rounded-md border bg-muted/30 p-3 text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground">Three portals — log in to each as needed:</p>
          <p><strong>Admin</strong> — admin@nmp.gov.ph / admin123</p>
          <p><strong>Records</strong> — records@nmp.gov.ph / records123</p>
          <p><strong>Client</strong> — user@nmp.gov.ph / user123</p>
          <p className="pt-1 text-foreground/80">
            Tip: open Admin, Records, and Client in separate browser tabs — all stay signed in.
          </p>
        </div>
      </div>
    </div>
  );
}
