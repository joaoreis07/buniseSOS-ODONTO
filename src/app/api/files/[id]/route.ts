import { NextResponse } from "next/server";
import { auth } from "@/shared/lib/auth";
import { hasPermission } from "@/shared/lib/rbac";
import { getStorage } from "@/shared/lib/storage";
import { getPatientAttachment } from "@/modules/clinical-records/services/clinical-record.service";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.companyId || !session.user.role) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!hasPermission(session.user.role, "documents:view")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    const attachment = await getPatientAttachment(session.user.companyId, id);
    if (!attachment.fileKey) {
      return NextResponse.json({ error: "Arquivo sem conteúdo armazenado" }, { status: 404 });
    }
    const data = await getStorage().read(attachment.fileKey);
    if (!data) {
      return NextResponse.json(
        { error: "Arquivo indisponível no armazenamento" },
        { status: 404 },
      );
    }

    const download = new URL(request.url).searchParams.get("download") === "1";
    const fileName = attachment.fileName ?? "arquivo";
    const headers = new Headers();
    headers.set("Content-Type", attachment.contentType || "application/octet-stream");
    headers.set(
      "Content-Disposition",
      `${download ? "attachment" : "inline"}; filename="${encodeURIComponent(fileName)}"`,
    );
    headers.set("Cache-Control", "private, no-store");
    return new NextResponse(new Uint8Array(data), { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Arquivo não encontrado";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
