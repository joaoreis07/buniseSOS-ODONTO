import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * Card de seção padrão: título à esquerda, ação à direita, conteúdo abaixo
 * e link opcional no rodapé. Usado em todas as telas para manter a mesma
 * composição das referências visuais.
 */
export function SectionCard({
  title,
  description,
  action,
  footer,
  footerHref,
  footerLabel,
  className,
  contentClassName,
  bodyPadding = true,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  footerHref?: string;
  footerLabel?: string;
  className?: string;
  contentClassName?: string;
  bodyPadding?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn("surface-card flex flex-col", className)}>
      {title || action ? (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}

      <div className={cn("flex-1", bodyPadding && "px-5 pb-5", !title && "pt-5", contentClassName)}>
        {children}
      </div>

      {footerHref ? (
        <Link
          href={footerHref}
          className="flex items-center justify-center gap-1.5 border-t border-border px-5 py-3 text-sm font-medium text-primary transition hover:bg-brand-50"
        >
          {footerLabel}
          <ArrowRight className="size-3.5" />
        </Link>
      ) : null}

      {footer ? <div className="border-t border-border px-5 py-3">{footer}</div> : null}
    </section>
  );
}
