"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.declineInvite = exports.acceptInvite = exports.getInviteByToken = exports.getMyInvites = void 0;
const prisma_1 = require("../utils/prisma");
// ==================== GET MY INVITES ====================
const getMyInvites = async (req, res) => {
    try {
        const userEmail = req.user?.email;
        if (!userEmail) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const invites = await prisma_1.prisma.teamInvite.findMany({
            where: {
                email: userEmail,
                status: "pending",
                expiresAt: { gt: new Date() },
            },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        primaryColor: true,
                    },
                },
                inviter: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ invites });
    }
    catch (error) {
        console.error("Error fetching invites:", error);
        res.status(500).json({ error: "Failed to fetch invitations" });
    }
};
exports.getMyInvites = getMyInvites;
// ==================== GET INVITE BY TOKEN ====================
const getInviteByToken = async (req, res) => {
    try {
        const { token } = req.params;
        const invite = await prisma_1.prisma.teamInvite.findUnique({
            where: { token },
            include: {
                team: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        primaryColor: true,
                        logo: true,
                    },
                },
                inviter: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        if (!invite) {
            return res.status(404).json({ error: "Invitation not found" });
        }
        // Verifica se expirou
        if (new Date() > new Date(invite.expiresAt)) {
            await prisma_1.prisma.teamInvite.update({
                where: { id: invite.id },
                data: { status: "expired" },
            });
            return res.status(410).json({ error: "This invitation has expired" });
        }
        res.json({ invite });
    }
    catch (error) {
        console.error("Error fetching invite:", error);
        res.status(500).json({ error: "Failed to fetch invitation" });
    }
};
exports.getInviteByToken = getInviteByToken;
// ==================== ACCEPT INVITE ====================
const acceptInvite = async (req, res) => {
    try {
        const { token } = req.params;
        const userId = req.user?.id;
        const userEmail = req.user?.email;
        if (!userId || !userEmail) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        // 1. Busca o convite
        const invite = await prisma_1.prisma.teamInvite.findUnique({
            where: { token },
            include: { team: true },
        });
        if (!invite) {
            return res.status(404).json({ error: "Invitation not found" });
        }
        // 2. Verifica se o email bate
        if (invite.email !== userEmail) {
            return res.status(403).json({
                error: "This invitation was sent to a different email address",
            });
        }
        // 3. Verifica status
        if (invite.status !== "pending") {
            return res.status(400).json({
                error: `This invitation has already been ${invite.status}`,
            });
        }
        // 4. Verifica expiração
        if (new Date() > new Date(invite.expiresAt)) {
            await prisma_1.prisma.teamInvite.update({
                where: { id: invite.id },
                data: { status: "expired" },
            });
            return res.status(410).json({ error: "This invitation has expired" });
        }
        // 5. Verifica se já é membro
        const existingMember = await prisma_1.prisma.teamMember.findFirst({
            where: {
                teamId: invite.teamId,
                userId,
            },
        });
        if (existingMember) {
            return res.status(400).json({
                error: "You are already a member of this team",
            });
        }
        // 6. Adiciona à equipa (transação)
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.teamMember.create({
                data: {
                    teamId: invite.teamId,
                    userId,
                    role: invite.role,
                    status: "active",
                    joinedAt: new Date(),
                },
            }),
            prisma_1.prisma.teamInvite.update({
                where: { id: invite.id },
                data: { status: "accepted" },
            }),
        ]);
        console.log("✅ User accepted invite and joined team");
        res.json({
            message: "Successfully joined the team",
            team: invite.team,
        });
    }
    catch (error) {
        console.error("Error accepting invite:", error);
        res.status(500).json({ error: "Failed to accept invitation" });
    }
};
exports.acceptInvite = acceptInvite;
// ==================== DECLINE INVITE ====================
const declineInvite = async (req, res) => {
    try {
        const { token } = req.params;
        const userEmail = req.user?.email;
        if (!userEmail) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const invite = await prisma_1.prisma.teamInvite.findUnique({
            where: { token },
        });
        if (!invite) {
            return res.status(404).json({ error: "Invitation not found" });
        }
        if (invite.email !== userEmail) {
            return res.status(403).json({
                error: "This invitation was sent to a different email address",
            });
        }
        if (invite.status !== "pending") {
            return res.status(400).json({
                error: `This invitation has already been ${invite.status}`,
            });
        }
        await prisma_1.prisma.teamInvite.update({
            where: { id: invite.id },
            data: { status: "declined" },
        });
        console.log("✅ User declined invite");
        res.json({ message: "Invitation declined" });
    }
    catch (error) {
        console.error("Error declining invite:", error);
        res.status(500).json({ error: "Failed to decline invitation" });
    }
};
exports.declineInvite = declineInvite;
