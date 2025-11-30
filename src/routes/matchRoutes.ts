import { Router } from "express";
import {
  getAllMatches,
  getMatch,
  getMyMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  rsvpToMatch,
  leaveMatch,
  invitePlayerToMatch,
} from "../controllers/matchController";
import { authenticateToken } from "../middleware/authMiddleware";

const matchRoutes = Router();

// Public routes
matchRoutes.get("/", getAllMatches);
matchRoutes.get("/:id", getMatch);

// Protected routes
matchRoutes.use(authenticateToken);

matchRoutes.get("/my/matches", getMyMatches);
matchRoutes.post("/", createMatch);
matchRoutes.put("/:id", updateMatch);
matchRoutes.delete("/:id", deleteMatch);
matchRoutes.post("/:id/rsvp", rsvpToMatch);
matchRoutes.post("/:id/leave", leaveMatch);
matchRoutes.post("/:id/invite", invitePlayerToMatch);

export default matchRoutes;