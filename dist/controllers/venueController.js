"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllVenues = getAllVenues;
exports.getVenue = getVenue;
exports.createVenue = createVenue;
exports.updateVenue = updateVenue;
exports.deleteVenue = deleteVenue;
exports.getVenueWeather = getVenueWeather;
const prisma_1 = require("../utils/prisma");
const validation_1 = require("../utils/validation");
const weather_1 = require("../utils/weather");
// Get all venues
async function getAllVenues(req, res) {
    try {
        const venues = await prisma_1.prisma.venue.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { matches: true },
                },
            },
        });
        res.json({ venues });
    }
    catch (error) {
        console.error("Get venues error:", error);
        res.status(500).json({ error: "Failed to get venues" });
    }
}
// Get single venue
async function getVenue(req, res) {
    try {
        const { id } = req.params;
        const venue = await prisma_1.prisma.venue.findUnique({
            where: { id },
            include: {
                matches: {
                    where: {
                        date: { gte: new Date() }, // Only future matches
                        status: "scheduled",
                    },
                    orderBy: { date: "asc" },
                    take: 5,
                    select: {
                        id: true,
                        date: true,
                        duration: true,
                        status: true,
                        _count: {
                            select: { players: true },
                        },
                    },
                },
            },
        });
        if (!venue) {
            return res.status(404).json({ error: "Venue not found" });
        }
        res.json({ venue });
    }
    catch (error) {
        console.error("Get venue error:", error);
        res.status(500).json({ error: "Failed to get venue" });
    }
}
// Create venue (admin only - for now, any authenticated user)
async function createVenue(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        // Validate input
        const validatedData = validation_1.venueSchema.parse(req.body);
        // Create venue
        const venue = await prisma_1.prisma.venue.create({
            data: validatedData,
        });
        res.status(201).json({
            message: "Venue created successfully",
            venue,
        });
    }
    catch (error) {
        if (error instanceof Error && "issues" in error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error,
            });
        }
        console.error("Create venue error:", error);
        res.status(500).json({ error: "Failed to create venue" });
    }
}
// Update venue
async function updateVenue(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params;
        // Check venue exists
        const existing = await prisma_1.prisma.venue.findUnique({
            where: { id },
        });
        if (!existing) {
            return res.status(404).json({ error: "Venue not found" });
        }
        // Validate input
        const validatedData = validation_1.venueSchema.partial().parse(req.body);
        // Update venue
        const venue = await prisma_1.prisma.venue.update({
            where: { id },
            data: validatedData,
        });
        res.json({
            message: "Venue updated successfully",
            venue,
        });
    }
    catch (error) {
        if (error instanceof Error && "issues" in error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error,
            });
        }
        console.error("Update venue error:", error);
        res.status(500).json({ error: "Failed to update venue" });
    }
}
// Delete venue
async function deleteVenue(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params;
        // Check if venue has future matches
        const futureMatches = await prisma_1.prisma.match.count({
            where: {
                venueId: id,
                date: { gte: new Date() },
                status: "scheduled",
            },
        });
        if (futureMatches > 0) {
            return res.status(400).json({
                error: `Cannot delete venue with ${futureMatches} scheduled match(es)`,
            });
        }
        // Delete venue
        await prisma_1.prisma.venue.delete({
            where: { id },
        });
        res.json({ message: "Venue deleted successfully" });
    }
    catch (error) {
        console.error("Delete venue error:", error);
        res.status(500).json({ error: "Failed to delete venue" });
    }
}
async function getVenueWeather(req, res) {
    try {
        const { id } = req.params;
        const { date } = req.query;
        if (!date) {
            return res
                .status(400)
                .json({ error: "Date query parameter is required (ISO format)" });
        }
        const venue = await prisma_1.prisma.venue.findUnique({
            where: { id },
        });
        if (!venue) {
            return res.status(404).json({ error: "Venue not found" });
        }
        if (!venue.latitude || !venue.longitude) {
            return res.status(400).json({
                error: "Venue does not have coordinates configured",
            });
        }
        const matchDate = new Date(date);
        if (isNaN(matchDate.getTime())) {
            return res
                .status(400)
                .json({ error: "Invalid date format. Use ISO 8601" });
        }
        const weatherResult = await (0, weather_1.getWeatherForecast)(venue.latitude, venue.longitude, matchDate);
        if (!weatherResult.success) {
            return res.status(400).json({
                error: weatherResult.error,
            });
        }
        const weatherWithAdvice = {
            ...weatherResult.weather,
            advice: (0, weather_1.getWeatherAdvice)(weatherResult.weather),
        };
        res.json({
            venue: {
                id: venue.id,
                name: venue.name,
                city: venue.city,
            },
            date: matchDate,
            weather: weatherWithAdvice,
        });
    }
    catch (error) {
        console.error("Get venue weather error:", error);
        res.status(500).json({ error: "Failed to get weather forecast" });
    }
}
