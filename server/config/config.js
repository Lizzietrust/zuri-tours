import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || "development";

if (env === "production") {
  dotenv.config({ path: path.join(__dirname, "../.env.production") });
} else if (env === "development") {
  dotenv.config({ path: path.join(__dirname, "../.env") });
} else {
  dotenv.config();
}

const requiredEnvVars = ["PORT"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);

if (missingEnvVars.length > 0) {
  console.error(
    "❌ Missing required environment variables:",
    missingEnvVars.join(", "),
  );
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
}

// Export configuration
const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 8000,
};

if (config.env === "development") {
  console.log("📋 Environment Configuration:");
  console.log(`   NODE_ENV: ${config.env}`);
  console.log(`   PORT: ${config.port}`);
}

export default config;
