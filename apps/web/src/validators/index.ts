import { z } from "zod";

export const salonSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  address: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().default("UTC"),
});

export const serviceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  duration: z.number().int().positive("Duration must be a positive integer (minutes)"),
  categoryId: z.string().optional(),
});

export const staffSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
});

export const customerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(10, "Valid phone number required"),
  notes: z.string().optional(),
});

export const appointmentSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  startTime: z.string().datetime(), // ISO datetime string
  endTime: z.string().datetime(),
  notes: z.string().optional(),
});

// Used when booking from the public page
export const publicBookingSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  startTime: z.string().datetime(),
  customer: z.object({
    firstName: z.string().min(2),
    lastName: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(10),
  })
});
