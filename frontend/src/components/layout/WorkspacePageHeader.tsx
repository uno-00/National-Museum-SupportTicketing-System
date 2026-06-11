import type { ReactNode } from "react";

type WorkspacePageHeaderProps = {
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
};

export function WorkspacePageHeader({
  title,
  description,
  meta,
  actions,
}: WorkspacePageHeaderProps) {
  return (
    <div className="page-hero flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
            {description}
          </p>
        ) : null}
        {meta ? <div className="mt-3 text-xs">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card/70 p-1.5 shadow-sm backdrop-blur-sm">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
