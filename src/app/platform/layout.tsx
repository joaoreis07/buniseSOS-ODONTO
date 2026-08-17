import Link from "next/link";
import { requirePlatformAdmin } from "@/shared/lib/session";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-sidebar px-4 py-3 text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-sm font-semibold tracking-tight text-white">Administração da plataforma</p>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/platform" className="text-white/80 hover:text-white">
              Visão geral
            </Link>
            <Link href="/app" className="text-white/80 hover:text-white">
              Voltar à clínica
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 lg:p-8">{children}</main>
    </div>
  );
}
