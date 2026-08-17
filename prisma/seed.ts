import bcrypt from "bcryptjs";
import { PrismaClient, type FeatureKey, type Patient, type ToothSurface } from "@prisma/client";

const prisma = new PrismaClient();

const FEATURES: FeatureKey[] = [
  "agenda",
  "patients",
  "odontogram",
  "treatments",
  "budgets",
  "finance",
  "documents",
  "clinical_records",
  "reports",
  "inventory",
  "admin",
];

function atDay(base: Date, dayOffset: number, hour: number, minute: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

type SeedToothRef = number | { toothNumber: number; surfaces?: ToothSurface[] };

function seedToothCreates(teeth: SeedToothRef[]) {
  return teeth.map((tooth) =>
    typeof tooth === "number"
      ? { toothNumber: tooth, surfaces: [] as ToothSurface[] }
      : { toothNumber: tooth.toothNumber, surfaces: tooth.surfaces ?? [] },
  );
}

async function main() {
  const passwordHash = await bcrypt.hash("Demo@123456", 12);

  let company = await prisma.company.findFirst({
    where: { name: "Clinic+ Odonto Demo", deletedAt: null },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Clinic+ Odonto Demo",
        city: "Londrina",
        state: "PR",
        settings: { create: {} },
        featureFlags: {
          create: FEATURES.map((feature) => ({
            feature,
            enabled: !["reports", "inventory"].includes(feature),
          })),
        },
      },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@odonto.demo" },
    update: {
      passwordHash,
      name: "Christina Oliveira",
      deletedAt: null,
      isPlatformAdmin: true,
    },
    create: {
      name: "Christina Oliveira",
      email: "admin@odonto.demo",
      passwordHash,
      emailVerified: new Date(),
      isPlatformAdmin: true,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_companyId: { userId: admin.id, companyId: company.id },
    },
    update: { role: "ADMIN", deletedAt: null },
    create: { userId: admin.id, companyId: company.id, role: "ADMIN" },
  });

  const manager = await prisma.user.upsert({
    where: { email: "gerente@odonto.demo" },
    update: { passwordHash, name: "Everson Junior", deletedAt: null },
    create: {
      name: "Everson Junior",
      email: "gerente@odonto.demo",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_companyId: { userId: manager.id, companyId: company.id },
    },
    update: { role: "MANAGER", deletedAt: null },
    create: { userId: manager.id, companyId: company.id, role: "MANAGER" },
  });

  const employee = await prisma.user.upsert({
    where: { email: "colaborador@odonto.demo" },
    update: { passwordHash, name: "Marina Costa", deletedAt: null },
    create: {
      name: "Marina Costa",
      email: "colaborador@odonto.demo",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_companyId: { userId: employee.id, companyId: company.id },
    },
    update: { role: "EMPLOYEE", deletedAt: null },
    create: { userId: employee.id, companyId: company.id, role: "EMPLOYEE" },
  });

  const professionals = await Promise.all(
    [
      { name: "Everson Junior", color: "#0d9488", specialty: "Clínico geral" },
      { name: "Leonardo Moreira", color: "#2563eb", specialty: "Ortodontia" },
      { name: "Gustavo Miranda", color: "#059669", specialty: "Endodontia" },
    ].map(async (pro) => {
      const existing = await prisma.professional.findFirst({
        where: { companyId: company!.id, name: pro.name, deletedAt: null },
      });
      if (existing) return existing;
      return prisma.professional.create({
        data: { companyId: company!.id, ...pro },
      });
    }),
  );

  let room = await prisma.room.findFirst({
    where: { companyId: company.id, name: "Sala 1", deletedAt: null },
  });
  if (!room) {
    room = await prisma.room.create({
      data: { companyId: company.id, name: "Sala 1", color: "#94a3b8" },
    });
  }

  let chair = await prisma.chair.findFirst({
    where: { companyId: company.id, name: "Cadeira A", deletedAt: null },
  });
  if (!chair) {
    chair = await prisma.chair.create({
      data: { companyId: company.id, roomId: room.id, name: "Cadeira A" },
    });
  }

  const patientSeeds = [
    {
      name: "Zenildo Costa",
      preferredName: "Zé",
      gender: "MALE" as const,
      birthDate: new Date("1978-03-12"),
      cpf: "52998224725",
      phone: "(43) 99911-1001",
      city: "Londrina",
      state: "PR",
      insurance: null,
      allergies: "Dipirona",
    },
    {
      name: "Sidnei Joaquim",
      preferredName: null,
      gender: "MALE" as const,
      birthDate: new Date("1985-07-22"),
      cpf: "39053344705",
      phone: "(43) 99911-1002",
      city: "Londrina",
      state: "PR",
      insurance: "Unimed",
      allergies: null,
    },
    {
      name: "Thais Minelli",
      preferredName: "Thais",
      gender: "FEMALE" as const,
      birthDate: new Date("1992-11-05"),
      cpf: "15350946056",
      phone: "(43) 99911-1003",
      city: "Cambé",
      state: "PR",
      insurance: "Bradesco Dental",
      allergies: null,
    },
    {
      name: "Mirian Souza",
      preferredName: null,
      gender: "FEMALE" as const,
      birthDate: new Date("1968-01-30"),
      cpf: "11144477735",
      phone: "(43) 99911-1004",
      city: "Londrina",
      state: "PR",
      insurance: null,
      allergies: "Látex",
    },
    {
      name: "Erica Siqueira",
      preferredName: "Erica",
      gender: "FEMALE" as const,
      birthDate: new Date("1999-09-18"),
      cpf: "88641577947",
      phone: "(43) 99911-1005",
      city: "Ibiporã",
      state: "PR",
      insurance: "OdontoPrev",
      allergies: null,
    },
    {
      name: "Rosiane Rocha Lopes",
      preferredName: "Rose",
      gender: "FEMALE" as const,
      birthDate: new Date("1976-12-28"),
      cpf: "23100299900",
      phone: "(43) 99812-0424",
      city: "Londrina",
      state: "PR",
      insurance: null,
      allergies: null,
    },
    {
      name: "Pedro Henrique Alves",
      preferredName: "Pedrinho",
      gender: "MALE" as const,
      birthDate: new Date("2016-04-02"),
      cpf: null,
      phone: "(43) 99911-2001",
      city: "Londrina",
      state: "PR",
      insurance: "Unimed",
      allergies: null,
      responsibleName: "Ana Alves",
      responsiblePhone: "(43) 99911-2000",
    },
    {
      name: "Lara Fernanda Dias",
      preferredName: "Lara",
      gender: "FEMALE" as const,
      birthDate: new Date("2018-08-14"),
      cpf: null,
      phone: "(43) 99911-3001",
      city: "Cambé",
      state: "PR",
      insurance: null,
      allergies: "Amendoim",
      responsibleName: "Marcos Dias",
      responsiblePhone: "(43) 99911-3000",
    },
  ];

  const patients: Patient[] = [];
  for (const seed of patientSeeds) {
    let patient = await prisma.patient.findFirst({
      where: { companyId: company.id, name: seed.name, deletedAt: null },
    });
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          companyId: company.id,
          name: seed.name,
          preferredName: seed.preferredName,
          gender: seed.gender,
          birthDate: seed.birthDate,
          cpf: seed.cpf,
          document: seed.cpf,
          phone: seed.phone,
          whatsapp: seed.phone,
          city: seed.city,
          state: seed.state,
          insurance: seed.insurance,
          allergies: seed.allergies,
          responsibleName: "responsibleName" in seed ? seed.responsibleName : null,
          responsiblePhone: "responsiblePhone" in seed ? seed.responsiblePhone : null,
          isActive: true,
          status: "ACTIVE",
          zipCode: "86010000",
          address: "Rua Exemplo",
          addressNumber: "100",
          district: "Centro",
        },
      });
    } else {
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          preferredName: seed.preferredName,
          gender: seed.gender,
          birthDate: seed.birthDate,
          cpf: seed.cpf,
          document: seed.cpf,
          phone: seed.phone,
          whatsapp: seed.phone,
          city: seed.city,
          state: seed.state,
          insurance: seed.insurance,
          allergies: seed.allergies,
          responsibleName: "responsibleName" in seed ? seed.responsibleName ?? null : undefined,
          responsiblePhone: "responsiblePhone" in seed ? seed.responsiblePhone ?? null : undefined,
          isActive: true,
        },
      });
    }
    patients.push(patient);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const existingAppts = await prisma.appointment.count({
    where: { companyId: company.id, deletedAt: null },
  });

  if (existingAppts === 0) {
    const slots = [
      { day: 1, hour: 9, min: 0, dur: 60, patient: 0, pro: 0, procedure: "Avaliação", status: "CONFIRMED" as const },
      { day: 1, hour: 10, min: 30, dur: 45, patient: 1, pro: 0, procedure: "Profilaxia", status: "SCHEDULED" as const },
      { day: 1, hour: 14, min: 0, dur: 60, patient: 2, pro: 1, procedure: "Manutenção aparelho", status: "CONFIRMED" as const },
      { day: 2, hour: 11, min: 0, dur: 90, patient: 3, pro: 2, procedure: "Canal", status: "SCHEDULED" as const },
      { day: 3, hour: 15, min: 0, dur: 45, patient: 4, pro: 0, procedure: "Restauração", status: "WAITING" as const },
      { day: 4, hour: 9, min: 30, dur: 30, patient: 5, pro: 1, procedure: "Retorno", status: "SCHEDULED" as const },
      { day: 5, hour: 16, min: 0, dur: 60, patient: 0, pro: 2, procedure: "Clareamento", status: "SCHEDULED" as const },
    ];

    for (const slot of slots) {
      const startsAt = atDay(weekStart, slot.day, slot.hour, slot.min);
      const endsAt = new Date(startsAt.getTime() + slot.dur * 60_000);
      await prisma.appointment.create({
        data: {
          companyId: company.id,
          patientId: patients[slot.patient]!.id,
          professionalId: professionals[slot.pro]!.id,
          roomId: room.id,
          chairId: chair.id,
          procedure: slot.procedure,
          status: slot.status,
          startsAt,
          endsAt,
          confirmedAt: slot.status === "CONFIRMED" ? startsAt : null,
        },
      });
    }

    await prisma.scheduleBlock.create({
      data: {
        companyId: company.id,
        professionalId: professionals[0]!.id,
        type: "LUNCH",
        title: "Almoço",
        startsAt: atDay(weekStart, 1, 12, 0),
        endsAt: atDay(weekStart, 1, 13, 0),
      },
    });

    await prisma.waitingListEntry.create({
      data: {
        companyId: company.id,
        patientId: patients[4]!.id,
        professionalId: professionals[0]!.id,
        notes: "Prefere período da manhã",
        priority: 2,
      },
    });

    await prisma.returnAlert.create({
      data: {
        companyId: company.id,
        patientId: patients[5]!.id,
        dueDate: atDay(today, 14, 9, 0),
        reason: "Reavaliação pós-profilaxia",
      },
    });
  }

  // Cenários dinâmicos para validar o filtro de próximas consultas.
  // As datas são relativas ao momento de execução do seed para não envelhecerem.
  const fixtureNow = new Date();
  const appointmentFixtures = [
    {
      title: "[Teste Pacientes] Consulta passada",
      patientId: patients[0]!.id,
      professionalId: professionals[0]!.id,
      startsAt: new Date(fixtureNow.getTime() - 3 * 24 * 60 * 60_000),
      status: "COMPLETED" as const,
    },
    {
      title: "[Teste Pacientes] Consulta hoje",
      patientId: patients[0]!.id,
      professionalId: professionals[0]!.id,
      startsAt: new Date(fixtureNow.getTime()),
      status: "SCHEDULED" as const,
    },
    {
      title: "[Teste Pacientes] Consulta futura",
      patientId: patients[0]!.id,
      professionalId: professionals[0]!.id,
      startsAt: new Date(fixtureNow.getTime() + 2 * 24 * 60 * 60_000),
      status: "SCHEDULED" as const,
    },
    {
      title: "[Teste Pacientes] Consulta futura cancelada",
      patientId: patients[0]!.id,
      professionalId: professionals[0]!.id,
      startsAt: new Date(fixtureNow.getTime() + 3 * 24 * 60 * 60_000),
      status: "CANCELED" as const,
    },
    {
      title: "[Teste Pacientes] Consulta futura outro paciente",
      patientId: patients[1]!.id,
      professionalId: professionals[1]!.id,
      startsAt: new Date(fixtureNow.getTime() + 4 * 24 * 60 * 60_000),
      status: "SCHEDULED" as const,
    },
  ];

  for (const fixture of appointmentFixtures) {
    const endsAt = new Date(fixture.startsAt.getTime() + 30 * 60_000);
    const existing = await prisma.appointment.findFirst({
      where: {
        companyId: company.id,
        patientId: fixture.patientId,
        title: fixture.title,
        deletedAt: null,
      },
    });
    const data = {
      professionalId: fixture.professionalId,
      roomId: room.id,
      chairId: chair.id,
      startsAt: fixture.startsAt,
      endsAt,
      status: fixture.status,
      completedAt: fixture.status === "COMPLETED" ? endsAt : null,
      canceledAt: fixture.status === "CANCELED" ? fixtureNow : null,
    };

    if (existing) {
      await prisma.appointment.update({ where: { id: existing.id }, data });
    } else {
      await prisma.appointment.create({
        data: {
          companyId: company.id,
          patientId: fixture.patientId,
          title: fixture.title,
          ...data,
        },
      });
    }
  }

  const fdiTeeth = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
    55, 54, 53, 52, 51, 61, 62, 63, 64, 65,
    85, 84, 83, 82, 81, 71, 72, 73, 74, 75,
  ];
  const demoCompanyId = company.id;

  for (const feature of FEATURES) {
    await prisma.featureFlag.upsert({
      where: { companyId_feature: { companyId: demoCompanyId, feature } },
      update: { enabled: !["reports", "inventory"].includes(feature) },
      create: {
        companyId: demoCompanyId,
        feature,
        enabled: !["reports", "inventory"].includes(feature),
      },
    });
  }

  async function ensureOdontogram(patientId: string) {
    let odontogram = await prisma.odontogram.findFirst({
      where: { companyId: demoCompanyId, patientId, deletedAt: null },
    });
    if (!odontogram) {
      odontogram = await prisma.odontogram.create({
        data: {
          companyId: demoCompanyId,
          patientId,
          createdById: admin.id,
          updatedById: admin.id,
          teeth: { create: fdiTeeth.map((toothNumber) => ({ companyId: demoCompanyId, toothNumber })) },
        },
      });
    }
    return odontogram;
  }

  async function getTooth(odontogramId: string, toothNumber: number) {
    const tooth = await prisma.odontogramTooth.findFirst({
      where: { companyId: demoCompanyId, odontogramId, toothNumber },
    });
    if (!tooth) throw new Error(`Dente ${toothNumber} não encontrado no seed`);
    return tooth;
  }

  async function ensureCondition(input: {
    odontogramId: string;
    toothNumber: number;
    code: string;
    title: string;
    phase: "CURRENT" | "PLANNED";
    status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "RESOLVED" | "CANCELLED";
    surfaces: ("MESIAL" | "DISTAL" | "OCCLUSAL" | "VESTIBULAR" | "LINGUAL" | "INCISAL" | "CERVICAL" | "WHOLE")[];
    notes?: string;
  }) {
    const tooth = await getTooth(input.odontogramId, input.toothNumber);
    let condition = await prisma.toothCondition.findFirst({
      where: { companyId: demoCompanyId, odontogramId: input.odontogramId, toothId: tooth.id, code: input.code, deletedAt: null },
    });
    if (!condition) {
      condition = await prisma.toothCondition.create({
        data: {
          companyId: demoCompanyId,
          odontogramId: input.odontogramId,
          toothId: tooth.id,
          code: input.code,
          title: input.title,
          phase: input.phase,
          status: input.status,
          notes: input.notes ?? null,
          createdById: admin.id,
          updatedById: admin.id,
          surfaces: { create: input.surfaces.map((surface) => ({ surface })) },
        },
      });
    }
    return { condition, tooth };
  }

  async function ensureProcedure(input: {
    odontogramId: string;
    toothId: string;
    conditionId?: string;
    code: string;
    title: string;
    phase: "CURRENT" | "PLANNED";
    status: "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "RESOLVED" | "CANCELLED";
    surfaces: ("MESIAL" | "DISTAL" | "OCCLUSAL" | "VESTIBULAR" | "LINGUAL" | "INCISAL" | "CERVICAL" | "WHOLE")[];
  }) {
    const existing = await prisma.odontogramProcedure.findFirst({
      where: { companyId: demoCompanyId, odontogramId: input.odontogramId, toothId: input.toothId, code: input.code, deletedAt: null },
    });
    if (existing) return existing;
    return prisma.odontogramProcedure.create({
      data: {
        companyId: demoCompanyId,
        odontogramId: input.odontogramId,
        toothId: input.toothId,
        conditionId: input.conditionId,
        code: input.code,
        title: input.title,
        phase: input.phase,
        status: input.status,
        surfaces: input.surfaces,
        plannedAt: input.phase === "PLANNED" ? new Date() : null,
        completedAt: input.status === "COMPLETED" ? new Date() : null,
        createdById: admin.id,
        updatedById: admin.id,
      },
    });
  }

  async function ensureObservation(odontogramId: string, toothId: string, body: string) {
    const existing = await prisma.toothObservation.findFirst({
      where: { companyId: demoCompanyId, odontogramId, toothId, body, deletedAt: null },
    });
    if (!existing) {
      await prisma.toothObservation.create({
        data: { companyId: demoCompanyId, odontogramId, toothId, body, createdById: admin.id, updatedById: admin.id },
      });
    }
  }

  const firstChart = await ensureOdontogram(patients[0]!.id);
  const firstCaries = await ensureCondition({
    odontogramId: firstChart.id, toothNumber: 16, code: "CARIES", title: "Cárie oclusal", phase: "CURRENT", status: "ACTIVE", surfaces: ["OCCLUSAL"], notes: "Sensibilidade ao frio.",
  });
  await ensureObservation(firstChart.id, firstCaries.tooth.id, "Paciente relata dor intermitente há duas semanas.");
  await ensureProcedure({
    odontogramId: firstChart.id,
    toothId: firstCaries.tooth.id,
    conditionId: firstCaries.condition.id,
    code: "RESTORACAO",
    title: "Restauração",
    phase: "PLANNED",
    status: "ACTIVE",
    surfaces: ["OCCLUSAL"],
  });
  const firstTooth26 = await getTooth(firstChart.id, 26);
  await ensureProcedure({
    odontogramId: firstChart.id,
    toothId: firstTooth26.id,
    code: "RESTORACAO",
    title: "Restauração",
    phase: "PLANNED",
    status: "ACTIVE",
    surfaces: ["OCCLUSAL", "MESIAL"],
  });
  const firstTooth36 = await getTooth(firstChart.id, 36);
  await ensureProcedure({
    odontogramId: firstChart.id,
    toothId: firstTooth36.id,
    code: "RESTORACAO",
    title: "Restauração",
    phase: "PLANNED",
    status: "ACTIVE",
    surfaces: ["MESIAL"],
  });

  const secondChart = await ensureOdontogram(patients[1]!.id);
  const secondRestoration = await ensureCondition({
    odontogramId: secondChart.id, toothNumber: 26, code: "RESTORATION", title: "Restauração a substituir", phase: "PLANNED", status: "ACTIVE", surfaces: ["OCCLUSAL", "MESIAL"],
  });
  await ensureProcedure({
    odontogramId: secondChart.id, toothId: secondRestoration.tooth.id, conditionId: secondRestoration.condition.id, code: "RESTORACAO_RESINA", title: "Restauração em resina", phase: "PLANNED", status: "ACTIVE", surfaces: ["OCCLUSAL", "MESIAL"],
  });

  const thirdChart = await ensureOdontogram(patients[2]!.id);
  const thirdCanal = await ensureCondition({
    odontogramId: thirdChart.id, toothNumber: 11, code: "ROOT_CANAL", title: "Tratamento de canal", phase: "CURRENT", status: "COMPLETED", surfaces: ["WHOLE"], notes: "Tratamento endodôntico concluído.",
  });
  await ensureProcedure({
    odontogramId: thirdChart.id, toothId: thirdCanal.tooth.id, conditionId: thirdCanal.condition.id, code: "ENDODONTIA", title: "Tratamento endodôntico", phase: "CURRENT", status: "COMPLETED", surfaces: ["WHOLE"],
  });

  const fourthChart = await ensureOdontogram(patients[5]!.id);
  const multipleCondition = await ensureCondition({
    odontogramId: fourthChart.id, toothNumber: 75, code: "CARIES", title: "Cárie em decíduo", phase: "CURRENT", status: "IN_PROGRESS", surfaces: ["OCCLUSAL"],
  });
  await ensureCondition({
    odontogramId: fourthChart.id, toothNumber: 85, code: "FRACTURE", title: "Fratura dental", phase: "CURRENT", status: "ACTIVE", surfaces: ["VESTIBULAR"],
  });
  await ensureObservation(fourthChart.id, multipleCondition.tooth.id, "Responsável informado sobre cuidados com higiene.");

  const historyBatchId = "seed-odontogram-history";
  const existingHistory = await prisma.odontogramEvent.findFirst({
    where: { odontogramId: thirdChart.id, batchId: historyBatchId },
  });
  if (!existingHistory) {
    await prisma.odontogramEvent.create({
      data: {
        companyId: company.id,
        odontogramId: thirdChart.id,
        toothId: thirdCanal.tooth.id,
        batchId: historyBatchId,
        type: "PROCEDURE_CREATED",
        before: { status: "IN_PROGRESS" },
        after: { status: "COMPLETED", procedure: "ENDODONTIA" },
        actorId: admin.id,
      },
    });
  }

  const procedureSeeds = [
    ["AVALIACAO", "Avaliação", "Diagnóstico", 120],
    ["LIMPEZA", "Limpeza", "Prevenção", 150],
    ["PROFILAXIA", "Profilaxia", "Prevenção", 150],
    ["RESTORACAO", "Restauração", "Dentística", 250],
    ["EXTRACAO", "Extração", "Cirurgia", 350],
    ["CANAL", "Canal", "Endodontia", 1200],
    ["COROA", "Coroa", "Prótese", 1800],
    ["IMPLANTE", "Implante", "Implantodontia", 3500],
    ["CLAREAMENTO", "Clareamento", "Estética", 900],
    ["FLUOR", "Fluorterapia", "Prevenção", 90],
  ] as const;
  const procedures = await Promise.all(procedureSeeds.map(([code, name, category, defaultPrice]) =>
    prisma.procedureCatalog.upsert({
      where: { companyId_code: { companyId: demoCompanyId, code } },
      update: { name, category, defaultPrice, active: true, deletedAt: null },
      create: { companyId: demoCompanyId, code, name, category, defaultPrice },
    }),
  ));
  const particular = await prisma.priceTable.upsert({
    where: { companyId_name: { companyId: demoCompanyId, name: "Particular" } },
    update: { active: true, isDefault: true, deletedAt: null },
    create: { companyId: demoCompanyId, name: "Particular", description: "Tabela padrão da clínica", active: true, isDefault: true },
  });
  await Promise.all(procedures.map((procedure) => prisma.priceTableItem.upsert({
    where: { priceTableId_procedureId: { priceTableId: particular.id, procedureId: procedure.id } },
    update: { unitPrice: procedure.defaultPrice },
    create: { companyId: demoCompanyId, priceTableId: particular.id, procedureId: procedure.id, unitPrice: procedure.defaultPrice },
  })));
  await prisma.priceTable.upsert({
    where: { companyId_name: { companyId: demoCompanyId, name: "Convênio" } },
    update: { active: true, deletedAt: null },
    create: { companyId: demoCompanyId, name: "Convênio", description: "Tabela demonstrativa para convênios" },
  });

  async function ensureBudget(code: string, title: string, status: "DRAFT" | "SENT" | "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED", entries: { procedure: string; teeth: SeedToothRef[]; quantity?: number; price?: number; itemStatus?: "PENDING" | "APPROVED" | "REJECTED" }[]) {
    const existing = await prisma.treatmentBudget.findFirst({ where: { companyId: demoCompanyId, code } });
    if (existing) {
      if (existing.deletedAt) await prisma.treatmentBudget.update({ where: { id: existing.id }, data: { deletedAt: null, status, updatedById: admin.id } });
      return;
    }
    const subtotal = entries.reduce((sum, entry) => sum + (entry.quantity ?? 1) * (entry.price ?? procedures.find((item) => item.code === entry.procedure)?.defaultPrice.toNumber() ?? 0), 0);
    await prisma.treatmentBudget.create({
      data: {
        companyId: demoCompanyId, patientId: patients[0]!.id, priceTableId: particular.id, code, title, status,
        subtotal, discount: 0, total: subtotal, createdById: admin.id, updatedById: admin.id,
        sentAt: status === "DRAFT" ? null : new Date(), approvedAt: ["APPROVED", "PARTIALLY_APPROVED"].includes(status) ? new Date() : null, approvedById: ["APPROVED", "PARTIALLY_APPROVED"].includes(status) ? admin.id : null,
        items: { create: entries.map((entry) => {
          const procedure = procedures.find((item) => item.code === entry.procedure)!;
          const price = entry.price ?? procedure.defaultPrice.toNumber();
          return { companyId: demoCompanyId, procedureId: procedure.id, code: procedure.code, description: procedure.name, professionalId: professionals[0]!.id, quantity: entry.quantity ?? 1, unitPrice: price, discount: 0, total: price * (entry.quantity ?? 1), status: entry.itemStatus ?? "PENDING", teeth: { create: seedToothCreates(entry.teeth) } };
        }) },
        events: { create: { companyId: demoCompanyId, actorId: admin.id, type: "CREATED" } },
      },
    });
  }
  await ensureBudget("ORC-SEED-001", "Tratamento Restaurador", "APPROVED", [{ procedure: "RESTORACAO", teeth: [16], itemStatus: "APPROVED" }, { procedure: "RESTORACAO", teeth: [26], itemStatus: "APPROVED" }, { procedure: "PROFILAXIA", teeth: [], itemStatus: "APPROVED" }]);
  await ensureBudget("ORC-SEED-002", "Revisão preventiva", "DRAFT", [{ procedure: "LIMPEZA", teeth: [] }]);
  await ensureBudget("ORC-SEED-003", "Proposta enviada", "SENT", [{ procedure: "CANAL", teeth: [36] }]);
  await ensureBudget("ORC-SEED-004", "Tratamento parcial", "PARTIALLY_APPROVED", [{ procedure: "RESTORACAO", teeth: [16], itemStatus: "APPROVED" }, { procedure: "CANAL", teeth: [36], itemStatus: "REJECTED" }]);
  await ensureBudget("ORC-SEED-005", "Proposta recusada", "REJECTED", [{ procedure: "CLAREAMENTO", teeth: [], itemStatus: "REJECTED" }]);
  await ensureBudget("ORC-SEED-FACES", "Restaurações por face", "APPROVED", [
    { procedure: "RESTORACAO", teeth: [{ toothNumber: 16, surfaces: ["OCCLUSAL"] }], itemStatus: "APPROVED" },
    { procedure: "RESTORACAO", teeth: [{ toothNumber: 26, surfaces: ["OCCLUSAL", "MESIAL"] }], itemStatus: "APPROVED" },
    { procedure: "RESTORACAO", teeth: [{ toothNumber: 36, surfaces: ["MESIAL"] }, { toothNumber: 46, surfaces: ["OCCLUSAL"] }], itemStatus: "APPROVED" },
  ]);

  type PlanItemSeed = {
    procedure: string;
    teeth: SeedToothRef[];
    status: "PLANNED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    sortOrder?: number;
  };

  async function ensureTreatmentPlan(
    code: string,
    title: string,
    patientIndex: number,
    status: "ACTIVE" | "COMPLETED" | "CANCELLED",
    entries: PlanItemSeed[],
  ) {
    const existing = await prisma.treatmentPlan.findFirst({ where: { companyId: demoCompanyId, code } });
    if (existing) {
      if (existing.deletedAt) {
        await prisma.treatmentPlan.update({ where: { id: existing.id }, data: { deletedAt: null, status, updatedById: admin.id } });
      }
      return existing;
    }
    const plan = await prisma.treatmentPlan.create({
      data: {
        companyId: demoCompanyId,
        patientId: patients[patientIndex]!.id,
        responsibleProfessionalId: professionals[0]!.id,
        code,
        title,
        status,
        createdById: admin.id,
        updatedById: admin.id,
        items: {
          create: entries.map((entry, index) => {
            const procedure = procedures.find((item) => item.code === entry.procedure)!;
            return {
              companyId: demoCompanyId,
              procedureId: procedure.id,
              professionalId: professionals[0]!.id,
              code: procedure.code,
              title: procedure.name,
              quantity: 1,
              unitPrice: procedure.defaultPrice,
              status: entry.status,
              sortOrder: entry.sortOrder ?? index,
              completedAt: entry.status === "COMPLETED" ? new Date() : null,
              startedAt: entry.status === "IN_PROGRESS" || entry.status === "COMPLETED" ? new Date() : null,
              teeth: { create: seedToothCreates(entry.teeth) },
            };
          }),
        },
        events: { create: { companyId: demoCompanyId, actorId: admin.id, type: "CREATED" } },
      },
    });
    return plan;
  }

  await ensureTreatmentPlan("PLN-SEED-PLANNED", "Reabilitação oral", 0, "ACTIVE", [
    { procedure: "AVALIACAO", teeth: [], status: "PLANNED", sortOrder: 0 },
    { procedure: "RESTORACAO", teeth: [16], status: "PLANNED", sortOrder: 1 },
    { procedure: "CANAL", teeth: [36], status: "PLANNED", sortOrder: 2 },
    { procedure: "COROA", teeth: [36], status: "PLANNED", sortOrder: 3 },
  ]);
  await ensureTreatmentPlan("PLN-SEED-PROGRESS", "Tratamento restaurador", 0, "ACTIVE", [
    { procedure: "AVALIACAO", teeth: [], status: "COMPLETED", sortOrder: 0 },
    { procedure: "RESTORACAO", teeth: [16], status: "IN_PROGRESS", sortOrder: 1 },
    { procedure: "CANAL", teeth: [36], status: "PLANNED", sortOrder: 2 },
  ]);
  await ensureTreatmentPlan("PLN-SEED-PARTIAL", "Protocolo preventivo", 2, "ACTIVE", [
    { procedure: "PROFILAXIA", teeth: [], status: "COMPLETED", sortOrder: 0 },
    { procedure: "FLUOR", teeth: [], status: "PLANNED", sortOrder: 1 },
  ]);
  await ensureTreatmentPlan("PLN-SEED-DONE", "Canal concluído", 1, "COMPLETED", [
    { procedure: "AVALIACAO", teeth: [], status: "COMPLETED", sortOrder: 0 },
    { procedure: "CANAL", teeth: [11], status: "COMPLETED", sortOrder: 1 },
  ]);
  await ensureTreatmentPlan("PLN-SEED-FACES", "Restaurações por face", 0, "ACTIVE", [
    { procedure: "RESTORACAO", teeth: [{ toothNumber: 16, surfaces: ["OCCLUSAL"] }], status: "PLANNED", sortOrder: 0 },
    { procedure: "RESTORACAO", teeth: [{ toothNumber: 26, surfaces: ["OCCLUSAL", "MESIAL"] }], status: "PLANNED", sortOrder: 1 },
    { procedure: "RESTORACAO", teeth: [{ toothNumber: 36, surfaces: ["MESIAL"] }, { toothNumber: 46, surfaces: ["OCCLUSAL"] }], status: "PLANNED", sortOrder: 2 },
  ]);

  const budgetLinkedPlan = await ensureTreatmentPlan("PLN-SEED-BUDGET", "Plano com orçamento", 0, "ACTIVE", [
    { procedure: "LIMPEZA", teeth: [], status: "PLANNED", sortOrder: 0 },
  ]);
  const draftBudget = await prisma.treatmentBudget.findFirst({ where: { companyId: demoCompanyId, code: "ORC-SEED-002" }, include: { items: { where: { deletedAt: null } } } });
  const linkedPlanItem = await prisma.treatmentPlanItem.findFirst({
    where: { planId: budgetLinkedPlan.id, deletedAt: null },
    include: { budgetItem: true },
  });
  if (draftBudget?.items[0] && linkedPlanItem && !linkedPlanItem.budgetItem) {
    await prisma.treatmentBudget.update({ where: { id: draftBudget.id }, data: { treatmentPlanId: budgetLinkedPlan.id } });
    await prisma.treatmentBudgetItem.update({ where: { id: draftBudget.items[0]!.id }, data: { treatmentPlanItemId: linkedPlanItem.id } });
  }

  async function copyBudgetSnapshotToReceivable(receivableId: string, budgetId: string) {
    const existingItems = await prisma.receivableItem.count({ where: { receivableId } });
    if (existingItems > 0) return;
    const budget = await prisma.treatmentBudget.findFirst({
      where: { id: budgetId, companyId: demoCompanyId },
      include: { items: { where: { deletedAt: null, status: "APPROVED" }, include: { teeth: true } } },
    });
    if (!budget?.items.length) return;
    for (const item of budget.items) {
      await prisma.receivableItem.create({
        data: {
          companyId: demoCompanyId,
          receivableId,
          budgetItemId: item.id,
          description: item.description,
          code: item.code,
          professionalId: item.professionalId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          total: item.total,
          teeth: {
            create: item.teeth.map((tooth) => ({
              toothNumber: tooth.toothNumber,
              surfaces: tooth.surfaces,
            })),
          },
        },
      });
    }
  }

  async function ensureReceivable(code: string, budgetCode: string, status: "OPEN" | "PARTIALLY_PAID" | "PAID" | "OVERDUE", amount: number, paid: number, dueOffset: number) {
    const existing = await prisma.receivable.findFirst({ where: { companyId: demoCompanyId, code, deletedAt: null } });
    if (existing) {
      if (existing.budgetId) await copyBudgetSnapshotToReceivable(existing.id, existing.budgetId);
      return;
    }
    const budget = await prisma.treatmentBudget.findFirstOrThrow({ where: { companyId: demoCompanyId, code: budgetCode } });
    const receivable = await prisma.receivable.create({ data: { companyId: demoCompanyId, patientId: budget.patientId, budgetId: budget.id, code, title: budget.title, status, subtotal: amount, discount: 0, total: amount, receivedAmount: paid, balance: amount - paid, createdById: admin.id, updatedById: admin.id } });
    await copyBudgetSnapshotToReceivable(receivable.id, budget.id);
    const count = code === "REC-SEED-PAID" ? 3 : code === "REC-SEED-PARTIAL" || code === "REC-SEED-OPEN" || code === "REC-SEED-OVERDUE" ? 4 : 1;
    const portion = amount / count;
    const installments = await Promise.all(Array.from({ length: count }, (_, index) => {
      const installmentPaid = code === "REC-SEED-PARTIAL" && index === 0 ? portion : code === "REC-SEED-PAID" ? portion : paid;
      const offset = code === "REC-SEED-OVERDUE" ? (index < 2 ? -30 : 30) : dueOffset + index * 30;
      return prisma.installment.create({ data: { companyId: demoCompanyId, receivableId: receivable.id, patientId: budget.patientId, sequence: index + 1, dueDate: atDay(new Date(), offset, 12, 0), amount: portion, receivedAmount: installmentPaid, balance: portion - installmentPaid, status: installmentPaid === portion ? "PAID" : installmentPaid > 0 ? "PARTIALLY_PAID" : offset < 0 ? "OVERDUE" : "PENDING" } });
    }));
    for (const installment of installments) if (installment.receivedAmount.gt(0)) await prisma.payment.create({ data: { companyId: demoCompanyId, installmentId: installment.id, patientId: budget.patientId, amount: installment.receivedAmount, method: "PIX", paidAt: new Date(), registeredById: admin.id } });
    await prisma.financeEvent.create({ data: { companyId: demoCompanyId, receivableId: receivable.id, actorId: admin.id, type: "RECEIVABLE_CREATED" } });
  }
  await ensureReceivable("REC-SEED-OPEN", "ORC-SEED-001", "OPEN", 2000, 0, 30);
  await ensureReceivable("REC-SEED-PARTIAL", "ORC-SEED-004", "PARTIALLY_PAID", 500, 200, 30);
  await ensureReceivable("REC-SEED-PAID", "ORC-SEED-003", "PAID", 1500, 1500, 30);
  await ensureReceivable("REC-SEED-OVERDUE", "ORC-SEED-005", "OVERDUE", 500, 0, -30);
  await ensureReceivable("REC-SEED-FACES", "ORC-SEED-FACES", "OPEN", 750, 0, 30);

  async function ensureAnamnesis(patientIndex: number, data: {
    allergies?: string;
    medications?: string;
    diseases?: string;
    surgeries?: string;
    medicalHistory?: string;
    dentalHistory?: string;
    observations?: string;
    smoking?: string;
    alcoholUse?: string;
    oralHygiene?: string;
    parafunctionalHabits?: string;
  }) {
    const patientId = patients[patientIndex]!.id;
    const existing = await prisma.patientAnamnesis.findFirst({
      where: { companyId: demoCompanyId, patientId },
    });
    if (existing) return existing;
    return prisma.patientAnamnesis.create({
      data: {
        companyId: demoCompanyId,
        patientId,
        ...data,
        createdById: admin.id,
        updatedById: admin.id,
      },
    });
  }

  async function ensureEvolution(
    code: string,
    patientIndex: number,
    input: {
      title: string;
      description: string;
      notes?: string;
      teeth?: SeedToothRef[];
      procedureCode?: string;
      appointmentIndex?: number;
      planCode?: string;
      planItemTitle?: string;
      planItemTooth?: number;
      occurredOffsetDays?: number;
    },
  ) {
    const procedureId = input.procedureCode
      ? procedures.find((item) => item.code === input.procedureCode)?.id ?? null
      : null;
    const existing = await prisma.clinicalEvolution.findFirst({
      where: { companyId: demoCompanyId, title: input.title, patientId: patients[patientIndex]!.id, deletedAt: null },
      include: { teeth: true },
    });
    if (existing) {
      if (procedureId && !existing.procedureId) {
        await prisma.clinicalEvolution.update({ where: { id: existing.id }, data: { procedureId } });
      }
      return existing;
    }

    let appointmentId: string | undefined;
    if (input.appointmentIndex != null) {
      const appts = await prisma.appointment.findMany({
        where: { companyId: demoCompanyId, patientId: patients[patientIndex]!.id, deletedAt: null },
        orderBy: { startsAt: "asc" },
      });
      appointmentId = appts[input.appointmentIndex]?.id;
    }

    let treatmentPlanItemId: string | undefined;
    if (input.planCode && input.planItemTitle) {
      const item = await prisma.treatmentPlanItem.findFirst({
        where: {
          companyId: demoCompanyId,
          deletedAt: null,
          title: { contains: input.planItemTitle.split(" ")[0] },
          plan: { code: input.planCode, companyId: demoCompanyId },
          ...(input.planItemTooth
            ? { teeth: { some: { toothNumber: input.planItemTooth } } }
            : {}),
        },
      });
      treatmentPlanItemId = item?.id;
    }

    const occurredAt = atDay(fixtureNow, input.occurredOffsetDays ?? -7, 10, 0);
    const evolution = await prisma.clinicalEvolution.create({
      data: {
        companyId: demoCompanyId,
        patientId: patients[patientIndex]!.id,
        professionalId: professionals[0]!.id,
        appointmentId: appointmentId ?? null,
        treatmentPlanItemId: treatmentPlanItemId ?? null,
        procedureId,
        title: input.title,
        description: input.description,
        notes: input.notes ?? null,
        occurredAt,
        createdById: admin.id,
        updatedById: admin.id,
        teeth: {
          create: seedToothCreates(input.teeth ?? []),
        },
        events: {
          create: {
            companyId: demoCompanyId,
            actorId: admin.id,
            type: "CREATED",
            after: { title: input.title, code },
          },
        },
      },
    });
    return evolution;
  }

  await ensureAnamnesis(0, {
    allergies: "Dipirona",
    medications: "Losartana 50mg",
    diseases: "Hipertensão controlada",
    medicalHistory: "Sem internações recentes",
    dentalHistory: "Restaurações anteriores em molares",
    smoking: "Não",
    alcoholUse: "Social ocasional",
    oralHygiene: "Escovação 2x/dia, fio dental irregular",
    parafunctionalHabits: "Bruxismo noturno leve",
    observations: "Paciente relata sensibilidade ao frio.",
  });

  await ensureAnamnesis(2, {
    allergies: "Nenhuma conhecida",
    medications: "Anticoncepcional oral",
    diseases: "Asma leve",
    dentalHistory: "Ortodontia na adolescência",
    oralHygiene: "Boa",
    observations: "Gestante — segundo trimestre (informação demo).",
  });

  await ensureEvolution("EVO-SEED-001", 0, {
    title: "Avaliação inicial",
    description: "Paciente avaliado clinicamente. Plano de reabilitação oral discutido.",
    procedureCode: "AVALIACAO",
    occurredOffsetDays: -14,
  });

  await ensureEvolution("EVO-SEED-002", 0, {
    title: "Restauração — dente 16",
    description: "Removida cárie e realizada restauração em resina composta. Paciente sem intercorrências.",
    teeth: [16],
    procedureCode: "RESTORACAO",
    planCode: "PLN-SEED-PROGRESS",
    planItemTitle: "Restauração",
    occurredOffsetDays: -5,
  });

  const completedAppt = await prisma.appointment.findFirst({
    where: {
      companyId: demoCompanyId,
      patientId: patients[0]!.id,
      status: "COMPLETED",
      deletedAt: null,
    },
    orderBy: { startsAt: "desc" },
  });
  if (completedAppt) {
    await ensureEvolution("EVO-SEED-003", 0, {
      title: "Consulta — evolução vinculada",
      description: "Evolução registrada após consulta concluída.",
      appointmentIndex: 0,
      occurredOffsetDays: -3,
    });
    const linked = await prisma.clinicalEvolution.findFirst({
      where: {
        companyId: demoCompanyId,
        patientId: patients[0]!.id,
        title: "Consulta — evolução vinculada",
        deletedAt: null,
      },
    });
    if (linked && !linked.appointmentId) {
      await prisma.clinicalEvolution.update({
        where: { id: linked.id },
        data: { appointmentId: completedAppt.id },
      });
    }
  }

  await ensureEvolution("EVO-SEED-004", 2, {
    title: "Profilaxia realizada",
    description: "Profilaxia concluída. Orientações de higiene reforçadas.",
    teeth: [],
    procedureCode: "PROFILAXIA",
    planCode: "PLN-SEED-PARTIAL",
    planItemTitle: "Profilaxia",
    occurredOffsetDays: -10,
  });

  await ensureEvolution("EVO-SEED-FACES", 0, {
    title: "Restauração — dente 36",
    description:
      "Removida a lesão cariosa e realizada restauração em resina composta. Paciente sem intercorrências.",
    teeth: [{ toothNumber: 36, surfaces: ["OCCLUSAL", "MESIAL"] }],
    procedureCode: "RESTORACAO",
    planCode: "PLN-SEED-FACES",
    planItemTitle: "Restauração",
    planItemTooth: 36,
    occurredOffsetDays: -2,
  });

  const attachmentExists = await prisma.clinicalAttachment.findFirst({
    where: { companyId: demoCompanyId, title: "Radiografia periapical — dente 36", deletedAt: null },
  });
  if (!attachmentExists) {
    await prisma.clinicalAttachment.create({
      data: {
        companyId: demoCompanyId,
        patientId: patients[0]!.id,
        professionalId: professionals[0]!.id,
        type: "EXAM",
        title: "Radiografia periapical — dente 36",
        description: "Exame solicitado para avaliação endodôntica.",
        occurredAt: atDay(fixtureNow, -6, 9, 0),
        createdById: admin.id,
      },
    });
  }

  console.log("Seed OK — Agenda, Pacientes, Odontograma, Planos, Orçamentos, Prontuário e Financeiro demo prontos");
  console.log("  admin@odonto.demo / Demo@123456");
  console.log("  gerente@odonto.demo / Demo@123456");
  console.log("  colaborador@odonto.demo / Demo@123456");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
