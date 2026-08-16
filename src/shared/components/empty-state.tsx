"use client";

import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold tracking-[-0.02em] text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button type="button" onClick={onAction} className="mt-5 rounded-xl">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
