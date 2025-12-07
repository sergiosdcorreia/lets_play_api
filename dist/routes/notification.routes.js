"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const notification_controller_1 = require("../controllers/notification.controller");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
router.get("/", notification_controller_1.getUserNotifications);
router.patch("/:id/read", notification_controller_1.markNotificationRead);
router.patch("/read-all", notification_controller_1.markAllRead);
exports.default = router;
