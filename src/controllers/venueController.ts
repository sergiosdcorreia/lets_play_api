import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { venueSchema } from "../utils/validation";
import { getWeatherForecast, getWeatherAdvice } from "../utils/weather";

// Get all venues
export async function getAllVenues(req: Request, res: Response) {
  try {
    const venues = await prisma.venue.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { matches: true },
        },
      },
    });

    res.json({ venues });
  } catch (error) {
    console.error("Get venues error:", error);
    res.status(500).json({ error: "Failed to get venues" });
  }
}

// Get single venue
export async function getVenue(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const venue = await prisma.venue.findUnique({
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
  } catch (error) {
    console.error("Get venue error:", error);
    res.status(500).json({ error: "Failed to get venue" });
  }
}

// Create venue (admin only - for now, any authenticated user)
export async function createVenue(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Validate input
    const validatedData = venueSchema.parse(req.body);

    // Create venue
    const venue = await prisma.venue.create({
      data: validatedData,
    });

    res.status(201).json({
      message: "Venue created successfully",
      venue,
    });
  } catch (error) {
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
export async function updateVenue(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    // Check venue exists
    const existing = await prisma.venue.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // Validate input
    const validatedData = venueSchema.partial().parse(req.body);

    // Update venue
    const venue = await prisma.venue.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      message: "Venue updated successfully",
      venue,
    });
  } catch (error) {
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
export async function deleteVenue(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.params;

    // Check if venue has future matches
    const futureMatches = await prisma.match.count({
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
    await prisma.venue.delete({
      where: { id },
    });

    res.json({ message: "Venue deleted successfully" });
  } catch (error) {
    console.error("Delete venue error:", error);
    res.status(500).json({ error: "Failed to delete venue" });
  }
}

export async function getVenueWeather(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res
        .status(400)
        .json({ error: "Date query parameter is required (ISO format)" });
    }

    const venue = await prisma.venue.findUnique({
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

    const matchDate = new Date(date as string);
    if (isNaN(matchDate.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Use ISO 8601" });
    }

    const weatherResult = await getWeatherForecast(
      venue.latitude,
      venue.longitude,
      matchDate
    );

    if (!weatherResult.success) {
      return res.status(400).json({
        error: weatherResult.error,
      });
    }

    const weatherWithAdvice = {
      ...weatherResult.weather,
      advice: getWeatherAdvice(weatherResult.weather!),
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
  } catch (error) {
    console.error("Get venue weather error:", error);
    res.status(500).json({ error: "Failed to get weather forecast" });
  }
}
