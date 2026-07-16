import express from "express";
import mongoose from "mongoose"; // eslint-disable-line import/no-extraneous-dependencies
import dotenv from "dotenv";
import cors from "cors"; // eslint-disable-line import/no-extraneous-dependencies
import tourRouter from "./routes/tourRoutes.js";
import userRouter from "./routes/userRoutes.js";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

dotenv.config();

console.log("📋 Environment Configuration:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV || "development"}`);
console.log(`   PORT: ${process.env.PORT || 5000}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI}`);

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    server: "running",
    database: {
      connected: mongoose.connection.readyState === 1,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port || 27017,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/", (req, res) => {
  res.json({
    message: `Server is running in ${process.env.NODE_ENV || "development"} mode! 🚀`,
    database: mongoose.connection.name || "Not connected",
    endpoints: {
      tours: "/api/v1/tours",
      users: "/api/v1/users",
      health: "/api/health",
    },
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
});

process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    console.error("💥 Server shutting down due to unhandled rejection");
    process.exit(1);
  });
});

process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully...");
  server.close(() => {
    console.log("💥 Process terminated!");
    process.exit(0);
  });
});

export default app;
