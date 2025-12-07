"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllTournaments = getAllTournaments;
exports.getTournament = getTournament;
exports.getTournamentStandings = getTournamentStandings;
exports.createTournament = createTournament;
exports.updateTournament = updateTournament;
exports.deleteTournament = deleteTournament;
exports.inviteTeam = inviteTeam;
exports.rsvpToTournament = rsvpToTournament;
exports.removeTeam = removeTeam;
exports.createTournamentMatch = createTournamentMatch;
exports.completeTournamentMatch = completeTournamentMatch;
exports.generateFixtures = generateFixtures;
exports.recalculateStandings = recalculateStandings;
const prisma_1 = require("../utils/prisma");
const validation_1 = require("../utils/validation");
const validation_2 = require("../utils/validation");
const tournamentStandings_js_1 = require("../utils/tournamentStandings.js");
// Get all tournaments
async function getAllTournaments(req, res) {
    try {
        const { status } = req.query;
        const where = {};
        if (status) {
            where.status = status;
        }
        const tournaments = await prisma_1.prisma.tournament.findMany({
            where,
            orderBy: { startDate: "desc" },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        teams: {
                            where: { status: "confirmed" },
                        },
                        matches: true,
                    },
                },
            },
        });
        res.json({ tournaments });
    }
    catch (error) {
        console.error("Get tournaments error:", error);
        res.status(500).json({ error: "Failed to get tournaments" });
    }
}
// Get single tournament
async function getTournament(req, res) {
    try {
        const { id } = req.params;
        const tournament = await prisma_1.prisma.tournament.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                teams: {
                    include: {
                        team: {
                            include: {
                                manager: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                _count: {
                                    select: {
                                        members: {
                                            where: { status: "active" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: [
                        { points: "desc" },
                        { goalDifference: "desc" },
                        { goalsFor: "desc" },
                    ],
                },
                matches: {
                    orderBy: { date: "asc" },
                    include: {
                        venue: {
                            select: {
                                id: true,
                                name: true,
                                city: true,
                            },
                        },
                        _count: {
                            select: {
                                players: true,
                            },
                        },
                    },
                },
            },
        });
        if (!tournament) {
            return res.status(404).json({ error: "Tournament not found" });
        }
        res.json({ tournament });
    }
    catch (error) {
        console.error("Get tournament error:", error);
        res.status(500).json({ error: "Failed to get tournament" });
    }
}
// Get tournament standings
async function getTournamentStandings(req, res) {
    try {
        const { id } = req.params;
        const tournament = await prisma_1.prisma.tournament.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                format: true,
            },
        });
        if (!tournament) {
            return res.status(404).json({ error: "Tournament not found" });
        }
        const standings = await prisma_1.prisma.tournamentTeam.findMany({
            where: {
                tournamentId: id,
                status: "confirmed",
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        logo: true,
                        primaryColor: true,
                    },
                },
            },
            orderBy: [
                { points: "desc" },
                { goalDifference: "desc" },
                { goalsFor: "desc" },
                { team: { name: "asc" } },
            ],
        });
        const standingsWithRank = standings.map((standing, index) => ({
            rank: index + 1,
            team: standing.team,
            matchesPlayed: standing.matchesPlayed,
            wins: standing.wins,
            draws: standing.draws,
            losses: standing.losses,
            goalsFor: standing.goalsFor,
            goalsAgainst: standing.goalsAgainst,
            goalDifference: standing.goalDifference,
            points: standing.points,
        }));
        res.json({
            tournament: {
                id: tournament.id,
                name: tournament.name,
                format: tournament.format,
            },
            standings: standingsWithRank,
        });
    }
    catch (error) {
        console.error("Get standings error:", error);
        res.status(500).json({ error: "Failed to get standings" });
    }
}
// Create tournament
async function createTournament(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        // Validate input
        const validatedData = validation_1.tournamentSchema.parse(req.body);
        // Check user is a team manager
        const managedTeams = await prisma_1.prisma.team.count({
            where: {
                OR: [{ managerId: req.user.id }, { subManagerId: req.user.id }],
            },
        });
        if (managedTeams === 0) {
            return res.status(403).json({
                error: "Only team managers can create tournaments",
            });
        }
        // Check start date is in the future
        const startDate = new Date(validatedData.startDate);
        if (startDate < new Date()) {
            return res.status(400).json({
                error: "Tournament start date must be in the future",
            });
        }
        // Create tournament
        const tournament = await prisma_1.prisma.tournament.create({
            data: {
                ...validatedData,
                startDate,
                createdById: req.user.id,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        res.status(201).json({
            message: "Tournament created successfully",
            tournament,
        });
    }
    catch (error) {
        if (error instanceof Error && "issues" in error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error,
            });
        }
        console.error("Create tournament error:", error);
        res.status(500).json({ error: "Failed to create tournament" });
    }
}
// Update tournament
async function updateTournament(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params;
        // Check tournament exists and user is creator
        const tournament = await prisma_1.prisma.tournament.findUnique({
            where: { id },
        });
        if (!tournament) {
            return res.status(404).json({ error: "Tournament not found" });
        }
        if (tournament.createdById !== req.user.id) {
            return res.status(403).json({
                error: "Only the tournament creator can update it",
            });
        }
        // Validate input
        const validatedData = validation_1.tournamentUpdateSchema.parse(req.body);
        // If updating start date, ensure it's in the future
        if (validatedData.startDate) {
            const newStartDate = new Date(validatedData.startDate);
            if (newStartDate < new Date() && tournament.status === "upcoming") {
                return res.status(400).json({
                    error: "Start date must be in the future",
                });
            }
        }
        // Prepare update data
        const updateData = { ...validatedData };
        if (validatedData.startDate) {
            updateData.startDate = new Date(validatedData.startDate);
        }
        // Update tournament
        const updated = await prisma_1.prisma.tournament.update({
            where: { id },
            data: updateData,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        res.json({
            message: "Tournament updated successfully",
            tournament: updated,
        });
    }
    catch (error) {
        if (error instanceof Error && "issues" in error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error,
            });
        }
        console.error("Update tournament error:", error);
        res.status(500).json({ error: "Failed to update tournament" });
    }
}
// Delete tournament
async function deleteTournament(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params;
        // Check tournament exists and user is creator
        const tournament = await prisma_1.prisma.tournament.findUnique({
            where: { id },
        });
        if (!tournament) {
            return res.status(404).json({ error: "Tournament not found" });
        }
        if (tournament.createdById !== req.user.id) {
            return res.status(403).json({
                error: "Only the tournament creator can delete it",
            });
        }
        // Delete tournament (cascade will delete teams and update matches)
        await prisma_1.prisma.tournament.delete({
            where: { id },
        });
        res.json({ message: "Tournament deleted successfully" });
    }
    catch (error) {
        console.error("Delete tournament error:", error);
        res.status(500).json({ error: "Failed to delete tournament" });
    }
}
// Invite team to tournament
async function inviteTeam(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params; // tournament ID
        // Validate input
        const validatedData = validation_1.inviteTournamentTeamSchema.parse(req.body);
        // Check tournament exists and user is creator
        const tournament = await prisma_1.prisma.tournament.findUnique({
            where: { id },
            include: {
                teams: true,
            },
        });
        if (!tournament) {
            return res.status(404).json({ error: "Tournament not found" });
        }
        if (tournament.createdById !== req.user.id) {
            return res.status(403).json({
                error: "Only the tournament creator can invite teams",
            });
        }
        // Check team exists
        const team = await prisma_1.prisma.team.findUnique({
            where: { id: validatedData.teamId },
            include: {
                manager: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        if (!team) {
            return res.status(404).json({ error: "Team not found" });
        }
        // Check if team is already in tournament
        const existingTeam = tournament.teams.find((t) => t.teamId === validatedData.teamId);
        if (existingTeam) {
            if (existingTeam.status === "confirmed") {
                return res
                    .status(400)
                    .json({ error: "Team is already in the tournament" });
            }
            else if (existingTeam.status === "invited") {
                return res
                    .status(400)
                    .json({ error: "Team already has a pending invitation" });
            }
        }
        // Create invitation
        const tournamentTeam = await prisma_1.prisma.tournamentTeam.create({
            data: {
                tournamentId: id,
                teamId: validatedData.teamId,
                status: "invited",
            },
            include: {
                team: {
                    include: {
                        manager: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(201).json({
            message: "Team invited successfully",
            tournamentTeam,
        });
    }
    catch (error) {
        if (error instanceof Error && "issues" in error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error,
            });
        }
        console.error("Invite team error:", error);
        res.status(500).json({ error: "Failed to invite team" });
    }
}
// RSVP to tournament invitation
async function rsvpToTournament(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params; // tournament ID
        // Validate input
        const validatedData = validation_1.tournamentTeamRsvpSchema.parse(req.body);
        // Find user's team that has an invitation
        const tournamentTeam = await prisma_1.prisma.tournamentTeam.findFirst({
            where: {
                tournamentId: id,
                status: "invited",
                team: {
                    OR: [{ managerId: req.user.id }, { subManagerId: req.user.id }],
                },
            },
            include: {
                team: true,
                tournament: true,
            },
        });
        if (!tournamentTeam) {
            return res.status(404).json({
                error: "No pending tournament invitation found for your team",
            });
        }
        // Update status
        const updated = await prisma_1.prisma.tournamentTeam.update({
            where: { id: tournamentTeam.id },
            data: {
                status: validatedData.status,
                joinedAt: validatedData.status === "confirmed" ? new Date() : null,
            },
        });
        res.json({
            message: `Successfully ${validatedData.status === "confirmed" ? "accepted" : "declined"} tournament invitation`,
            tournamentTeam: updated,
        });
    }
    catch (error) {
        if (error instanceof Error && "issues" in error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error,
            });
        }
        console.error("RSVP to tournament error:", error);
        res.status(500).json({ error: "Failed to update invitation" });
    }
}
// Remove team from tournament
async function removeTeam(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id, teamId } = req.params; // tournament ID, team ID
        // Check tournament exists and user is creator
        const tournament = await prisma_1.prisma.tournament.findUnique({
            where: { id },
        });
        if (!tournament) {
            return res.status(404).json({ error: "Tournament not found" });
        }
        if (tournament.createdById !== req.user.id) {
            return res.status(403).json({
                error: "Only the tournament creator can remove teams",
            });
        }
        // Find tournament team
        const tournamentTeam = await prisma_1.prisma.tournamentTeam.findFirst({
            where: {
                tournamentId: id,
                teamId,
            },
        });
        if (!tournamentTeam) {
            return res.status(404).json({ error: "Team not found in tournament" });
        }
        // Delete tournament team
        await prisma_1.prisma.tournamentTeam.delete({
            where: { id: tournamentTeam.id },
        });
        res.json({ message: "Team removed from tournament successfully" });
    }
    catch (error) {
        console.error("Remove team error:", error);
        res.status(500).json({ error: "Failed to remove team" });
    }
}
// Create tournament match
async function createTournamentMatch(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params; // tournament ID
        // Validate input
        const validatedData = validation_2.matchSchema.parse(req.body);
        // Check tournament exists and user is creator
        const tournament = await prisma_1.prisma.tournament.findUnique({
            where: { id },
            include: {
                teams: {
                    where: { status: "confirmed" },
                },
            },
        });
        if (!tournament) {
            return res.status(404).json({ error: "Tournament not found" });
        }
        if (tournament.createdById !== req.user.id) {
            return res.status(403).json({
                error: "Only the tournament creator can create matches",
            });
        }
        // Validate home and away teams are required for tournament matches
        if (!validatedData.homeTeamId || !validatedData.awayTeamId) {
            return res.status(400).json({
                error: "Home team and away team are required for tournament matches",
            });
        }
        if (validatedData.homeTeamId === validatedData.awayTeamId) {
            return res.status(400).json({
                error: "Home team and away team must be different",
            });
        }
        // Check both teams are in the tournament
        const homeTeam = tournament.teams.find((t) => t.teamId === validatedData.homeTeamId);
        const awayTeam = tournament.teams.find((t) => t.teamId === validatedData.awayTeamId);
        if (!homeTeam || !awayTeam) {
            return res.status(400).json({
                error: "Both teams must be confirmed participants in the tournament",
            });
        }
        // Check venue exists
        const venue = await prisma_1.prisma.venue.findUnique({
            where: { id: validatedData.venueId },
        });
        if (!venue) {
            return res.status(404).json({ error: "Venue not found" });
        }
        // Check match date
        const matchDate = new Date(validatedData.date);
        if (matchDate < new Date()) {
            return res
                .status(400)
                .json({ error: "Match date must be in the future" });
        }
        // Create match
        const match = await prisma_1.prisma.match.create({
            data: {
                date: matchDate,
                duration: validatedData.duration,
                venueId: validatedData.venueId,
                notes: validatedData.notes,
                tournamentId: id,
                homeTeamId: validatedData.homeTeamId,
                awayTeamId: validatedData.awayTeamId,
                createdById: req.user.id,
                status: "scheduled",
            },
            include: {
                venue: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                    },
                },
            },
        });
        res.status(201).json({
            message: "Tournament match created successfully",
            match,
        });
    }
    catch (error) {
        if (error instanceof Error && "issues" in error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error,
            });
        }
        console.error("Create tournament match error:", error);
        res.status(500).json({ error: "Failed to create tournament match" });
    }
}
// Complete tournament match and update standings
async function completeTournamentMatch(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id, matchId } = req.params; // tournament ID, match ID
        const { homeScore, awayScore } = req.body;
        // Validate scores
        if (typeof homeScore !== "number" || typeof awayScore !== "number") {
            return res.status(400).json({
                error: "Home score and away score must be numbers",
            });
        }
        if (homeScore < 0 || awayScore < 0) {
            return res.status(400).json({
                error: "Scores cannot be negative",
            });
        }
        // Check tournament exists
        const tournament = await prisma_1.prisma.tournament.findUnique({
            where: { id },
        });
        if (!tournament) {
            return res.status(404).json({ error: "Tournament not found" });
        }
        if (tournament.createdById !== req.user.id) {
            return res.status(403).json({
                error: "Only the tournament creator can complete matches",
            });
        }
        // Check match exists and is part of tournament
        const match = await prisma_1.prisma.match.findUnique({
            where: { id: matchId },
        });
        if (!match) {
            return res.status(404).json({ error: "Match not found" });
        }
        if (match.tournamentId !== id) {
            return res.status(400).json({
                error: "Match is not part of this tournament",
            });
        }
        if (match.status === "completed") {
            return res.status(400).json({
                error: "Match is already completed",
            });
        }
        if (!match.homeTeamId || !match.awayTeamId) {
            return res.status(400).json({
                error: "Match does not have teams assigned",
            });
        }
        // Update match with scores
        const updatedMatch = await prisma_1.prisma.match.update({
            where: { id: matchId },
            data: {
                homeScore,
                awayScore,
                status: "completed",
            },
            include: {
                venue: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        // Update tournament standings
        await (0, tournamentStandings_js_1.updateTournamentStandings)({
            matchId,
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            homeScore,
            awayScore,
        });
        res.json({
            message: "Match completed and standings updated successfully",
            match: updatedMatch,
        });
    }
    catch (error) {
        console.error("Complete tournament match error:", error);
        res.status(500).json({ error: "Failed to complete match" });
    }
}
// Auto-generate tournament fixtures
async function generateFixtures(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params; // tournament ID
        const { venueId, startDate, daysPerRound } = req.body;
        // Validate inputs
        if (!venueId || !startDate) {
            return res.status(400).json({
                error: "Venue ID and start date are required",
            });
        }
        // Check tournament exists
        const tournament = await prisma_1.prisma.tournament.findUnique({
            where: { id },
            include: {
                teams: {
                    where: { status: "confirmed" },
                    include: {
                        team: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        if (!tournament) {
            return res.status(404).json({ error: "Tournament not found" });
        }
        if (tournament.createdById !== req.user.id) {
            return res.status(403).json({
                error: "Only the tournament creator can generate fixtures",
            });
        }
        // Check venue exists
        const venue = await prisma_1.prisma.venue.findUnique({
            where: { id: venueId },
        });
        if (!venue) {
            return res.status(404).json({ error: "Venue not found" });
        }
        // Get confirmed teams
        const teams = tournament.teams.map((t) => t.team);
        if (teams.length < 2) {
            return res.status(400).json({
                error: "At least 2 teams are required to generate fixtures",
            });
        }
        // Generate round-robin fixtures
        const fixtures = [];
        const matchStartDate = new Date(startDate);
        const daysBetweenRounds = daysPerRound || 7; // Default 1 week between rounds
        // Round-robin algorithm
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const homeTeam = teams[i];
                const awayTeam = teams[j];
                // Calculate match date
                const matchDate = new Date(matchStartDate);
                matchDate.setDate(matchDate.getDate() + fixtures.length * daysBetweenRounds);
                matchDate.setHours(19, 0, 0, 0); // Default 7 PM
                fixtures.push({
                    date: matchDate,
                    duration: 90,
                    venueId,
                    tournamentId: id,
                    homeTeamId: homeTeam.id,
                    awayTeamId: awayTeam.id,
                    createdById: req.user.id,
                    status: "scheduled",
                    notes: `${tournament.name} - ${homeTeam.name} vs ${awayTeam.name}`,
                });
            }
        }
        // Create all fixtures
        const createdMatches = await prisma_1.prisma.match.createMany({
            data: fixtures,
        });
        res.status(201).json({
            message: `Successfully generated ${createdMatches.count} fixtures`,
            fixturesCount: createdMatches.count,
            info: {
                totalMatches: fixtures.length,
                teamsCount: teams.length,
                startDate: matchStartDate,
                estimatedEndDate: new Date(matchStartDate.getTime() +
                    fixtures.length * daysBetweenRounds * 24 * 60 * 60 * 1000),
            },
        });
    }
    catch (error) {
        console.error("Generate fixtures error:", error);
        res.status(500).json({ error: "Failed to generate fixtures" });
    }
}
// Recalculate tournament standings
async function recalculateStandings(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params; // tournament ID
        // Check tournament exists
        const tournament = await prisma_1.prisma.tournament.findUnique({
            where: { id },
        });
        if (!tournament) {
            return res.status(404).json({ error: "Tournament not found" });
        }
        if (tournament.createdById !== req.user.id) {
            return res.status(403).json({
                error: "Only the tournament creator can recalculate standings",
            });
        }
        // Recalculate standings
        await (0, tournamentStandings_js_1.recalculateTournamentStandings)(id);
        res.json({
            message: "Tournament standings recalculated successfully",
        });
    }
    catch (error) {
        console.error("Recalculate standings error:", error);
        res.status(500).json({ error: "Failed to recalculate standings" });
    }
}
