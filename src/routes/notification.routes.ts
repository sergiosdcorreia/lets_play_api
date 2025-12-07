import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  getUserNotifications,
  markNotificationRead,
  markAllRead,
} from "../controllers/notification.controller";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getUserNotifications);
router.patch("/:id/read", markNotificationRead);
router.patch("/read-all", markAllRead);

export default router;
