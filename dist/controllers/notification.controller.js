"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllRead = exports.markNotificationRead = exports.getUserNotifications = void 0;
const prisma_1 = require("../utils/prisma");
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const notifications = await prisma_1.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 50, // Limit to recent 50
        });
        const unreadCount = await prisma_1.prisma.notification.count({
            where: { userId, isRead: false },
        });
        res.json({
            notifications,
            unreadCount,
        });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};
exports.getUserNotifications = getUserNotifications;
const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const notification = await prisma_1.prisma.notification.findUnique({
            where: { id },
        });
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }
        if (notification.userId !== userId) {
            return res.status(403).json({ error: "Forbidden" });
        }
        const updated = await prisma_1.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
        res.json(updated);
    }
    catch (error) {
        console.error("Error marking notification read:", error);
        res.status(500).json({ error: "Failed to update notification" });
    }
};
exports.markNotificationRead = markNotificationRead;
const markAllRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        await prisma_1.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        res.json({ message: "All notifications marked as read" });
    }
    catch (error) {
        console.error("Error marking all read:", error);
        res.status(500).json({ error: "Failed to update notifications" });
    }
};
exports.markAllRead = markAllRead;
