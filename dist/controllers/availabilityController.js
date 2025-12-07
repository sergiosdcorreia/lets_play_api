"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserAvailability = getUserAvailability;
exports.createAvailability = createAvailability;
exports.updateAvailability = updateAvailability;
exports.deleteAvailability = deleteAvailability;
exports.getCommonAvailability = getCommonAvailability;
const prisma_1 = require("../utils/prisma");
const validation_1 = require("../utils/validation");
// Get current user's availability
async function getUserAvailability(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const availability = await prisma_1.prisma.availability.findMany({
            where: { userId: req.user.id },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        });
        res.json({ availability });
    }
    catch (error) {
        console.error("Get availability error:", error);
        res.status(500).json({ error: "Failed to get availability" });
    }
}
// Create availability slot
async function createAvailability(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        // Validate input
        const validatedData = validation_1.availabilitySchema.parse(req.body);
        // Validate endTime is after startTime
        if (validatedData.endTime <= validatedData.startTime) {
            return res.status(400).json({
                error: "End time must be after start time",
            });
        }
        // Check if time slot already exists for this user
        const existing = await prisma_1.prisma.availability.findUnique({
            where: {
                userId_dayOfWeek_startTime: {
                    userId: req.user.id,
                    dayOfWeek: validatedData.dayOfWeek,
                    startTime: validatedData.startTime,
                },
            },
        });
        if (existing) {
            return res.status(400).json({
                error: "Availability slot already exists for this time",
            });
        }
        // Create availability
        const availability = await prisma_1.prisma.availability.create({
            data: {
                userId: req.user.id,
                ...validatedData,
            },
        });
        res.status(201).json({
            message: "Availability created successfully",
            availability,
        });
    }
    catch (error) {
        if (error instanceof Error && "issues" in error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error,
            });
        }
        console.error("Create availability error:", error);
        res.status(500).json({ error: "Failed to create availability" });
    }
}
// Update availability slot
async function updateAvailability(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params;
        const { isAvailable } = req.body;
        // Check if availability belongs to user
        const existing = await prisma_1.prisma.availability.findUnique({
            where: { id },
        });
        if (!existing) {
            return res.status(404).json({ error: "Availability not found" });
        }
        if (existing.userId !== req.user.id) {
            return res.status(403).json({
                error: "Not authorized to update this availability",
            });
        }
        // Update availability
        const updated = await prisma_1.prisma.availability.update({
            where: { id },
            data: { isAvailable: isAvailable ?? existing.isAvailable },
        });
        res.json({
            message: "Availability updated successfully",
            availability: updated,
        });
    }
    catch (error) {
        console.error("Update availability error:", error);
        res.status(500).json({ error: "Failed to update availability" });
    }
}
// Delete availability slot
async function deleteAvailability(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params;
        // Check if availability belongs to user
        const existing = await prisma_1.prisma.availability.findUnique({
            where: { id },
        });
        if (!existing) {
            return res.status(404).json({ error: "Availability not found" });
        }
        if (existing.userId !== req.user.id) {
            return res.status(403).json({
                error: "Not authorized to delete this availability",
            });
        }
        // Delete availability
        await prisma_1.prisma.availability.delete({
            where: { id },
        });
        res.json({ message: "Availability deleted successfully" });
    }
    catch (error) {
        console.error("Delete availability error:", error);
        res.status(500).json({ error: "Failed to delete availability" });
    }
}
// Get common availability across all users
async function getCommonAvailability(req, res) {
    try {
        // Get all users' availability
        const allAvailability = await prisma_1.prisma.availability.findMany({
            where: { isAvailable: true },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        position: true,
                        skillLevel: true,
                    },
                },
            },
        });
        // Group by day and time slot
        const grouped = {};
        allAvailability.forEach((avail) => {
            const key = `${avail.dayOfWeek}-${avail.startTime}-${avail.endTime}`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(avail);
        });
        // Find slots with minimum number of players (e.g., 6+ players)
        const MIN_PLAYERS = parseInt(req.query.minPlayers) || 6;
        const commonSlots = Object.entries(grouped)
            .filter(([_, availabilities]) => availabilities.length >= MIN_PLAYERS)
            .map(([key, availabilities]) => {
            const [dayOfWeek, startTime, endTime] = key.split("-");
            // Convert day number to name
            const dayNames = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
            ];
            return {
                dayOfWeek: parseInt(dayOfWeek),
                dayName: dayNames[parseInt(dayOfWeek)],
                startTime,
                endTime,
                availablePlayerCount: availabilities.length,
                availablePlayers: availabilities.map((a) => ({
                    id: a.user.id,
                    name: a.user.name,
                    position: a.user.position,
                    skillLevel: a.user.skillLevel,
                })),
            };
        })
            .sort((a, b) => b.availablePlayerCount - a.availablePlayerCount);
        res.json({
            minPlayers: MIN_PLAYERS,
            commonSlots,
            message: commonSlots.length === 0
                ? `No time slots found with ${MIN_PLAYERS}+ players available`
                : `Found ${commonSlots.length} time slot(s) with ${MIN_PLAYERS}+ players`,
        });
    }
    catch (error) {
        console.error("Get common availability error:", error);
        res.status(500).json({ error: "Failed to get common availability" });
    }
}
