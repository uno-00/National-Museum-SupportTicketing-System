import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { NmpLogo } from "@/components/NmpLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NMP Technical Assistance Request System — Sign in" },
      {
        name: "description",
        content: "Sign in to the NMP Technical Assistance Request System.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: "/forms/new", replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return (
      <div className="login-page flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Opening workspace…</p>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!login(username, password)) {
      setError("Incorrect username or password.");
      return;
    }
    void navigate({ to: "/forms/new", replace: true });
  };

  return (
    <div className="login-page flex min-h-screen items-center justify-center px-4 py-12">
      <div className="login-card w-full max-w-md px-8 py-10 sm:px-10 sm:py-12">
        <NmpLogo size="lg" className="mb-8" />

        <form onSubmit={onSubmit} className="mt-2 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full">
            Log in
          </Button>
        </form>

        <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Sign in once, complete the Technical Assistance Request Form, and submit it to ICT
          electronically.
        </p>
      </div>
    </div>
  );
}
