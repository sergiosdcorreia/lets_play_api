"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = getCurrentUser;
exports.updateProfile = updateProfile;
exports.deleteAccount = deleteAccount;
exports.changePassword = changePassword;
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../utils/auth");
const validation_1 = require("../utils/validation");
// Get current user's profile
async function getCurrentUser(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        // Get full user data
        const user = await prisma_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ error: "Failed to get user" });
    }
}
// Update current user's profile
async function updateProfile(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        // Validate input
        const validatedData = validation_1.userUpdateSchema.parse(req.body);
        // Update user
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: req.user.id },
            data: validatedData,
            select: {
                id: true,
                email: true,
                name: true,
                position: true,
                skillLevel: true,
                updatedAt: true,
            },
        });
        res.json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
}
// Delete current user's account
async function deleteAccount(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        // Delete user
        await prisma_1.prisma.user.delete({
            where: { id: req.user.id },
        });
        res.json({
            message: "Account deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ error: "Failed to delete account" });
    }
}
// Change password
async function changePassword(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        // Validate input
        const validatedData = validation_1.changePasswordSchema.parse(req.body);
        // Get user with password
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Verify current password
        const isPasswordValid = await (0, auth_1.comparePassword)(validatedData.currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid current password" });
        }
        // Hash new password
        const hashedPassword = await (0, auth_1.hashPassword)(validatedData.newPassword);
        // Update password
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        res.json({ message: "Password changed successfully" });
    }
    catch (error) {
        if (error instanceof Error && "issues" in error) {
            return res.status(400).json({
                error: "Validation failed",
                details: error,
            });
        }
        console.error("Change password error:", error);
        res.status(500).json({ error: "Failed to change password" });
    }
}
