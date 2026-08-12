import { z } from "zod";

export const agendaViewSchema = z.enum(["day", "week", "month", "timeline", "list"]);

export const appointmentStatusSchema = z.enum([
  "SCHEDULED",
  "CONFIRMED",
  "WAITING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELED",
  "NO_SHOW",
]);

export const agendaRangeQuerySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  professionalIds: z.array(z.string()).optional(),
  roomIds: z.array(z.string()).optional(),
  chairIds: z.array(z.string()).optional(),
  status: z.array(appointmentStatusSchema).optional(),
  search: z.string().trim().optional(),
  includeCanceled: z.boolean().optional().default(false),
});

export const createAppointmentSchema = z
  .object({
    patientId: z.string().min(1).optional(),
    patientName: z.string().trim().min(2).optional(),
    patientPhone: z.string().trim().optional(),
    professionalId: z.string().min(1, "Selecione o profissional"),
    roomId: z.string().optional(),
    chairId: z.string().optional(),
    procedure: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    startsAt: z.string().min(1, "Informe o início"),
    endsAt: z.string().min(1, "Informe o fim"),
    status: appointmentStatusSchema.optional().default("SCHEDULED"),
    recurrenceRule: z.string().trim().optional(),
    recurrenceCount: z.number().int().min(1).max(52).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.patientId && !data.patientName) {
      ctx.addIssue({
        code: "custom",
        message: "Informe o paciente",
        path: ["patientName"],
      });
    }
    const start = new Date(data.startsAt);
    const end = new Date(data.endsAt);
    if (!(start < end)) {
      ctx.addIssue({
        code: "custom",
        message: "Horário final deve ser após o início",
        path: ["endsAt"],
      });
    }
  });

export const updateAppointmentSchema = z.object({
  id: z.string().min(1),
  professionalId: z.string().min(1).optional(),
  roomId: z.string().nullable().optional(),
  chairId: z.string().nullable().optional(),
  procedure: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  status: appointmentStatusSchema.optional(),
  cancelReason: z.string().trim().optional(),
});

export const rescheduleAppointmentSchema = z.object({
  id: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  professionalId: z.string().optional(),
});

export const createScheduleBlockSchema = z.object({
  type: z.enum(["LUNCH", "UNAVAILABLE", "BLOCK", "HOLIDAY"]),
  title: z.string().trim().optional(),
  professionalId: z.string().optional(),
  roomId: z.string().optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  allDay: z.boolean().optional().default(false),
});

export const createWaitingListSchema = z.object({
  patientId: z.string().min(1).optional(),
  patientName: z.string().trim().min(2).optional(),
  professionalId: z.string().optional(),
  preferredDate: z.string().optional(),
  notes: z.string().trim().optional(),
  priority: z.number().int().min(0).max(10).optional().default(0),
});

export const createReturnAlertSchema = z.object({
  patientId: z.string().min(1),
  dueDate: z.string().min(1),
  reason: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const quickPatientSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
});
