import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./utils/prisma";
import router from "./routes/authRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", router);

// Health check with database
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$connect();

    // Count users in database
    const userCount = await prisma.user.count();

    res.json({
      status: "ok",
      message: "Let's Play API is running! 🚀⚽",
      database: "connected ✅",
      users: userCount,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
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
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err.stack);
    res.status(500).json({
      error: "Something went wrong!",
      message: err.message,
    });
  }
);

// Start server
app.listen(PORT, async () => {
  console.log(`\n🚀 Server is running!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);

  // Test database connection on startup
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }

  console.log(`\n✨ Ready to accept requests!\n`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n👋 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});
