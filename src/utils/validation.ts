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

export const matchUpdateSchema = z.object({
  date: z
    .string()
    .datetime("Invalid date format. Use ISO 8601 format")
    .optional(),
  duration: z.number().min(30).max(180).optional(),
  venueId: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
});

// RSVP validation
export const rsvpSchema = z.object({
  status: z
    .string()
    .refine((val) => val === "confirmed" || val === "declined", {
      message: 'Status must be either "confirmed" or "declined"',
    }),
});

// Match Event validation
export const matchEventSchema = z.object({
  playerId: z.string().min(1, "Player ID is required"),
  eventType: z
    .string()
    .refine(
      (val) => ["goal", "assist", "yellow_card", "red_card"].includes(val),
      { message: "Event type must be goal, assist, yellow_card, or red_card" }
    ),
  minute: z.number().min(0).max(180).optional(),
  notes: z.string().optional(),
});

// Team validation
export const teamSchema = z.object({
  name: z
    .string()
    .min(3, "Team name must be at least 3 characters")
    .max(50, "Team name too long"),
  logo: z.string().url("Invalid logo URL").optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
    .optional(),
  description: z.string().max(500, "Description too long").optional(),
  subManagerId: z.string().optional(),
});

// Team update validation
export const teamUpdateSchema = z.object({
  name: z.string().min(3).max(50).optional(),
  logo: z.string().url().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  description: z.string().max(500).optional(),
  subManagerId: z.string().nullable().optional(),
});

// Team member invitation
export const inviteTeamMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["player", "sub_manager"]).default("player"),
});

// Team member RSVP
export const teamMemberRsvpSchema = z.object({
  status: z.enum(["active", "declined"]),
});

// Tournament validation
export const tournamentSchema = z.object({
  name: z
    .string()
    .min(3, "Tournament name must be at least 3 characters")
    .max(100),
  description: z.string().max(1000).optional(),
  format: z.enum(["league", "knockout", "custom"]).default("league"),
  startDate: z.string().datetime("Invalid date format. Use ISO 8601"),
  autoGenerateMatches: z.boolean().default(false),
});

// Tournament update validation
export const tournamentUpdateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  format: z.enum(["league", "knockout", "custom"]).optional(),
  startDate: z.string().datetime().optional(),
  status: z
    .enum(["upcoming", "in_progress", "completed", "cancelled"])
    .optional(),
});

// Invite team to tournament
export const inviteTournamentTeamSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
});

// Tournament team RSVP
export const tournamentTeamRsvpSchema = z.object({
  status: z.enum(["confirmed", "declined"]),
});

export type TournamentInput = z.infer<typeof tournamentSchema>;
export type TournamentUpdateInput = z.infer<typeof tournamentUpdateSchema>;
export type InviteTournamentTeamInput = z.infer<
  typeof inviteTournamentTeamSchema
>;
export type TournamentTeamRsvpInput = z.infer<typeof tournamentTeamRsvpSchema>;
export type TeamInput = z.infer<typeof teamSchema>;
export type TeamUpdateInput = z.infer<typeof teamUpdateSchema>;
export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
export type TeamMemberRsvpInput = z.infer<typeof teamMemberRsvpSchema>;
export type MatchEventInput = z.infer<typeof matchEventSchema>;
export type MatchUpdateInput = z.infer<typeof matchUpdateSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type VenueInput = z.infer<typeof venueSchema>;
export type MatchInput = z.infer<typeof matchSchema>;
export type RsvpInput = z.infer<typeof rsvpSchema>;
