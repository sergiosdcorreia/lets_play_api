"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teamController_1 = require("../controllers/teamController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const teamRoutes = (0, express_1.Router)();
// Public routes
teamRoutes.get("/", teamController_1.getAllTeams);
teamRoutes.get("/:id", teamController_1.getTeam);
teamRoutes.get("/:id/matches", teamController_1.getTeamMatches);
teamRoutes.get("/:id/stats", teamController_1.getTeamStats);
// Protected routes
teamRoutes.use(authMiddleware_1.authenticateToken);
teamRoutes.get("/my/teams", teamController_1.getMyTeams);
teamRoutes.post("/", teamController_1.createTeam);
teamRoutes.put("/:id", teamController_1.updateTeam);
teamRoutes.delete("/:id", teamController_1.deleteTeam);
teamRoutes.post("/:id/invite", teamController_1.invitePlayer);
teamRoutes.post("/:id/rsvp", teamController_1.rsvpToTeam);
teamRoutes.post("/:id/leave", teamController_1.leaveTeam);
teamRoutes.delete("/:id/members/:memberId", teamController_1.removeMember);
exports.default = teamRoutes;
