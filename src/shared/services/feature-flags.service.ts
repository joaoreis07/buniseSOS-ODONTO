import type { FeatureKey } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";
import { assertTenantId } from "@/shared/lib/tenant";

const ALL_FEATURES: FeatureKey[] = [
  "agenda",
  "patients",
  "odontogram",
  "treatments",
  "finance",
  "budgets",
  "documents",
  "clinical_records",
  "reports",
  "inventory",
  "admin",
];

export async function getFeatureFlags(
  companyId: string,
): Promise<Record<FeatureKey, boolean>> {
  assertTenantId(companyId);

  const rows = await prisma.featureFlag.findMany({
    where: { companyId },
  });

  const map = Object.fromEntries(ALL_FEATURES.map((key) => [key, false])) as Record<
    FeatureKey,
    boolean
  >;

  for (const row of rows) {
    map[row.feature] = row.enabled;
  }

  return map;
}
