import { Router } from "express";
import {
  getAllMatches,
  getMatch,
  getMyMatches,
  createMatch,
  invitePlayer,
  rsvpToMatch,
  updateMatch,
  cancelMatch,
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
matchRoutes.post("/:id/invite", invitePlayer);
matchRoutes.post("/:id/rsvp", rsvpToMatch);
matchRoutes.put("/:id", updateMatch);
matchRoutes.delete("/:id", cancelMatch);

export default matchRoutes;
