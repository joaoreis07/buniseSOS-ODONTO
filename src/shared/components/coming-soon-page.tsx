import { Construction } from "lucide-react";
import { EmptyState } from "@/shared/components/empty-state";

export function ComingSoonPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <EmptyState
      icon={Construction}
      title={title}
      description={description}
    />
  );
}
