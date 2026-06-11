import { WIZARD_INPUT_CLASS } from "@/lib/form-builder/constants";

export { WIZARD_INPUT_CLASS as inputCls };

export function WizardCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`wizard-card p-7 sm:p-8 ${className}`}>{children}</div>;
}

export function WizardField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {hint ? <span className="text-[10px] text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      {subtitle ? (
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "dark";
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        tone === "dark"
          ? "bg-ink text-paper shadow-sm"
          : "bg-maroon/8 text-maroon ring-1 ring-maroon/15"
      }`}
    >
      {children}
    </span>
  );
}
