"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitePlayerToMatch = exports.leaveMatch = exports.rsvpToMatch = exports.deleteMatch = exports.updateMatch = exports.createMatch = exports.getMyMatches = exports.getMatch = exports.getAllMatches = void 0;
const prisma_1 = require("../utils/prisma");
// ==================== GET ALL MATCHES ====================
const getAllMatches = async (req, res) => {
    try {
        const { status, upcoming } = req.query;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (upcoming === "true") {
            where.date = { gte: new Date() };
        }
        const matches = await prisma_1.prisma.match.findMany({
            where,
            include: {
                venue: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        city: true,
                        surface: true,
                    },
                },
                players: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                position: true,
                                skillLevel: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        players: true,
                    },
                },
            },
            orderBy: { date: "asc" },
        });
        res.json({ matches });
    }
    catch (error) {
        console.error("Get matches error:", error);
        res.status(500).json({ error: "Failed to get matches" });
    }
};
exports.getAllMatches = getAllMatches;
// ==================== GET SINGLE MATCH ====================
const getMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const match = await prisma_1.prisma.match.findUnique({
            where: { id },
            include: {
                venue: true,
                players: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                position: true,
                                skillLevel: true,
                            },
                        },
                    },
                    orderBy: { status: "asc" },
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
                    orderBy: { minute: "asc" },
                },
                tournament: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!match) {
            return res.status(404).json({ error: "Match not found" });
        }
        res.json({ match });
    }
    catch (error) {
        console.error("Get match error:", error);
        res.status(500).json({ error: "Failed to get match" });
    }
};
exports.getMatch = getMatch;
// ==================== GET MY MATCHES ====================
const getMyMatches = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const matches = await prisma_1.prisma.match.findMany({
            where: {
                OR: [
                    { createdById: req.user.id },
                    {
                        players: {
                            some: {
                                userId: req.user.id,
                            },
                        },
                    },
                ],
            },
            include: {
                venue: {
                    select: {
                        id: true,
                        name: true,
                        city: true,
                    },
                },
                players: {
                    where: {
                        userId: req.user.id,
                    },
                    select: {
                        status: true,
                        team: true,
                    },
                },
                _count: {
                    select: {
                        players: true,
                    },
                },
            },
            orderBy: { date: "asc" },
        });
        res.json({ matches });
    }
    catch (error) {
        console.error("Get my matches error:", error);
        res.status(500).json({ error: "Failed to get matches" });
    }
};
exports.getMyMatches = getMyMatches;
// ==================== CREATE MATCH ====================
const createMatch = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { date, duration, venueId, notes } = req.body;
        // Validações
        if (!date || !venueId) {
            return res.status(400).json({ error: "Date and venue are required" });
        }
        // Verifica se venue existe
        const venue = await prisma_1.prisma.venue.findUnique({
            where: { id: venueId },
        });
        if (!venue) {
            return res.status(404).json({ error: "Venue not found" });
        }
        // Cria o jogo e adiciona o criador como jogador confirmado
        const match = await prisma_1.prisma.match.create({
            data: {
                date: new Date(date),
                duration: duration || 90,
                venueId,
                notes,
                status: "scheduled",
                createdById: req.user.id,
                players: {
                    create: {
                        userId: req.user.id,
                        status: "confirmed",
                    },
                },
            },
            include: {
                venue: true,
                players: {
                    include: {
                        user: {
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
            message: "Match created successfully",
            match,
        });
    }
    catch (error) {
        console.error("Create match error:", error);
        res.status(500).json({ error: "Failed to create match" });
    }
};
exports.createMatch = createMatch;
// ==================== UPDATE MATCH ====================
const updateMatch = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params;
        const { date, duration, venueId, notes, status } = req.body;
        // Verifica se o jogo existe e se o user é o criador
        const match = await prisma_1.prisma.match.findUnique({
            where: { id },
        });
        if (!match) {
            return res.status(404).json({ error: "Match not found" });
        }
        if (match.createdById !== req.user.id) {
            return res.status(403).json({
                error: "Only the match creator can update it",
            });
        }
        // Se mudou o venue, verifica se existe
        if (venueId && venueId !== match.venueId) {
            const venue = await prisma_1.prisma.venue.findUnique({
                where: { id: venueId },
            });
            if (!venue) {
                return res.status(404).json({ error: "Venue not found" });
            }
        }
        const updated = await prisma_1.prisma.match.update({
            where: { id },
            data: {
                ...(date && { date: new Date(date) }),
                ...(duration && { duration }),
                ...(venueId && { venueId }),
                ...(notes !== undefined && { notes }),
                ...(status && { status }),
            },
            include: {
                venue: true,
                players: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        res.json({
            message: "Match updated successfully",
            match: updated,
        });
    }
    catch (error) {
        console.error("Update match error:", error);
        res.status(500).json({ error: "Failed to update match" });
    }
};
exports.updateMatch = updateMatch;
// ==================== DELETE MATCH ====================
const deleteMatch = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params;
        const match = await prisma_1.prisma.match.findUnique({
            where: { id },
        });
        if (!match) {
            return res.status(404).json({ error: "Match not found" });
        }
        if (match.createdById !== req.user.id) {
            return res.status(403).json({
                error: "Only the match creator can delete it",
            });
        }
        await prisma_1.prisma.match.delete({
            where: { id },
        });
        res.json({ message: "Match deleted successfully" });
    }
    catch (error) {
        console.error("Delete match error:", error);
        res.status(500).json({ error: "Failed to delete match" });
    }
};
exports.deleteMatch = deleteMatch;
// ==================== RSVP TO MATCH ====================
const rsvpToMatch = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params;
        const { status } = req.body; // "confirmed", "declined", "pending"
        if (!["confirmed", "declined", "pending"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }
        // Verifica se o jogo existe
        const match = await prisma_1.prisma.match.findUnique({
            where: { id },
        });
        if (!match) {
            return res.status(404).json({ error: "Match not found" });
        }
        // Verifica se já está na lista de jogadores
        const existingPlayer = await prisma_1.prisma.matchPlayer.findFirst({
            where: {
                matchId: id,
                userId: req.user.id,
            },
        });
        if (existingPlayer) {
            // Atualiza o status
            const updated = await prisma_1.prisma.matchPlayer.update({
                where: { id: existingPlayer.id },
                data: { status },
            });
            return res.json({
                message: `Successfully ${status === "confirmed" ? "confirmed" : status === "declined" ? "declined" : "updated"} attendance`,
                player: updated,
            });
        }
        else {
            // Adiciona como novo jogador
            const player = await prisma_1.prisma.matchPlayer.create({
                data: {
                    matchId: id,
                    userId: req.user.id,
                    status,
                },
            });
            return res.status(201).json({
                message: `Successfully ${status === "confirmed" ? "joined" : "responded to"} match`,
                player,
            });
        }
    }
    catch (error) {
        console.error("RSVP to match error:", error);
        res.status(500).json({ error: "Failed to update attendance" });
    }
};
exports.rsvpToMatch = rsvpToMatch;
// ==================== LEAVE MATCH ====================
const leaveMatch = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params;
        const match = await prisma_1.prisma.match.findUnique({
            where: { id },
        });
        if (!match) {
            return res.status(404).json({ error: "Match not found" });
        }
        // Match creator não pode sair (só pode deletar o jogo)
        if (match.createdById === req.user.id) {
            return res.status(400).json({
                error: "Match creator cannot leave. Delete the match instead.",
            });
        }
        const player = await prisma_1.prisma.matchPlayer.findFirst({
            where: {
                matchId: id,
                userId: req.user.id,
            },
        });
        if (!player) {
            return res.status(404).json({
                error: "You are not in this match",
            });
        }
        await prisma_1.prisma.matchPlayer.delete({
            where: { id: player.id },
        });
        res.json({ message: "Successfully left the match" });
    }
    catch (error) {
        console.error("Leave match error:", error);
        res.status(500).json({ error: "Failed to leave match" });
    }
};
exports.leaveMatch = leaveMatch;
// ==================== INVITE PLAYER TO MATCH ====================
const invitePlayerToMatch = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        // Verifica se o jogo existe e se o user é o criador
        const match = await prisma_1.prisma.match.findUnique({
            where: { id },
        });
        if (!match) {
            return res.status(404).json({ error: "Match not found" });
        }
        if (match.createdById !== req.user.id) {
            return res.status(403).json({
                error: "Only the match creator can invite players",
            });
        }
        // Verifica se o user existe
        const userToInvite = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!userToInvite) {
            return res.status(404).json({ error: "User not found" });
        }
        // Verifica se já está no jogo
        const existingPlayer = await prisma_1.prisma.matchPlayer.findFirst({
            where: {
                matchId: id,
                userId,
            },
        });
        if (existingPlayer) {
            return res.status(400).json({
                error: "User is already in this match",
            });
        }
        // Adiciona como pending
        const player = await prisma_1.prisma.matchPlayer.create({
            data: {
                matchId: id,
                userId,
                status: "pending",
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        res.status(201).json({
            message: "Player invited successfully",
            player,
        });
    }
    catch (error) {
        console.error("Invite player error:", error);
        res.status(500).json({ error: "Failed to invite player" });
    }
};
exports.invitePlayerToMatch = invitePlayerToMatch;
