"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("./utils/prisma");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const availabilityRoutes_1 = __importDefault(require("./routes/availabilityRoutes"));
const venueRoutes_1 = __importDefault(require("./routes/venueRoutes"));
const matchRoutes_1 = __importDefault(require("./routes/matchRoutes"));
const statisticsRoutes_1 = __importDefault(require("./routes/statisticsRoutes"));
const teamRoutes_1 = __importDefault(require("./routes/teamRoutes"));
const tournamentRoutes_1 = __importDefault(require("./routes/tournamentRoutes"));
const inviteRoutes_1 = __importDefault(require("./routes/inviteRoutes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use("/api/auth", authRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/availability", availabilityRoutes_1.default);
app.use("/api/venues", venueRoutes_1.default);
app.use("/api/matches", matchRoutes_1.default);
app.use("/api/statistics", statisticsRoutes_1.default);
app.use("/api/teams", teamRoutes_1.default);
app.use("/api/invites", inviteRoutes_1.default);
app.use("/api/tournaments", tournamentRoutes_1.default);
app.use("/api/notifications", notification_routes_1.default);
// Health check with database
app.get("/api/health", async (req, res) => {
    try {
        // Test database connection
        await prisma_1.prisma.$connect();
        // Count users in database
        const userCount = await prisma_1.prisma.user.count();
        res.json({
            status: "ok",
            message: "Let's Play API is running! 🚀⚽",
            database: "connected ✅",
            users: userCount,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || "development",
        });
    }
    catch (error) {
        res.status(500).json({
            status: "error",
            message: "Database connection failed ❌",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
        path: req.path,
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error("Error:", err.stack);
    res.status(500).json({
        error: "Something went wrong!",
        message: err.message,
    });
});
// Start server
app.listen(PORT, async () => {
    console.log(`\n🚀 Server is running!`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
    // Test database connection on startup
    try {
        await prisma_1.prisma.$connect();
        console.log("✅ Database connected successfully!");
    }
    catch (error) {
        console.error("❌ Database connection failed:", error);
    }
    console.log(`\n✨ Ready to accept requests!\n`);
});
// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\n👋 Shutting down gracefully...");
    await prisma_1.prisma.$disconnect();
    process.exit(0);
});
