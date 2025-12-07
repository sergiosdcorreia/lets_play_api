"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inviteController_1 = require("../controllers/inviteController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const inviteRoutes = (0, express_1.Router)();
// Todas precisam de autenticação
inviteRoutes.use(authMiddleware_1.authenticateToken);
inviteRoutes.get("/my", inviteController_1.getMyInvites);
inviteRoutes.get("/:token", inviteController_1.getInviteByToken);
inviteRoutes.post("/:token/accept", inviteController_1.acceptInvite);
inviteRoutes.post("/:token/decline", inviteController_1.declineInvite);
exports.default = inviteRoutes;
