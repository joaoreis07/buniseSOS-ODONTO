import type { Prisma } from "@prisma/client";

export const odontogramInclude = {
  patient: { select: { id: true, name: true, preferredName: true, birthDate: true } },
  teeth: {
    orderBy: { toothNumber: "asc" },
    include: {
      conditions: {
        where: { deletedAt: null },
        include: { surfaces: true },
        orderBy: { createdAt: "desc" },
      },
      procedures: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
      observations: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  },
  events: {
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { tooth: { select: { toothNumber: true } }, actor: { select: { name: true } } },
  },
} satisfies Prisma.OdontogramInclude;

export type OdontogramWithDetails = Prisma.OdontogramGetPayload<{
  include: typeof odontogramInclude;
}>;
