import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const availabilitySchema = z.object({
  dayOfWeek: z
    .number()
    .min(0)
    .max(6, "Day of week must be between 0 (Sunday) and 6 (Saturday)"),
  startTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Invalid time format. Use HH:MM (e.g., 18:00)"
    ),
  endTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Invalid time format. Use HH:MM (e.g., 20:00)"
    ),
  isAvailable: z.boolean().optional().default(true),
});

// Venue validation
export const venueSchema = z.object({
  name: z.string().min(3, "Venue name must be at least 3 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  surface: z.string().min(2, "Surface type is required"),
  capacity: z
    .number()
    .min(4, "Capacity must be at least 4 players")
    .max(50, "Capacity cannot exceed 50 players"),
  pricePerHour: z.number().min(0).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// Match validation
export const matchSchema = z.object({
  date: z.string().datetime("Invalid date format. Use ISO 8601 format"),
  duration: z
    .number()
    .min(30, "Duration must be at least 30 minutes")
    .max(180, "Duration cannot exceed 180 minutes")
    .default(90),
  venueId: z.string().min(1, "Venue ID is required"),
  notes: z.string().optional(),
});

// RSVP validation
export const rsvpSchema = z.object({
  status: z
    .string()
    .refine((val) => val === "confirmed" || val === "declined", {
      message: 'Status must be either "confirmed" or "declined"',
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type VenueInput = z.infer<typeof venueSchema>;
export type MatchInput = z.infer<typeof matchSchema>;
export type RsvpInput = z.infer<typeof rsvpSchema>;
