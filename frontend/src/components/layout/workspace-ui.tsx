import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { formatTicketStatus, statusToneClass, ticketStatusTone } from "@/lib/ticket-status";
import type { FormStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const FORM_STATUS_LABEL: Record<FormStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
  disapproved: "Disapproved",
};

const FORM_STATUS_TONE: Record<FormStatus, keyof typeof statusToneClass> = {
  draft: "neutral",
  pending_review: "warning",
  published: "success",
  disapproved: "danger",
};

export function WorkspacePageHeader({
  title,
  description,
  meta,
  actions,
  bordered = true,
}: {
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  bordered?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between",
        bordered && "page-hero",
      )}
    >
      <div className="min-w-0">
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
            {description}
          </p>
        ) : null}
        {meta ? <div className="mt-3">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card/80 p-1.5 shadow-sm backdrop-blur-sm">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function BackLink({ to, label = "Back" }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function StatCard({
  label,
  value,
  hint,
  to,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | string;
  hint?: string;
  to?: string;
  icon?: LucideIcon;
  loading?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="rounded-lg bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {loading ? "…" : value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className="stat-card block transition-transform hover:-translate-y-0.5">
        {content}
      </Link>
    );
  }

  return <div className="stat-card">{content}</div>;
}

export function DataPanel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("data-panel overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border/80 bg-muted/30 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = ticketStatusTone(status);
  return (
    <span className={cn("status-badge capitalize", statusToneClass[tone])}>
      {formatTicketStatus(status)}
    </span>
  );
}

export function FormStatusBadge({ status }: { status: FormStatus }) {
  const tone = FORM_STATUS_TONE[status];
  return (
    <span className={cn("status-badge", statusToneClass[tone])}>
      {FORM_STATUS_LABEL[status]}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PortalTile({
  to,
  label,
  hint,
  description,
  icon: Icon,
  showPath,
}: {
  to: string;
  label: string;
  hint?: string;
  description?: string;
  icon: LucideIcon;
  showPath?: boolean;
}) {
  return (
    <Link to={to} className="portal-tile group">
      <div className="portal-tile-icon">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="font-semibold text-foreground">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        {showPath ? <p className="mt-1.5 font-mono text-[11px] text-muted-foreground/80">{to}</p> : null}
      </div>
      <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Open →
      </span>
    </Link>
  );
}

export function ActionLink({
  to,
  children,
  variant = "primary",
}: {
  to: string;
  children: ReactNode;
  variant?: "primary" | "outline";
}) {
  return (
    <Link
      to={to}
      className={cn(
        buttonVariants({ variant: variant === "primary" ? "default" : "outline", size: "sm" }),
        "shadow-sm",
      )}
    >
      {children}
    </Link>
  );
}

export function LoadingRows({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center text-sm text-muted-foreground">
        Loading…
      </td>
    </tr>
  );
}
