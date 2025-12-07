"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const venueController_1 = require("../controllers/venueController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const venueRoutes = (0, express_1.Router)();
// Public routes
venueRoutes.get("/", venueController_1.getAllVenues);
venueRoutes.get("/:id", venueController_1.getVenue);
venueRoutes.get("/:id/weather", venueController_1.getVenueWeather);
// Protected routes
venueRoutes.post("/", authMiddleware_1.authenticateToken, venueController_1.createVenue);
venueRoutes.put("/:id", authMiddleware_1.authenticateToken, venueController_1.updateVenue);
venueRoutes.delete("/:id", authMiddleware_1.authenticateToken, venueController_1.deleteVenue);
exports.default = venueRoutes;
