import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import tourRouter from "./routes/tourRoutes.js";
import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import guideRouter from "./routes/guideRoutes.js";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

dotenv.config();

console.log("📋 Environment Configuration:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV || "development"}`);
console.log(`   PORT: ${process.env.PORT || 5000}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? "✅ Set" : "❌ Not Set"}`);

connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/guides", guideRouter);

app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.json({
    status: "OK",
    server: "running",
    database: {
      connected: dbStatus === 1,
      status: dbStatusMap[dbStatus] || "unknown",
      name: mongoose.connection.name || "Not connected",
      host: mongoose.connection.host || "Not connected",
      port: mongoose.connection.port || 27017,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: `Server is running in ${process.env.NODE_ENV || "development"} mode! 🚀`,
    database: {
      name: mongoose.connection.name || "Not connected",
      status:
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    },
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      tours: "/api/v1/tours",
      guides: "/api/v1/guides",
      health: "/api/health",
    },
    version: "1.0.0",
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📊 Database: ${mongoose.connection.name || "zuri-tours"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 Available endpoints:`);
  console.log(`   - Auth:    /api/v1/auth`);
  console.log(`   - Users:   /api/v1/users`);
  console.log(`   - Tours:   /api/v1/tours`);
  console.log(`   - Guides:  /api/v1/guides`);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  server.close(() => {
    console.error("💥 Server shutting down due to unhandled rejection");
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully...");
  server.close(() => {
    console.log("💥 Process terminated!");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT RECEIVED. Shutting down gracefully...");
  server.close(() => {
    console.log("💥 Process terminated!");
    process.exit(0);
  });
});

export default app;
