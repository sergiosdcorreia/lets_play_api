import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import {
  teamSchema,
  teamUpdateSchema,
  teamMemberRsvpSchema,
} from "../utils/validation";
import { sendInviteEmail } from "../services/emailService";
import { v4 as uuidv4 } from "uuid";

// Get all teams
export async function getAllTeams(req: Request, res: Response) {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: "asc" },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subManager: {
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
    });

    res.json({ teams });
  } catch (error) {
    console.error("Get teams error:", error);
    res.status(500).json({ error: "Failed to get teams" });
  }
}

// Get single team
export async function getTeam(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          },
        },
        subManager: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
        members: {
          where: {
            status: { in: ["active", "pending"] },
          },
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
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json({ team });
  } catch (error) {
    console.error("Get team error:", error);
    res.status(500).json({ error: "Failed to get team" });
  }
}

// Get user's teams
export async function getMyTeams(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { managerId: req.user.id },
          { subManagerId: req.user.id },
          {
            members: {
              some: {
                userId: req.user.id,
                status: "active",
              },
            },
          },
        ],
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          where: {
            userId: req.user.id,
          },
          select: {
            role: true,
            status: true,
            joinedAt: true,
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
      orderBy: { createdAt: "desc" },
    });

    res.json({ teams });
  } catch (error) {
    console.error("Get my teams error:", error);
    res.status(500).json({ error: "Failed to get teams" });
  }
}

// Create team
export async function createTeam(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Validate input
    const validatedData = teamSchema.parse(req.body);

    // Check if sub-manager exists
    if (validatedData.subManagerId) {
      const subManager = await prisma.user.findUnique({
        where: { id: validatedData.subManagerId },
      });

      if (!subManager) {
        return res.status(404).json({ error: "Sub-manager not found" });
      }

      if (subManager.id === req.user.id) {
        return res
          .status(400)
          .json({ error: "You cannot be your own sub-manager" });
      }
    }

    // Create team and add manager as active member
    const team = await prisma.team.create({
      data: {
        ...validatedData,
        managerId: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: "manager",
            status: "active",
            joinedAt: new Date(),
          },
        },
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
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

    res.status(201).json({
      message: "Team created successfully",
      team,
    });
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error,
      });
    }

    console.error("Create team error:", error);
    res.status(500).json({ error: "Failed to create team" });
  }
}

// Update team
export async function updateTeam(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    // Check team exists and user is manager
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    if (team.managerId !== req.user.id && team.subManagerId !== req.user.id) {
      return res.status(403).json({
        error: "Only team managers can update the team",
      });
    }

    // Validate input
    const validatedData = teamUpdateSchema.parse(req.body);

    // If updating sub-manager, check user exists
    if (validatedData.subManagerId !== undefined) {
      if (validatedData.subManagerId) {
        const subManager = await prisma.user.findUnique({
          where: { id: validatedData.subManagerId },
        });

        if (!subManager) {
          return res.status(404).json({ error: "Sub-manager not found" });
        }

        if (subManager.id === team.managerId) {
          return res
            .status(400)
            .json({ error: "Manager cannot be sub-manager" });
        }
      }
    }

    // Update team
    const updated = await prisma.team.update({
      where: { id },
      data: validatedData,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
        subManager: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      message: "Team updated successfully",
      team: updated,
    });
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error,
      });
    }

    console.error("Update team error:", error);
    res.status(500).json({ error: "Failed to update team" });
  }
}

// Delete team
export async function deleteTeam(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    // Check team exists and user is manager
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    if (team.managerId !== req.user.id) {
      return res.status(403).json({
        error: "Only the team owner can delete the team",
      });
    }

    // Delete team (cascade will delete members)
    await prisma.team.delete({
      where: { id },
    });

    res.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Delete team error:", error);
    res.status(500).json({ error: "Failed to delete team" });
  }
}

// ==================== INVITE PLAYER (COM EMAIL) ====================
export async function invitePlayer(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id: teamId } = req.params;
    const { email, role } = req.body;
    const userId = req.user.id;

    console.log("📧 Invite request:", { teamId, email, role, userId });

    // 1. Validações básicas
    if (!email || !role) {
      return res.status(400).json({ error: "Email and role are required" });
    }

    if (!["member", "coordinator"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // 2. Busca a equipa
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        manager: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    console.log("✅ Team found:", team.name);

    // 3. Verifica se o utilizador tem permissão (é manager ou sub-manager)
    const isManager = team.managerId === userId;
    const isSubManager = team.subManagerId === userId;
    const isMemberCoordinator = team.members.some(
      (m) => m.userId === userId && m.role === "coordinator"
    );

    if (!isManager && !isSubManager && !isMemberCoordinator) {
      return res.status(403).json({
        error: "Only team managers can invite members",
      });
    }

    console.log("✅ User is manager/coordinator");

    // 4. Verifica se o email já é membro
    const existingMember = team.members.find((m) => m.user.email === email);
    if (existingMember && existingMember.status === "active") {
      return res.status(400).json({
        error: "User is already a member of this team",
      });
    }

    console.log("✅ Email not in team yet");

    // 5. Verifica se já tem convite pendente
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId,
        email,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return res.status(400).json({
        error: "An invitation is already pending for this email",
      });
    }

    console.log("✅ No pending invite");

    // 6. Cria o convite na BD
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

    const invite = await prisma.teamInvite.create({
      data: {
        teamId,
        email,
        role,
        token,
        invitedBy: userId,
        expiresAt,
        status: "pending",
      },
      include: {
        inviter: true,
      },
    });

    console.log("✅ Invite created in DB:", invite.id);

    // 7. Envia o email via Resend
    try {
      await sendInviteEmail({
        to: email,
        teamName: team.name,
        inviterName: invite.inviter?.name || "Someone",
        role,
        inviteToken: token,
        expiresAt,
      });
      console.log("✅ Email sent successfully");
    } catch (emailError) {
      console.error("❌ Failed to send email:", emailError);
      // Mesmo se o email falhar, o convite existe na BD
    }

    // 8. Retorna sucesso
    res.status(201).json({
      message: "Invitation sent successfully",
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error("❌ Error creating invite:", error);
    res.status(500).json({ error: "Failed to create invitation" });
  }
}

// RSVP to team invitation (accept or decline)
export async function rsvpToTeam(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params; // team ID

    // Validate input
    const validatedData = teamMemberRsvpSchema.parse(req.body);

    // Find user's membership
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: req.user.id,
        status: "pending",
      },
    });

    if (!membership) {
      return res.status(404).json({
        error: "No pending invitation found for this team",
      });
    }

    // Update membership status
    const updated = await prisma.teamMember.update({
      where: { id: membership.id },
      data: {
        status: validatedData.status,
        joinedAt: validatedData.status === "active" ? new Date() : null,
      },
    });

    res.json({
      message: `Successfully ${
        validatedData.status === "active" ? "accepted" : "declined"
      } team invitation`,
      member: updated,
    });
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error,
      });
    }

    console.error("RSVP to team error:", error);
    res.status(500).json({ error: "Failed to update invitation" });
  }
}

// Leave team
export async function leaveTeam(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params; // team ID

    // Check team exists
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Manager cannot leave their own team
    if (team.managerId === req.user.id) {
      return res.status(400).json({
        error:
          "Team manager cannot leave. Transfer ownership or delete the team.",
      });
    }

    // Find user's membership
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        userId: req.user.id,
        status: "active",
      },
    });

    if (!membership) {
      return res
        .status(404)
        .json({ error: "You are not a member of this team" });
    }

    // Update membership to "left"
    await prisma.teamMember.update({
      where: { id: membership.id },
      data: {
        status: "left",
        leftAt: new Date(),
      },
    });

    res.json({ message: "Successfully left the team" });
  } catch (error) {
    console.error("Leave team error:", error);
    res.status(500).json({ error: "Failed to leave team" });
  }
}

// Remove member from team
export async function removeMember(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id, memberId } = req.params; // team ID, member ID

    // Check team exists and user is manager
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    if (team.managerId !== req.user.id && team.subManagerId !== req.user.id) {
      return res.status(403).json({
        error: "Only team managers can remove members",
      });
    }

    // Check membership exists
    const membership = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!membership || membership.teamId !== id) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Cannot remove the team owner
    if (membership.userId === team.managerId && membership.role === "manager") {
      return res.status(400).json({ error: "Cannot remove team owner" });
    }

    // Delete membership
    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
}

// Get team matches
export async function getTeamMatches(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: id }, { awayTeamId: id }],
      },
      include: {
        venue: true,
        tournament: true,
        homeTeam: { select: { id: true, name: true, logo: true } },
        awayTeam: { select: { id: true, name: true, logo: true } },
      },
      orderBy: { date: "desc" },
    });

    res.json({ matches });
  } catch (error) {
    console.error("Get team matches error:", error);
    res.status(500).json({ error: "Failed to get team matches" });
  }
}

// Get team stats
export async function getTeamStats(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: id }, { awayTeamId: id }],
        status: "completed",
      },
    });

    let stats = {
      matchesPlayed: matches.length,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    };

    matches.forEach((match) => {
      const isHome = match.homeTeamId === id;
      const teamScore = isHome ? match.homeScore : match.awayScore;
      const opponentScore = isHome ? match.awayScore : match.homeScore;

      if (teamScore !== null && teamScore !== undefined && opponentScore !== null && opponentScore !== undefined) {
        stats.goalsFor += teamScore;
        stats.goalsAgainst += opponentScore;

        if (teamScore > opponentScore) {
          stats.wins++;
        } else if (teamScore < opponentScore) {
          stats.losses++;
        } else {
          stats.draws++;
        }
      }
    });

    res.json({ stats });
  } catch (error) {
    console.error("Get team stats error:", error);
    res.status(500).json({ error: "Failed to get team stats" });
  }
}
