"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statisticsController_1 = require("../controllers/statisticsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const statisticsRoutes = (0, express_1.Router)();
// Public routes
statisticsRoutes.get("/leaderboard", statisticsController_1.getLeaderboard);
statisticsRoutes.get("/player/:userId", statisticsController_1.getPlayerStatistics);
statisticsRoutes.get("/match/:id", statisticsController_1.getMatchStatistics);
statisticsRoutes.get("/match/:id/events", statisticsController_1.getMatchEvents);
// Protected routes
statisticsRoutes.use(authMiddleware_1.authenticateToken);
statisticsRoutes.post("/match/:id/event", statisticsController_1.recordMatchEvent);
statisticsRoutes.delete("/event/:eventId", statisticsController_1.deleteMatchEvent);
exports.default = statisticsRoutes;
