"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/shared/components/ui/button";
import { demoLoginAction } from "@/modules/auth/actions/auth.actions";

function DemoSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      variant="outline"
      className="rounded-xl"
      disabled={pending}
    >
      {pending ? "Abrindo demonstração..." : "Ver demonstração"}
    </Button>
  );
}

export function DemoButton() {
  return (
    <form action={demoLoginAction}>
      <DemoSubmitButton />
    </form>
  );
}
