"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tournamentTeamRsvpSchema = exports.inviteTournamentTeamSchema = exports.tournamentUpdateSchema = exports.tournamentSchema = exports.teamMemberRsvpSchema = exports.inviteTeamMemberSchema = exports.teamUpdateSchema = exports.teamSchema = exports.matchEventSchema = exports.rsvpSchema = exports.matchUpdateSchema = exports.matchSchema = exports.venueSchema = exports.availabilitySchema = exports.changePasswordSchema = exports.userUpdateSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.userUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters").optional(),
    position: zod_1.z.string().optional(),
    skillLevel: zod_1.z.number().min(1).max(10).optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: zod_1.z.string().min(6, "New password must be at least 6 characters"),
});
exports.availabilitySchema = zod_1.z.object({
    dayOfWeek: zod_1.z
        .number()
        .min(0)
        .max(6, "Day of week must be between 0 (Sunday) and 6 (Saturday)"),
    startTime: zod_1.z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM (e.g., 18:00)"),
    endTime: zod_1.z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:MM (e.g., 20:00)"),
    isAvailable: zod_1.z.boolean().optional().default(true),
});
// Venue validation
exports.venueSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "Venue name must be at least 3 characters"),
    address: zod_1.z.string().min(5, "Address must be at least 5 characters"),
    city: zod_1.z.string().min(2, "City must be at least 2 characters"),
    surface: zod_1.z.string().min(2, "Surface type is required"),
    capacity: zod_1.z
        .number()
        .min(4, "Capacity must be at least 4 players")
        .max(50, "Capacity cannot exceed 50 players"),
    pricePerHour: zod_1.z.number().min(0).optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
});
// Match validation
exports.matchSchema = zod_1.z.object({
    date: zod_1.z.string().datetime("Invalid date format. Use ISO 8601 format"),
    duration: zod_1.z
        .number()
        .min(30, "Duration must be at least 30 minutes")
        .max(180, "Duration cannot exceed 180 minutes")
        .default(90),
    venueId: zod_1.z.string().min(1, "Venue ID is required"),
    notes: zod_1.z.string().optional(),
    tournamentId: zod_1.z.string().optional(),
    homeTeamId: zod_1.z.string().optional(),
    awayTeamId: zod_1.z.string().optional(),
});
exports.matchUpdateSchema = zod_1.z.object({
    date: zod_1.z
        .string()
        .datetime("Invalid date format. Use ISO 8601 format")
        .optional(),
    duration: zod_1.z.number().min(30).max(180).optional(),
    venueId: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    status: zod_1.z.enum(["scheduled", "completed", "cancelled"]).optional(),
});
// RSVP validation
exports.rsvpSchema = zod_1.z.object({
    status: zod_1.z
        .string()
        .refine((val) => val === "confirmed" || val === "declined", {
        message: 'Status must be either "confirmed" or "declined"',
    }),
});
// Match Event validation
exports.matchEventSchema = zod_1.z.object({
    playerId: zod_1.z.string().min(1, "Player ID is required"),
    eventType: zod_1.z
        .string()
        .refine((val) => ["goal", "assist", "yellow_card", "red_card"].includes(val), { message: "Event type must be goal, assist, yellow_card, or red_card" }),
    minute: zod_1.z.number().min(0).max(180).optional(),
    notes: zod_1.z.string().optional(),
});
// Team validation
exports.teamSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(3, "Team name must be at least 3 characters")
        .max(50, "Team name too long"),
    logo: zod_1.z.string().url("Invalid logo URL").optional(),
    primaryColor: zod_1.z
        .string()
        .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
        .optional(),
    secondaryColor: zod_1.z
        .string()
        .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
        .optional(),
    description: zod_1.z.string().max(500, "Description too long").optional(),
    subManagerId: zod_1.z.string().optional(),
});
// Team update validation
exports.teamUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(3).max(50).optional(),
    logo: zod_1.z.string().url().optional(),
    primaryColor: zod_1.z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional(),
    secondaryColor: zod_1.z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional(),
    description: zod_1.z.string().max(500).optional(),
    subManagerId: zod_1.z.string().nullable().optional(),
});
// Team member invitation
exports.inviteTeamMemberSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, "User ID is required"),
    role: zod_1.z.enum(["player", "sub_manager"]).default("player"),
});
// Team member RSVP
exports.teamMemberRsvpSchema = zod_1.z.object({
    status: zod_1.z.enum(["active", "declined"]),
});
// Tournament validation
exports.tournamentSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .min(3, "Tournament name must be at least 3 characters")
        .max(100),
    description: zod_1.z.string().max(1000).optional(),
    format: zod_1.z.enum(["league", "knockout", "custom"]).default("league"),
    startDate: zod_1.z.string().datetime("Invalid date format. Use ISO 8601"),
    autoGenerateMatches: zod_1.z.boolean().default(false),
});
// Tournament update validation
exports.tournamentUpdateSchema = zod_1.z.object({
    name: zod_1.z.string().min(3).max(100).optional(),
    description: zod_1.z.string().max(1000).optional(),
    format: zod_1.z.enum(["league", "knockout", "custom"]).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    status: zod_1.z
        .enum(["upcoming", "in_progress", "completed", "cancelled"])
        .optional(),
});
// Invite team to tournament
exports.inviteTournamentTeamSchema = zod_1.z.object({
    teamId: zod_1.z.string().min(1, "Team ID is required"),
});
// Tournament team RSVP
exports.tournamentTeamRsvpSchema = zod_1.z.object({
    status: zod_1.z.enum(["confirmed", "declined"]),
});
