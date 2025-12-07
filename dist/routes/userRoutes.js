"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// All routes in this file require authentication
router.use(authMiddleware_1.authenticateToken);
router.get("/me", userController_1.getCurrentUser);
router.put("/profile", userController_1.updateProfile);
router.put("/password", userController_1.changePassword);
router.delete("/account", userController_1.deleteAccount);
exports.default = router;
