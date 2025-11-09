import { Router } from "express";
import {
  recordMatchEvent,
  getMatchEvents,
  deleteMatchEvent,
  getPlayerStatistics,
  getLeaderboard,
  getMatchStatistics,
} from "../controllers/statisticsController";
import { authenticateToken } from "../middleware/authMiddleware";

const statisticsRoutes = Router();

// Public routes
statisticsRoutes.get("/leaderboard", getLeaderboard);
statisticsRoutes.get("/player/:userId", getPlayerStatistics);
statisticsRoutes.get("/match/:id", getMatchStatistics);
statisticsRoutes.get("/match/:id/events", getMatchEvents);

// Protected routes
statisticsRoutes.use(authenticateToken);

statisticsRoutes.post("/match/:id/event", recordMatchEvent);
statisticsRoutes.delete("/event/:eventId", deleteMatchEvent);

export default statisticsRoutes;
