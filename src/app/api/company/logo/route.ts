import { NextResponse } from "next/server";
import { auth } from "@/shared/lib/auth";
import { hasPermission } from "@/shared/lib/rbac";
import { getStorage } from "@/shared/lib/storage";
import { getClinicLogo } from "@/modules/settings/services/settings.service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.companyId || !session.user.role) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!hasPermission(session.user.role, "settings:view")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const key = await getClinicLogo(session.user.companyId);
    if (!key) {
      return NextResponse.json({ error: "Logo não cadastrada" }, { status: 404 });
    }
    const data = await getStorage().read(key);
    if (!data) {
      return NextResponse.json({ error: "Arquivo da logo indisponível" }, { status: 404 });
    }
    const headers = new Headers();
    const extension = key.split(".").pop()?.toLowerCase();
    const contentType =
      extension === "jpg" || extension === "jpeg"
        ? "image/jpeg"
        : extension === "webp"
          ? "image/webp"
          : extension === "svg"
            ? "image/svg+xml"
            : "image/png";
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "private, no-store");
    return new NextResponse(new Uint8Array(data), { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Logo não encontrada";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
