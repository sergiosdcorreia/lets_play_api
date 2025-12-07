"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordMatchEvent = recordMatchEvent;
exports.getMatchEvents = getMatchEvents;
exports.deleteMatchEvent = deleteMatchEvent;
exports.getPlayerStatistics = getPlayerStatistics;
exports.getLeaderboard = getLeaderboard;
exports.getMatchStatistics = getMatchStatistics;
const prisma_1 = require("../utils/prisma");
const validation_1 = require("../utils/validation");
// Record match event (goal, assist, card)
async function recordMatchEvent(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params; // match ID
        // Validate input
        const validatedData = validation_1.matchEventSchema.parse(req.body);
        // Check match exists
        const match = await prisma_1.prisma.match.findUnique({
            where: { id },
            include: {
                players: true,
            },
        });
        if (!match) {
            return res.status(404).json({ error: "Match not found" });
        }
        // Only match creator can record events
        if (match.createdById !== req.user.id) {
            return res.status(403).json({
                error: "Only the match creator can record events",
            });
        }
        // Check player is in the match
        const playerInMatch = match.players.some((p) => p.userId === validatedData.playerId);
        if (!playerInMatch) {
            return res.status(400).json({
                error: "Player is not part of this match",
            });
        }
        // Create match event
        const event = await prisma_1.prisma.matchEvent.create({
            data: {
                matchId: id,
                ...validatedData,
            },
            include: {
                player: {
                    select: {
                        id: true,
                        name: true,
                        position: true,
                    },
                },
            },
        });
        res.status(201).json({
            message: "Match event recorded successfully",
            event,
        });
    }
    catch (error) {
        if (error instanceof Error && "issues" in error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error,
            });
        }
        // Add detailed logging
        console.error("Record match event error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        res.status(500).json({
            error: "Failed to record match event",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
// Get match events
async function getMatchEvents(req, res) {
    try {
        const { id } = req.params; // match ID
        const events = await prisma_1.prisma.matchEvent.findMany({
            where: { matchId: id },
            orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
            include: {
                player: {
                    select: {
                        id: true,
                        name: true,
                        position: true,
                    },
                },
            },
        });
        // Group events by type for summary
        const summary = {
            goals: events.filter((e) => e.eventType === "goal").length,
            assists: events.filter((e) => e.eventType === "assist").length,
            yellowCards: events.filter((e) => e.eventType === "yellow_card")
                .length,
            redCards: events.filter((e) => e.eventType === "red_card").length,
        };
        res.json({
            events,
            summary,
        });
    }
    catch (error) {
        console.error("Get match events error:", error);
        res.status(500).json({ error: "Failed to get match events" });
    }
}
// Delete match event
async function deleteMatchEvent(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { eventId } = req.params;
        // Get event with match info
        const event = await prisma_1.prisma.matchEvent.findUnique({
            where: { id: eventId },
            include: {
                match: true,
            },
        });
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        // Only match creator can delete events
        if (event.match.createdById !== req.user.id) {
            return res.status(403).json({
                error: "Only the match creator can delete events",
            });
        }
        await prisma_1.prisma.matchEvent.delete({
            where: { id: eventId },
        });
        res.json({ message: "Event deleted successfully" });
    }
    catch (error) {
        console.error("Delete match event error:", error);
        res.status(500).json({ error: "Failed to delete event" });
    }
}
// Get player statistics
async function getPlayerStatistics(req, res) {
    try {
        const { userId } = req.params;
        // Check user exists
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                position: true,
                skillLevel: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Get all match events for this player
        const events = await prisma_1.prisma.matchEvent.findMany({
            where: { playerId: userId },
            include: {
                match: {
                    select: {
                        id: true,
                        date: true,
                        status: true,
                        venue: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        // Get matches played
        const matchesPlayed = await prisma_1.prisma.matchPlayer.count({
            where: {
                userId,
                status: "confirmed",
                match: {
                    status: "completed",
                },
            },
        });
        // Calculate statistics
        const stats = {
            matchesPlayed,
            goals: events.filter((e) => e.eventType === "goal").length,
            assists: events.filter((e) => e.eventType === "assist").length,
            yellowCards: events.filter((e) => e.eventType === "yellow_card")
                .length,
            redCards: events.filter((e) => e.eventType === "red_card").length,
            goalsPerMatch: matchesPlayed > 0
                ? (events.filter((e) => e.eventType === "goal").length /
                    matchesPlayed).toFixed(2)
                : "0.00",
            assistsPerMatch: matchesPlayed > 0
                ? (events.filter((e) => e.eventType === "assist").length /
                    matchesPlayed).toFixed(2)
                : "0.00",
        };
        // Recent events
        const recentEvents = events
            .sort((a, b) => b.match.date.getTime() - a.match.date.getTime())
            .slice(0, 10);
        res.json({
            player: user,
            statistics: stats,
            recentEvents,
        });
    }
    catch (error) {
        console.error("Get player statistics error:", error);
        res.status(500).json({ error: "Failed to get player statistics" });
    }
}
// Get leaderboard
async function getLeaderboard(req, res) {
    try {
        const { type = "goal", limit = 10 } = req.query; // ← Change 'goals' to 'goal'
        // Validate type
        const validTypes = ["goal", "assist"]; // ← Change to singular
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                error: 'Invalid type. Must be "goal" or "assist"',
            });
        }
        // Get ALL events (no filter)
        const allEvents = await prisma_1.prisma.matchEvent.findMany({
            include: {
                player: {
                    select: {
                        id: true,
                        name: true,
                        position: true,
                        skillLevel: true,
                    },
                },
                match: {
                    select: {
                        status: true,
                    },
                },
            },
        });
        // Filter by type
        const events = allEvents.filter((e) => e.eventType === type);
        // Filter for completed matches only
        const completedEvents = events.filter((e) => e.match.status === "completed");
        // Group by player and count
        const playerCounts = {};
        completedEvents.forEach((event) => {
            if (!playerCounts[event.playerId]) {
                playerCounts[event.playerId] = {
                    player: event.player,
                    count: 0,
                };
            }
            playerCounts[event.playerId].count++;
        });
        // Convert to array and sort
        const leaderboard = Object.values(playerCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, parseInt(limit))
            .map((item, index) => ({
            rank: index + 1,
            player: item.player,
            [type]: item.count,
        }));
        res.json({
            type,
            leaderboard,
        });
    }
    catch (error) {
        console.error("Get leaderboard error:", error);
        res.status(500).json({ error: "Failed to get leaderboard" });
    }
}
// Get match statistics (summary with scores)
async function getMatchStatistics(req, res) {
    try {
        const { id } = req.params; // match ID
        const match = await prisma_1.prisma.match.findUnique({
            where: { id },
            include: {
                venue: {
                    select: {
                        name: true,
                        city: true,
                    },
                },
                players: {
                    where: { status: "confirmed" },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                position: true,
                            },
                        },
                    },
                },
                events: {
                    include: {
                        player: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
                },
            },
        });
        if (!match) {
            return res.status(404).json({ error: "Match not found" });
        }
        // Calculate team scores (if teams are assigned)
        const teamAPlayers = match.players.filter((p) => p.team === "A");
        const teamBPlayers = match.players.filter((p) => p.team === "B");
        const teamAGoals = match.events.filter((e) => e.eventType === "goal" &&
            teamAPlayers.some((p) => p.userId === e.playerId)).length;
        const teamBGoals = match.events.filter((e) => e.eventType === "goal" &&
            teamBPlayers.some((p) => p.userId === e.playerId)).length;
        // Top scorer(s) in this match
        const playerGoals = {};
        match.events
            .filter((e) => e.eventType === "goal")
            .forEach((e) => {
            if (!playerGoals[e.playerId]) {
                playerGoals[e.playerId] = {
                    player: e.player,
                    goals: 0,
                };
            }
            playerGoals[e.playerId].goals++;
        });
        const topScorers = Object.values(playerGoals)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 3);
        // Event summary
        const summary = {
            totalGoals: match.events.filter((e) => e.eventType === "goal")
                .length,
            totalAssists: match.events.filter((e) => e.eventType === "assist")
                .length,
            yellowCards: match.events.filter((e) => e.eventType === "yellow_card").length,
            redCards: match.events.filter((e) => e.eventType === "red_card")
                .length,
        };
        res.json({
            match: {
                id: match.id,
                date: match.date,
                status: match.status,
                venue: match.venue,
                playersCount: match.players.length,
            },
            score: teamAPlayers.length > 0 && teamBPlayers.length > 0
                ? {
                    teamA: teamAGoals,
                    teamB: teamBGoals,
                }
                : null,
            summary,
            topScorers,
            timeline: match.events,
        });
    }
    catch (error) {
        console.error("Get match statistics error:", error);
        res.status(500).json({ error: "Failed to get match statistics" });
    }
}
