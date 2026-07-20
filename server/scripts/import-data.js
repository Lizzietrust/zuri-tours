import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Tour from "../models/Tour.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB = process.env.MONGO_URI;

if (!DB) {
  console.error("❌ MONGO_URI not found in .env file!");
  process.exit(1);
}

mongoose
  .connect(DB)
  .then(() => {
    console.log(
      `✅ Database connected successfully to: ${mongoose.connection.name}`,
    );
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  });

const toursFilePath = path.join(__dirname, "../dev-data/tours.json");

if (!fs.existsSync(toursFilePath)) {
  console.error(`❌ Data file not found: ${toursFilePath}`);
  console.log("Please create the file at: server/dev-data/tours.json");
  process.exit(1);
}

const toursData = JSON.parse(fs.readFileSync(toursFilePath, "utf-8"));

const importData = async () => {
  try {
    const count = await Tour.countDocuments();

    if (count > 0) {
      console.log(`⚠️  Database already has ${count} tours.`);
      console.log("🔄 Overwriting existing data...");
      await Tour.deleteMany();
      console.log("🗑️  Cleared existing tours");
    }

    await Tour.create(toursData, { validateBeforeSave: true });
    console.log(`✅ Successfully imported ${toursData.length} tours!`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error importing data:", error.message);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log("🗑️  All tours deleted successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error deleting data:", error.message);
    process.exit(1);
  }
};

const args = process.argv.slice(2);

if (args.includes("--delete") || args.includes("-d")) {
  console.log("🗑️  Deleting all tours...");
  deleteData();
} else if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage:
  npm run import-data           # Import data into database
  npm run import-data -- --delete  # Delete all data
  npm run import-data -- --help    # Show this help
  `);
  process.exit(0);
} else {
  console.log("📥 Starting data import...");
  importData();
}
