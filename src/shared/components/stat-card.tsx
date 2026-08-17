import type { ComponentType, ReactNode, SVGProps } from "react";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

export type StatTone = "primary" | "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASS: Record<StatTone, string> = {
  primary: "bg-brand-50 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-chart-5/10 text-chart-5",
  neutral: "bg-muted text-muted-foreground",
};

/**
 * Card de indicador usado no Painel, Pacientes, Relatórios e Comunicações.
 * Mesma composição em todas as telas: ícone à esquerda, rótulo, valor e apoio.
 */
export function StatCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  tone = "primary",
  size = "default",
  className,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  href?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: StatTone;
  size?: "default" | "compact";
  className?: string;
}) {
  const compact = size === "compact";
  const body = (
    <>
      {Icon ? (
        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-full",
            compact ? "size-9" : "size-11",
            TONE_CLASS[tone],
          )}
        >
          <Icon className={compact ? "size-4" : "size-5"} />
        </span>
      ) : null}
      <span className="min-w-0">
        <span
          className={cn(
            "block font-medium text-muted-foreground",
            compact ? "text-xs" : "text-[13px]",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "block truncate font-semibold text-foreground",
            compact ? "mt-0.5 text-[17px] tracking-[-0.02em]" : "mt-1 text-2xl tracking-[-0.03em]",
          )}
        >
          {value}
        </span>
        {hint ? (
          <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </span>
    </>
  );

  const base = cn(
    "surface-card flex items-center",
    compact ? "gap-3 p-3.5" : "gap-3.5 p-4",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(base, "transition hover:border-brand-200 hover:shadow-md")}>
        {body}
      </Link>
    );
  }

  return <div className={base}>{body}</div>;
}
