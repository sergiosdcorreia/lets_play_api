import { Router } from "express";
import {
  getAllTeams,
  getTeam,
  getMyTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  invitePlayer,
  rsvpToTeam,
  leaveTeam,
  removeMember,
  getTeamMatches,
  getTeamStats,
} from "../controllers/teamController";
import { authenticateToken } from "../middleware/authMiddleware";

const teamRoutes = Router();

// Public routes
teamRoutes.get("/", getAllTeams);
teamRoutes.get("/:id", getTeam);
teamRoutes.get("/:id/matches", getTeamMatches);
teamRoutes.get("/:id/stats", getTeamStats);

// Protected routes
teamRoutes.use(authenticateToken);

teamRoutes.get("/my/teams", getMyTeams);
teamRoutes.post("/", createTeam);
teamRoutes.put("/:id", updateTeam);
teamRoutes.delete("/:id", deleteTeam);
teamRoutes.post("/:id/invite", invitePlayer);
teamRoutes.post("/:id/rsvp", rsvpToTeam);
teamRoutes.post("/:id/leave", leaveTeam);
teamRoutes.delete("/:id/members/:memberId", removeMember);

export default teamRoutes;
