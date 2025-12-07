"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tournamentController_1 = require("../controllers/tournamentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const tournamentRoutes = (0, express_1.Router)();
// Public routes
tournamentRoutes.get("/", tournamentController_1.getAllTournaments);
tournamentRoutes.get("/:id", tournamentController_1.getTournament);
tournamentRoutes.get("/:id/standings", tournamentController_1.getTournamentStandings);
// Protected routes
tournamentRoutes.use(authMiddleware_1.authenticateToken);
tournamentRoutes.post("/", tournamentController_1.createTournament);
tournamentRoutes.put("/:id", tournamentController_1.updateTournament);
tournamentRoutes.delete("/:id", tournamentController_1.deleteTournament);
tournamentRoutes.post("/:id/invite", tournamentController_1.inviteTeam);
tournamentRoutes.post("/:id/rsvp", tournamentController_1.rsvpToTournament);
tournamentRoutes.delete("/:id/teams/:teamId", tournamentController_1.removeTeam);
// Tournament matches
tournamentRoutes.post("/:id/matches", tournamentController_1.createTournamentMatch);
tournamentRoutes.post("/:id/matches/:matchId/complete", tournamentController_1.completeTournamentMatch);
tournamentRoutes.post("/:id/generate-fixtures", tournamentController_1.generateFixtures);
tournamentRoutes.post("/:id/recalculate-standings", tournamentController_1.recalculateStandings);
exports.default = tournamentRoutes;
