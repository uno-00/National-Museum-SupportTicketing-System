import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
  /** Softer motion for full-screen pages like login */
  variant?: "default" | "soft";
};

export function PageTransition({ children, className, variant = "default" }: PageTransitionProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div
      key={pathname}
      className={cn(
        variant === "soft" ? "page-transition-soft" : "page-transition",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function NavigationProgress() {
  const isPending = useRouterState({
    select: (s) => s.status === "pending" || Boolean(s.isLoading),
  });

  return (
    <div
      className={cn("navigation-progress", isPending && "navigation-progress-active")}
      aria-hidden
    >
      <span className="navigation-progress-bar" />
    </div>
  );
}
