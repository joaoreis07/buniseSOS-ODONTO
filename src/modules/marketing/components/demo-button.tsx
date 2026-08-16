import Link from "next/link";
import { Button } from "@/shared/components/ui/button";

export function DemoButton() {
  return (
    <Button asChild size="lg" variant="outline" className="rounded-xl">
      <Link href="/demo">Ver demonstração</Link>
    </Button>
  );
}
