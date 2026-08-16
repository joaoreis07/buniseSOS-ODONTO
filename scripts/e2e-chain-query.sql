-- E2E chain validation for Paciente E2E Validação
SELECT 'PATIENT' AS section, id, name, "companyId"::text, NULL AS code, NULL AS tooth, NULL AS surfaces, NULL AS status, NULL AS amount
FROM "Patient" WHERE id = 'cmsuq8me90001nqass4fhz6t5';

SELECT 'ODONTOGRAM_PROC' AS section, op.id, op.title AS name, op."companyId"::text, op.code,
       ot."toothNumber"::text AS tooth, array_to_string(op.surfaces, ',') AS surfaces, op.status::text, NULL AS amount
FROM "OdontogramProcedure" op
JOIN "OdontogramTooth" ot ON ot.id = op."toothId"
JOIN "Odontogram" o ON o.id = op."odontogramId"
WHERE o."patientId" = 'cmsuq8me90001nqass4fhz6t5' AND op."deletedAt" IS NULL;

SELECT 'PLAN' AS section, tp.id, tp.title AS name, tp."companyId"::text, tp.code,
       NULL AS tooth, NULL AS surfaces, tp.status::text, NULL AS amount
FROM "TreatmentPlan" tp
WHERE tp."patientId" = 'cmsuq8me90001nqass4fhz6t5' AND tp."deletedAt" IS NULL;

SELECT 'PLAN_ITEM' AS section, tpi.id, tpi.title AS name, tpi."companyId"::text, NULL AS code,
       tpt."toothNumber"::text AS tooth, array_to_string(tpt.surfaces, ',') AS surfaces,
       tpi.status::text, tpi."unitPrice"::text AS amount
FROM "TreatmentPlanItem" tpi
JOIN "TreatmentPlan" tp ON tp.id = tpi."planId"
LEFT JOIN "TreatmentPlanItemTooth" tpt ON tpt."itemId" = tpi.id
WHERE tp."patientId" = 'cmsuq8me90001nqass4fhz6t5' AND tpi."deletedAt" IS NULL;

SELECT 'BUDGET' AS section, tb.id, tb.title AS name, tb."companyId"::text, tb.code,
       NULL AS tooth, NULL AS surfaces, tb.status::text, tb.total::text AS amount
FROM "TreatmentBudget" tb
WHERE tb."patientId" = 'cmsuq8me90001nqass4fhz6t5' AND tb."deletedAt" IS NULL;

SELECT 'BUDGET_ITEM' AS section, tbi.id, tbi.description AS name, tbi."companyId"::text, NULL AS code,
       tbt."toothNumber"::text AS tooth, array_to_string(tbt.surfaces, ',') AS surfaces,
       NULL AS status, tbi.total::text AS amount
FROM "TreatmentBudgetItem" tbi
JOIN "TreatmentBudget" tb ON tb.id = tbi."budgetId"
LEFT JOIN "TreatmentBudgetItemTooth" tbt ON tbt."budgetItemId" = tbi.id
WHERE tb."patientId" = 'cmsuq8me90001nqass4fhz6t5' AND tbi."deletedAt" IS NULL;

SELECT 'RECEIVABLE' AS section, r.id, r.description AS name, r."companyId"::text, NULL AS code,
       NULL AS tooth, NULL AS surfaces, r.status::text, r.amount::text AS amount
FROM "Receivable" r
WHERE r."patientId" = 'cmsuq8me90001nqass4fhz6t5' AND r."deletedAt" IS NULL;
