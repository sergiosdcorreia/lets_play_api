import { Router } from "express";
import {
  getUserAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getCommonAvailability,
} from "../controllers/availabilityController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get("/me", getUserAvailability);
router.post("/", createAvailability);
router.put("/:id", updateAvailability);
router.delete("/:id", deleteAvailability);
router.get("/common", getCommonAvailability);

export default router;
