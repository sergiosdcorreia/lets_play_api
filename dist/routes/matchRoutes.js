"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const matchController_1 = require("../controllers/matchController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const matchRoutes = (0, express_1.Router)();
// Public routes
matchRoutes.get("/", matchController_1.getAllMatches);
matchRoutes.get("/:id", matchController_1.getMatch);
// Protected routes
matchRoutes.use(authMiddleware_1.authenticateToken);
matchRoutes.get("/my/matches", matchController_1.getMyMatches);
matchRoutes.post("/", matchController_1.createMatch);
matchRoutes.put("/:id", matchController_1.updateMatch);
matchRoutes.delete("/:id", matchController_1.deleteMatch);
matchRoutes.post("/:id/rsvp", matchController_1.rsvpToMatch);
matchRoutes.post("/:id/leave", matchController_1.leaveMatch);
matchRoutes.post("/:id/invite", matchController_1.invitePlayerToMatch);
exports.default = matchRoutes;
