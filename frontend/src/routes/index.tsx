import { createFileRoute, Link } from "@tanstack/react-router";
import { NmpLogo } from "@/components/layout/NmpLogo";
import { Button } from "@/components/ui/button";
import { LOGIN } from "@/lib/navigation";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [{ title: "TARF — Technical Assistance Request Form" }] }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="login-page flex min-h-screen flex-col">
      <header className="border-b border-border/60 bg-card/80 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <NmpLogo size="sm" />
          <Link to={LOGIN}>
            <Button>Login</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <NmpLogo size="lg" className="mb-8" />
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Technical Assistance Request Form System
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          National Museum of the Philippines — submit, review, and track technical assistance
          requests through a structured workflow from form creation to resolution and feedback.
        </p>

        <div className="mt-10 w-full max-w-lg rounded-lg border border-border bg-card p-6 text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-maroon">Announcements</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• All new TA forms must be approved by Records before publishing.</li>
            <li>• Client requests require admin approval before assignment.</li>
            <li>• Please submit feedback after your request is resolved.</li>
          </ul>
        </div>

        <Link to={LOGIN} className="mt-10">
          <Button size="lg" className="px-8">
            Login to TARF System
          </Button>
        </Link>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        National Museum of the Philippines
      </footer>
    </div>
  );
}
