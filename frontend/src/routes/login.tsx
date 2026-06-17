import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, User, Users } from "lucide-react";
import { NmpLogo } from "@/components/layout/NmpLogo";
import { PortalTile } from "@/components/layout/workspace-ui";
import {
  ADMIN_LOGIN,
  CLIENT_LOGIN,
  RECORDS_LOGIN,
} from "@/lib/navigation";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Choose portal — TARF System" }] }),
  component: PortalPickerPage,
});

const PORTALS = [
  {
    to: ADMIN_LOGIN,
    label: "Admin",
    description: "Form builder, approvals, request management",
    icon: LayoutDashboard,
  },
  {
    to: RECORDS_LOGIN,
    label: "Records",
    description: "Review and publish TA forms",
    icon: Users,
  },
  {
    to: CLIENT_LOGIN,
    label: "Client",
    description: "View your requests and dashboard",
    icon: User,
  },
] as const;

function PortalPickerPage() {
  return (
    <div className="login-page flex min-h-screen items-center justify-center px-4 py-12">
      <div className="login-card w-full max-w-lg px-8 py-10 sm:px-10 sm:py-12">
        <NmpLogo size="lg" className="mx-auto mb-6" />
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-maroon">TARF System</p>
          <h1 className="mt-2 text-xl font-semibold">Choose your portal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Each role uses its own login link. Open the portal that matches your account.
          </p>
        </div>

        <div className="space-y-3">
          {PORTALS.map(({ to, label, description, icon }) => (
            <PortalTile
              key={to}
              to={to}
              label={label}
              description={description}
              icon={icon}
              showPath
            />
          ))}
        </div>
      </div>
    </div>
  );
}
