import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";

import tourRouter from "../routes/tourRoutes.js";
import reviewRouter from "../routes/reviewRoutes.js";
import userRouter from "../routes/userRoutes.js";
import authRouter from "../routes/authRoutes.js";

import {
  generalLimiter,
  apiLimiter,
} from "../middleware/rateLimitMiddleware.js";
import { securityHeaders } from "../middleware/securityHeaders.js";
// import { errorHandler, notFound } from "../middleware/errorHandler.js";
import { AppError } from "../utils/appError.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/tourDB";
const NODE_ENV = process.env.NODE_ENV || "development";
const API_VERSION = "/api/v1";

console.log("📋 Environment Configuration:");
console.log(`   NODE_ENV: ${NODE_ENV}`);
console.log(`   PORT: ${PORT}`);
console.log(`   MONGO_URI: ${MONGODB_URI ? "✅ Set" : "❌ Not Set"}`);
console.log(
  `   CLIENT_URL: ${process.env.CLIENT_URL ? "✅ Set" : "❌ Not Set"}`,
);

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`✅ Connected to MongoDB: ${mongoose.connection.name}`);
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Port: ${mongoose.connection.port}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("   Please check your MongoDB connection string");
    process.exit(1);
  });

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

if (NODE_ENV === "production") {
  corsOptions.origin = process.env.CLIENT_URL || false;
}

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(compression());

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use(xss());

app.use(mongoSanitize());

app.use(
  hpp({
    whitelist: [
      "sort",
      "limit",
      "page",
      "fields",
      "price",
      "rating",
      "duration",
      "difficulty",
      "category",
    ],
  }),
);

app.use("/api", apiLimiter || generalLimiter);

if (NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
    next();
  });
}

app.use(`${API_VERSION}/auth`, authRouter);

app.use(`${API_VERSION}/tours`, tourRouter);

app.use(`${API_VERSION}/reviews`, reviewRouter);

app.use(`${API_VERSION}/users`, userRouter);

app.get("/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.status(200).json({
    status: "success",
    message: "Server is healthy",
    server: "running",
    security: {
      helmet: true,
      cors: process.env.CLIENT_URL ? "configured" : "all origins",
      rateLimiting: true,
      sanitization: {
        xss: true,
        mongoSanitize: true,
      },
      parameterPollutionProtection: true,
    },
    database: {
      connected: dbStatus === 1,
      status: dbStatusMap[dbStatus] || "unknown",
      name: mongoose.connection.name || "Not connected",
      host: mongoose.connection.host || "Not connected",
      port: mongoose.connection.port || 27017,
    },
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: `Server is running in ${NODE_ENV} mode! 🚀`,
    security: {
      helmet: "Active ✅",
      cors: process.env.CLIENT_URL ? "Restricted" : "All origins (development)",
      rateLimiting: "Active (100 requests/15min)",
      sanitization: {
        xssProtection: "Active ✅",
        noSqlInjectionProtection: "Active ✅",
      },
      parameterPollutionProtection: "Active ✅",
    },
    database: {
      name: mongoose.connection.name || "Not connected",
      status:
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    },
    endpoints: {
      auth: `${API_VERSION}/auth`,
      users: `${API_VERSION}/users`,
      tours: `${API_VERSION}/tours`,
      reviews: `${API_VERSION}/reviews`,
      health: "/health",
    },
    rateLimiting: {
      enabled: true,
      globalLimit: "100 requests per 15 minutes",
      description: "Rate limiting is active on all API endpoints",
    },
    version: "1.0.0",
  });
});

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use((err, req, res) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (NODE_ENV === "development") {
    console.error("❌ Error:", err);

    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  let error = { ...err };

  error.message = err.message;

  if (err.name === "CastError") {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];

    error = new AppError(
      `Duplicate field value: ${field}. Please use another value`,
      400,
    );
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);

    error = new AppError(messages.join(". "), 400);
  }

  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please log in again.", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Your token has expired. Please log in again.", 401);
  }

  res.status(error.statusCode || 500).json({
    status: error.status || "error",
    message: error.message || "Something went wrong",
  });
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${NODE_ENV}`);
  console.log(`🛡️ Security Headers: Active (Helmet.js)`);
  console.log(`🛡️ Rate Limiting: Active (100 requests/15min)`);
  console.log(`🛡️ XSS Protection: Active (xss-clean)`);
  console.log(`🛡️ NoSQL Injection Protection: Active (mongo-sanitize)`);
  console.log(`🛡️ Parameter Pollution Protection: Active (hpp)`);
  console.log(`📊 Database: ${mongoose.connection.name || "tourDB"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}${API_VERSION}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   - Auth:    ${API_VERSION}/auth`);
  console.log(`   - Users:   ${API_VERSION}/users`);
  console.log(`   - Tours:   ${API_VERSION}/tours`);
  console.log(`   - Reviews: ${API_VERSION}/reviews`);
  console.log(`   - Health:  /health`);
});

const shutdown = () => {
  console.log("\n🛑 Shutting down server...");
  server.close(() => {
    console.log("💤 Server closed");
    mongoose.connection.close(false, () => {
      console.log("📦 MongoDB connection closed");
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error("⚠️ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully...");
  shutdown();
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT RECEIVED. Shutting down gracefully...");
  shutdown();
});

process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION! 💥");
  console.error(err.name, err.message);
  console.error(err.stack);
  shutdown();
});

process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! 💥");
  console.error(err.name, err.message);
  console.error(err.stack);
  shutdown();
});

export default app;
