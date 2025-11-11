import { Router } from "express";
import {
  getAllTournaments,
  getTournament,
  getTournamentStandings,
  createTournament,
  updateTournament,
  deleteTournament,
  inviteTeam,
  rsvpToTournament,
  removeTeam,
  createTournamentMatch,
  completeTournamentMatch,
  generateFixtures,
  recalculateStandings,
} from "../controllers/tournamentController";
import { authenticateToken } from "../middleware/authMiddleware";

const tournamentRoutes = Router();

// Public routes
tournamentRoutes.get("/", getAllTournaments);
tournamentRoutes.get("/:id", getTournament);
tournamentRoutes.get("/:id/standings", getTournamentStandings);

// Protected routes
tournamentRoutes.use(authenticateToken);

tournamentRoutes.post("/", createTournament);
tournamentRoutes.put("/:id", updateTournament);
tournamentRoutes.delete("/:id", deleteTournament);
tournamentRoutes.post("/:id/invite", inviteTeam);
tournamentRoutes.post("/:id/rsvp", rsvpToTournament);
tournamentRoutes.delete("/:id/teams/:teamId", removeTeam);

// Tournament matches
tournamentRoutes.post("/:id/matches", createTournamentMatch);
tournamentRoutes.post(
  "/:id/matches/:matchId/complete",
  completeTournamentMatch
);
tournamentRoutes.post("/:id/generate-fixtures", generateFixtures);
tournamentRoutes.post("/:id/recalculate-standings", recalculateStandings);

export default tournamentRoutes;
