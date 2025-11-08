import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { matchSchema, rsvpSchema } from "../utils/validation";
import { getWeatherForecast, getWeatherAdvice } from "../utils/weather";

// Get all matches
export async function getAllMatches(req: Request, res: Response) {
  try {
    const { status, upcoming } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (upcoming === "true") {
      where.date = { gte: new Date() };
    }

    const matches = await prisma.match.findMany({
      where,
      orderBy: { date: "asc" },
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
                position: true,
                skillLevel: true,
              },
            },
          },
        },
        _count: {
          select: { players: true },
        },
      },
    });

    res.json({ matches });
  } catch (error) {
    console.error("Get matches error:", error);
    res.status(500).json({ error: "Failed to get matches" });
  }
}

// Get single match
export async function getMatch(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const match = await prisma.match.findUnique({
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
        },
      },
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    let weatherData = null;
    if (match.venue.latitude && match.venue.longitude) {
      const weatherResult = await getWeatherForecast(
        match.venue.latitude,
        match.venue.longitude,
        match.date
      );

      if (weatherResult.success && weatherResult.weather) {
        weatherData = {
          ...weatherResult.weather,
          advice: getWeatherAdvice(weatherResult.weather),
        };
      } else if (weatherResult.error) {
        weatherData = {
          error: weatherResult.error,
        };
      }
    }

    res.json({
      match,
      weather: weatherData,
    });
  } catch (error) {
    console.error("Get match error:", error);
    res.status(500).json({ error: "Failed to get match" });
  }
}

// Get user's matches
export async function getMyMatches(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const matches = await prisma.match.findMany({
      where: {
        players: {
          some: {
            userId: req.user.id,
          },
        },
      },
      orderBy: { date: "asc" },
      include: {
        venue: {
          select: {
            name: true,
            address: true,
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
          select: { players: true },
        },
      },
    });

    res.json({ matches });
  } catch (error) {
    console.error("Get my matches error:", error);
    res.status(500).json({ error: "Failed to get matches" });
  }
}

// Create match
export async function createMatch(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Validate input
    const validatedData = matchSchema.parse(req.body);

    // Check venue exists
    const venue = await prisma.venue.findUnique({
      where: { id: validatedData.venueId },
    });

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // Check date is in the future
    const matchDate = new Date(validatedData.date);
    if (matchDate < new Date()) {
      return res
        .status(400)
        .json({ error: "Match date must be in the future" });
    }

    // Create match and automatically add creator as confirmed player
    const match = await prisma.match.create({
      data: {
        ...validatedData,
        date: matchDate,
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
                position: true,
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
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error,
      });
    }

    console.error("Create match error:", error);
    res.status(500).json({ error: "Failed to create match" });
  }
}

// Invite player to match
export async function invitePlayer(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params; // match ID
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check match exists
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        venue: true,
        players: true,
      },
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Check match is not in the past
    if (match.date < new Date()) {
      return res
        .status(400)
        .json({ error: "Cannot invite players to past matches" });
    }

    // Check user exists
    const userToInvite = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToInvite) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is already in match
    const existingPlayer = match.players.find(
      (p: { userId: string }) => p.userId === userId
    );
    if (existingPlayer) {
      return res.status(400).json({
        error: "User is already invited to this match",
        currentStatus: existingPlayer.status,
      });
    }

    // Check venue capacity
    const confirmedPlayers = match.players.filter(
      (p: { status: string }) => p.status === "confirmed"
    ).length;
    if (confirmedPlayers >= match.venue.capacity) {
      return res.status(400).json({
        error: `Match is at full capacity (${match.venue.capacity} players)`,
      });
    }

    // Add player to match
    const matchPlayer = await prisma.matchPlayer.create({
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
            position: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Player invited successfully",
      matchPlayer,
    });
  } catch (error) {
    console.error("Invite player error:", error);
    res.status(500).json({ error: "Failed to invite player" });
  }
}

// RSVP to match (confirm or decline)
export async function rsvpToMatch(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params; // match ID

    // Validate input
    const validatedData = rsvpSchema.parse(req.body);

    // Check if user is invited to this match
    const matchPlayer = await prisma.matchPlayer.findFirst({
      where: {
        matchId: id,
        userId: req.user.id,
      },
      include: {
        match: {
          include: {
            venue: true,
          },
        },
      },
    });

    if (!matchPlayer) {
      return res
        .status(404)
        .json({ error: "You are not invited to this match" });
    }

    // Check match is not in the past
    if (matchPlayer.match.date < new Date()) {
      return res.status(400).json({ error: "Cannot RSVP to past matches" });
    }

    // If confirming, check venue capacity
    if (validatedData.status === "confirmed") {
      const confirmedCount = await prisma.matchPlayer.count({
        where: {
          matchId: id,
          status: "confirmed",
        },
      });

      if (confirmedCount >= matchPlayer.match.venue.capacity) {
        return res.status(400).json({
          error: `Match is at full capacity (${matchPlayer.match.venue.capacity} players)`,
        });
      }
    }

    // Update RSVP status
    const updated = await prisma.matchPlayer.update({
      where: { id: matchPlayer.id },
      data: { status: validatedData.status },
    });

    res.json({
      message: `Successfully ${
        validatedData.status === "confirmed" ? "confirmed" : "declined"
      } match invitation`,
      matchPlayer: updated,
    });
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error,
      });
    }

    console.error("RSVP error:", error);
    res.status(500).json({ error: "Failed to update RSVP" });
  }
}

// Update match
export async function updateMatch(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    // Check match exists and user is creator
    const match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (match.createdById !== req.user.id) {
      return res.status(403).json({
        error: "Only the match creator can update the match",
      });
    }

    // Validate input
    const validatedData = matchSchema.partial().parse(req.body);

    // If updating date, ensure it's in the future
    if (validatedData.date) {
      const newDate = new Date(validatedData.date);
      if (newDate < new Date()) {
        return res
          .status(400)
          .json({ error: "Match date must be in the future" });
      }
    }

    // Update match
    const updated = await prisma.match.update({
      where: { id },
      data: validatedData.date
        ? { ...validatedData, date: new Date(validatedData.date) }
        : validatedData,
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
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error,
      });
    }

    console.error("Update match error:", error);
    res.status(500).json({ error: "Failed to update match" });
  }
}

// Cancel match
export async function cancelMatch(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    // Check match exists and user is creator
    const match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (match.createdById !== req.user.id) {
      return res.status(403).json({
        error: "Only the match creator can cancel the match",
      });
    }

    if (match.status === "cancelled") {
      return res.status(400).json({ error: "Match is already cancelled" });
    }

    // Cancel match
    const updated = await prisma.match.update({
      where: { id },
      data: { status: "cancelled" },
    });

    res.json({
      message: "Match cancelled successfully",
      match: updated,
    });
  } catch (error) {
    console.error("Cancel match error:", error);
    res.status(500).json({ error: "Failed to cancel match" });
  }
}
