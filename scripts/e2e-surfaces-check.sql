SELECT 'odontogram' AS src, id, surfaces::text FROM "OdontogramProcedure" WHERE id = 'cmsuqbdbw001pnqasvhztmk7g';
SELECT 'plan_tooth' AS src, id, "toothNumber", surfaces::text FROM "TreatmentPlanItemTooth" WHERE "itemId" = 'cmsuqcykm001wnqaswpd4cqh1';
SELECT 'budget_tooth' AS src, id, "toothNumber", surfaces::text FROM "TreatmentBudgetItemTooth" WHERE "budgetItemId" = 'cmsuqdqeb0027nqasbt27i4ra';
SELECT tbi.id, tbi."treatmentPlanItemId", tb.id AS budget_id, tb."treatmentPlanId"
FROM "TreatmentBudgetItem" tbi
JOIN "TreatmentBudget" tb ON tb.id = tbi."budgetId"
WHERE tbi.id = 'cmsuqdqeb0027nqasbt27i4ra';
