import { z } from "zod";

const trimmedText = (minimum, maximum) =>
  z.string().trim().min(minimum).max(maximum);
const phone = trimmedText(8, 20).refine(
  (value) => /^[1-9]{2}(?:[2-8]|9[1-9])[0-9]{7,8}$/.test(value.replace(/\D/g, "")),
  "Invalid phone. Include the area code."
);

export const objectIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid resource ID.")
});

export const loginBodySchema = z.object({
  password: z.string().min(1, "Password is required.")
});

export const clientBodySchema = z.object({
  name: trimmedText(2, 80),
  phone,
  email: z.string().trim().email().max(254).optional()
}).strict();

export const clientUpdateSchema = clientBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided."
);

export const barberBodySchema = z.object({
  name: trimmedText(2, 80),
  phone: phone.optional(),
  specialties: z.array(trimmedText(1, 80)).max(20).optional(),
  active: z.boolean().optional()
}).strict();

export const barberUpdateSchema = barberBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided."
);

export const serviceBodySchema = z.object({
  name: trimmedText(2, 100),
  price: z.number().min(0),
  duration: trimmedText(1, 30),
  active: z.boolean().optional()
}).strict();

export const serviceUpdateSchema = serviceBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field must be provided."
);

const appointmentFields = {
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  serviceName: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  barber: z.string().regex(/^[a-f\d]{24}$/i, "Invalid barber.").nullable().optional(),
  status: z.enum(["pending", "present", "absent", "cancelled"]).optional(),
  idempotencyKey: z.string().optional()
};

export const appointmentCreateSchema = z.object({
  ...appointmentFields,
  customerName: z.string(),
  customerPhone: z.string(),
  serviceName: z.string(),
  date: z.string(),
  time: z.string()
}).passthrough();

export const appointmentUpdateSchema = z.object(appointmentFields)
  .passthrough()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const appointmentListQuerySchema = z.object({
  date: z.string().optional(),
  status: z.enum(["pending", "present", "absent", "cancelled", "completed"]).optional(),
  barber: z.string().regex(/^[a-f\d]{24}$/i, "Invalid barber.").optional()
});

export const availabilityQuerySchema = z.object({
  date: z.string().min(1, "Date is required to list available time slots."),
  barber: z.string().regex(/^[a-f\d]{24}$/i, "Invalid barber.").optional()
});

export const publicScheduleQuerySchema = z.object({
  date: z.string().optional()
});

export const legacyDeleteQuerySchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid appointment ID.")
});
