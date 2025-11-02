import { Request, Response } from "express";
import { prisma } from "../utils/prisma";

// Get current user's profile
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get full user data
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
}

// Update current user's profile
export async function updateProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { name } = req.body;

    // Validate name
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        error: "Name must be at least 2 characters",
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
}

// Delete current user's account
export async function deleteAccount(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: req.user.id },
    });

    res.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
}
