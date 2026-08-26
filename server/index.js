import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import tourRouter from "./routes/tourRoutes.js";
import userRouter from "./routes/userRoutes.js";
import authRouter from "./routes/authRoutes.js";
import guideRouter from "./routes/guideRoutes.js";
import emailRouter from "./routes/emailRoutes.js";
import connectDB from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimitMiddleware.js";
import { securityHeaders } from "./middleware/securityHeaders.js";

dotenv.config();

console.log("📋 Environment Configuration:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV || "development"}`);
console.log(`   PORT: ${process.env.PORT || 5000}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? "✅ Set" : "❌ Not Set"}`);
console.log(
  `   EMAIL_HOST: ${process.env.EMAIL_HOST ? "✅ Set" : "❌ Not Set"}`,
);
console.log(
  `   EMAIL_USERNAME: ${process.env.EMAIL_USERNAME ? "✅ Set" : "❌ Not Set"}`,
);

connectDB();

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        frameSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "https:", "'unsafe-inline'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

app.use(securityHeaders);

app.use("/api", apiLimiter);

const corsOptions = {
  origin: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
    : "*",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Allow-Headers",
    "Access-Control-Request-Headers",
    "Access-Control-Request-Method",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400,
};

if (process.env.NODE_ENV === "production") {
  corsOptions.origin = process.env.CLIENT_URL || false;
}

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
    next();
  });
}

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/guides", guideRouter);
app.use("/api/v1/email", emailRouter);

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
    security: {
      helmet: true,
      cors: process.env.CLIENT_URL ? "configured" : "all origins",
      rateLimiting: true,
    },
    database: {
      connected: dbStatus === 1,
      status: dbStatusMap[dbStatus] || "unknown",
      name: mongoose.connection.name || "Not connected",
      host: mongoose.connection.host || "Not connected",
      port: mongoose.connection.port || 27017,
    },
    email: {
      configured: !!process.env.EMAIL_HOST && !!process.env.EMAIL_USERNAME,
      service: process.env.NODE_ENV === "production" ? "SendGrid" : "Mailtrap",
      host: process.env.EMAIL_HOST || "Not configured",
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: `Server is running in ${process.env.NODE_ENV || "development"} mode! 🚀`,
    security: {
      helmet: "Active ✅",
      cors: process.env.CLIENT_URL ? "Restricted" : "All origins (development)",
      rateLimiting: "Active (100 requests/15min)",
      headers: [
        "Content-Security-Policy",
        "X-Frame-Options",
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "Strict-Transport-Security",
      ],
    },
    database: {
      name: mongoose.connection.name || "Not connected",
      status:
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    },
    email: {
      configured: !!process.env.EMAIL_HOST && !!process.env.EMAIL_USERNAME,
      service: process.env.NODE_ENV === "production" ? "SendGrid" : "Mailtrap",
    },
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      tours: "/api/v1/tours",
      guides: "/api/v1/guides",
      email: "/api/v1/email",
      health: "/api/health",
    },
    rateLimiting: {
      enabled: true,
      globalLimit: "100 requests per 15 minutes",
      description: "Rate limiting is active on all API endpoints",
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
  console.log(`🛡️ Security Headers: Active (Helmet.js)`);
  console.log(`🛡️ Rate Limiting: Active (100 requests/15min)`);
  console.log(`📊 Database: ${mongoose.connection.name || "zuri-tours"}`);
  console.log(
    `📧 Email Service: ${process.env.NODE_ENV === "production" ? "SendGrid" : "Mailtrap"}`,
  );
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 Available endpoints:`);
  console.log(`   - Auth:    /api/v1/auth`);
  console.log(`   - Users:   /api/v1/users`);
  console.log(`   - Tours:   /api/v1/tours`);
  console.log(`   - Guides:  /api/v1/guides`);
  console.log(`   - Email:   /api/v1/email`);
  console.log(
    `\n📧 Email Test: POST http://localhost:${PORT}/api/v1/email/test`,
  );
  console.log(`   Body: { "email": "your-email@example.com" }`);
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
