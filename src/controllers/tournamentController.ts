import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import {
  tournamentSchema,
  tournamentUpdateSchema,
  inviteTournamentTeamSchema,
  tournamentTeamRsvpSchema,
} from "../utils/validation";

// Get all tournaments
export async function getAllTournaments(req: Request, res: Response) {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const tournaments = await prisma.tournament.findMany({
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
  } catch (error) {
    console.error("Get tournaments error:", error);
    res.status(500).json({ error: "Failed to get tournaments" });
  }
}

// Get single tournament
export async function getTournament(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
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
  } catch (error) {
    console.error("Get tournament error:", error);
    res.status(500).json({ error: "Failed to get tournament" });
  }
}

// Get tournament standings
export async function getTournamentStandings(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const tournament = await prisma.tournament.findUnique({
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

    const standings = await prisma.tournamentTeam.findMany({
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

    const standingsWithRank = standings.map((standing: any, index: any) => ({
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
  } catch (error) {
    console.error("Get standings error:", error);
    res.status(500).json({ error: "Failed to get standings" });
  }
}

// Create tournament
export async function createTournament(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Validate input
    const validatedData = tournamentSchema.parse(req.body);

    // Check user is a team manager
    const managedTeams = await prisma.team.count({
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
    const tournament = await prisma.tournament.create({
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
  } catch (error) {
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
export async function updateTournament(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    // Check tournament exists and user is creator
    const tournament = await prisma.tournament.findUnique({
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
    const validatedData = tournamentUpdateSchema.parse(req.body);

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
    const updateData: any = { ...validatedData };
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }

    // Update tournament
    const updated = await prisma.tournament.update({
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
  } catch (error) {
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
export async function deleteTournament(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    // Check tournament exists and user is creator
    const tournament = await prisma.tournament.findUnique({
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
    await prisma.tournament.delete({
      where: { id },
    });

    res.json({ message: "Tournament deleted successfully" });
  } catch (error) {
    console.error("Delete tournament error:", error);
    res.status(500).json({ error: "Failed to delete tournament" });
  }
}

// Invite team to tournament
export async function inviteTeam(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params; // tournament ID

    // Validate input
    const validatedData = inviteTournamentTeamSchema.parse(req.body);

    // Check tournament exists and user is creator
    const tournament = await prisma.tournament.findUnique({
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
    const team = await prisma.team.findUnique({
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
    const existingTeam = tournament.teams.find(
      (t: any) => t.teamId === validatedData.teamId
    );

    if (existingTeam) {
      if (existingTeam.status === "confirmed") {
        return res
          .status(400)
          .json({ error: "Team is already in the tournament" });
      } else if (existingTeam.status === "invited") {
        return res
          .status(400)
          .json({ error: "Team already has a pending invitation" });
      }
    }

    // Create invitation
    const tournamentTeam = await prisma.tournamentTeam.create({
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
  } catch (error) {
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
export async function rsvpToTournament(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params; // tournament ID

    // Validate input
    const validatedData = tournamentTeamRsvpSchema.parse(req.body);

    // Find user's team that has an invitation
    const tournamentTeam = await prisma.tournamentTeam.findFirst({
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
    const updated = await prisma.tournamentTeam.update({
      where: { id: tournamentTeam.id },
      data: {
        status: validatedData.status,
        joinedAt: validatedData.status === "confirmed" ? new Date() : null,
      },
    });

    res.json({
      message: `Successfully ${
        validatedData.status === "confirmed" ? "accepted" : "declined"
      } tournament invitation`,
      tournamentTeam: updated,
    });
  } catch (error) {
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
export async function removeTeam(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id, teamId } = req.params; // tournament ID, team ID

    // Check tournament exists and user is creator
    const tournament = await prisma.tournament.findUnique({
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
    const tournamentTeam = await prisma.tournamentTeam.findFirst({
      where: {
        tournamentId: id,
        teamId,
      },
    });

    if (!tournamentTeam) {
      return res.status(404).json({ error: "Team not found in tournament" });
    }

    // Delete tournament team
    await prisma.tournamentTeam.delete({
      where: { id: tournamentTeam.id },
    });

    res.json({ message: "Team removed from tournament successfully" });
  } catch (error) {
    console.error("Remove team error:", error);
    res.status(500).json({ error: "Failed to remove team" });
  }
}
