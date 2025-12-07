"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const availabilityController_1 = require("../controllers/availabilityController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authMiddleware_1.authenticateToken);
router.get("/me", availabilityController_1.getUserAvailability);
router.post("/", availabilityController_1.createAvailability);
router.put("/:id", availabilityController_1.updateAvailability);
router.delete("/:id", availabilityController_1.deleteAvailability);
router.get("/common", availabilityController_1.getCommonAvailability);
exports.default = router;
