import { Router } from "express";
import {
  getCurrentUser,
  updateProfile,
  deleteAccount,
  changePassword,
} from "../controllers/userController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// All routes in this file require authentication
router.use(authenticateToken);

router.get("/me", getCurrentUser);
router.put("/profile", updateProfile);
router.put("/password", changePassword);
router.delete("/account", deleteAccount);

export default router;
