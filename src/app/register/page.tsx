import { Brand } from "@/shared/components/brand";
import { RegisterForm } from "@/modules/auth/components/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Brand />
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.03em]">Criar clínica</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Comece o BusinessOS Odonto em minutos
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
