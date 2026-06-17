import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutDashboard, User, Users } from "lucide-react";
import { NmpLogo } from "@/components/layout/NmpLogo";
import { PortalTile } from "@/components/layout/workspace-ui";
import { Button } from "@/components/ui/button";
import {
  ADMIN_LOGIN,
  CLIENT_LOGIN,
  LOGIN,
  RECORDS_LOGIN,
} from "@/lib/navigation";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [{ title: "TARF — Technical Assistance Request Form" }] }),
  component: LandingPage,
});

const PORTALS = [
  {
    to: ADMIN_LOGIN,
    label: "Admin",
    hint: "DH / Section Head",
    description: "Form builder, approvals, request management",
    icon: LayoutDashboard,
  },
  {
    to: RECORDS_LOGIN,
    label: "Records",
    hint: "Form review & publishing",
    description: "Review and publish TA forms",
    icon: Users,
  },
  {
    to: CLIENT_LOGIN,
    label: "Client",
    hint: "Your requests & dashboard",
    description: "Submit and track your requests",
    icon: User,
  },
] as const;

function LandingPage() {
  return (
    <div className="login-page flex min-h-screen flex-col">
      <header className="border-b border-border/60 bg-card/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <NmpLogo size="sm" />
          <Link to={LOGIN}>
            <Button variant="outline" className="shadow-sm">
              All portals
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 py-16 text-center">
        <NmpLogo size="lg" className="mb-8 drop-shadow-[0_10px_30px_rgba(80,18,18,0.15)]" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-maroon">
          National Museum of the Philippines
        </p>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Technical Assistance Request Form System
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Submit, review, and track technical assistance requests through a structured workflow —
          from form creation to resolution and feedback.
        </p>

        <div className="mt-10 w-full max-w-lg rounded-[0.95rem] border border-border/80 bg-card/90 p-6 text-left shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-maroon">Announcements</p>
          <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
            <li>• All new TA forms must be approved by Records before publishing.</li>
            <li>• Client requests require admin approval before assignment.</li>
            <li>• Please submit feedback after your request is resolved.</li>
          </ul>
        </div>

        <div className="mt-10 w-full max-w-2xl space-y-3 text-left">
          {PORTALS.map(({ to, label, hint, description, icon }) => (
            <PortalTile key={to} to={to} label={label} hint={hint} description={description} icon={icon} />
          ))}
        </div>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        National Museum of the Philippines · TARF System
      </footer>
    </div>
  );
}
