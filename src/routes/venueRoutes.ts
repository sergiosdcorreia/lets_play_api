import { Router } from "express";
import {
  getAllVenues,
  getVenue,
  createVenue,
  updateVenue,
  deleteVenue,
} from "../controllers/venueController";
import { authenticateToken } from "../middleware/authMiddleware";

const venueRoutes = Router();

// Public routes
venueRoutes.get("/", getAllVenues);
venueRoutes.get("/:id", getVenue);

// Protected routes
venueRoutes.post("/", authenticateToken, createVenue);
venueRoutes.put("/:id", authenticateToken, updateVenue);
venueRoutes.delete("/:id", authenticateToken, deleteVenue);

export default venueRoutes;
