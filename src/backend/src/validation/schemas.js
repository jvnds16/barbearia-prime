import { z } from "zod";

const trimmedText = (minimum, maximum) =>
  z.string().trim().min(minimum).max(maximum);

export const objectIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid resource ID.")
});

export const loginBodySchema = z.object({
  password: z.string().min(1, "Password is required.")
});

export const serviceBodySchema = z.object({
  name: trimmedText(2, 100),
  price: z.number().min(0),
  duration: z.number().int().min(1),
  active: z.boolean().optional()
}).strict();

export const serviceUpdateSchema = serviceBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided."
);

const APPOINTMENT_STATUSES = ["pending", "present", "absent", "cancelled"];

const trimmedField = (minimum, maximum) =>
  z.string().trim().min(minimum).max(maximum);

// Soft business checks (lead time, slot conflict) still happen in the controller; this
// schema enforces the wire shape and the cheap string/format rules.
export const appointmentCreateSchema = z.object({
  customerName: trimmedField(3, 80),
  customerPhone: trimmedField(1, 20),
  serviceName: trimmedField(1, 100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use the YYYY-MM-DD format."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time must use the HH:MM format."),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  idempotencyKey: z
    .string()
    .regex(/^[A-Za-z0-9_-]{8,100}$/, "Invalid idempotency key.")
    .optional(),
  // Headers carry the idempotency key in real requests; the schema keeps that flag optional.
});

export const appointmentUpdateSchema = z
  .object({
    customerName: trimmedField(3, 80).optional(),
    customerPhone: trimmedField(1, 20).optional(),
    serviceName: trimmedField(1, 100).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use the YYYY-MM-DD format.")
      .optional(),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Time must use the HH:MM format.")
      .optional(),
    status: z.enum(APPOINTMENT_STATUSES).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const appointmentListQuerySchema = z.object({
  date: z.string().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional()
});

export const publicAppointmentQuerySchema = z.object({
  date: z.string().optional()
});
