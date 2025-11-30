import { Router } from "express";
import {
  getMyInvites,
  getInviteByToken,
  acceptInvite,
  declineInvite,
} from "../controllers/inviteController";
import { authenticateToken } from "../middleware/authMiddleware";

const inviteRoutes = Router();

// Todas precisam de autenticação
inviteRoutes.use(authenticateToken);

inviteRoutes.get("/my", getMyInvites);
inviteRoutes.get("/:token", getInviteByToken);
inviteRoutes.post("/:token/accept", acceptInvite);
inviteRoutes.post("/:token/decline", declineInvite);

export default inviteRoutes;
