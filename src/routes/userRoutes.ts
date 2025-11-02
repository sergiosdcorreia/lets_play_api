import { Router } from "express";
import {
  getCurrentUser,
  updateProfile,
  deleteAccount,
} from "../controllers/userController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// All routes in this file require authentication
router.use(authenticateToken);

router.get("/me", getCurrentUser);
router.put("/profile", updateProfile);
router.delete("/account", deleteAccount);

export default router;
