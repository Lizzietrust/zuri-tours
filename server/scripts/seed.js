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

console.log(`📊 Target database: ${DB.split("/").pop() || "zuri-tours"}`);

class DataSeeder {
  constructor() {
    this.dbConnection = null;
    this.isProduction = process.env.NODE_ENV === "production";
  }

  async connectDB() {
    if (this.isProduction && DB.includes("production")) {
      console.error(
        "❌ Cannot import development data into production database!",
      );
      process.exit(1);
    }

    try {
      this.dbConnection = await mongoose.connect(DB);
      console.log(`✅ Connected to database: ${mongoose.connection.name}`);

      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();

      console.log(
        `📁 Collections in database:`,
        collections.map((c) => c.name).join(", ") || "none",
      );
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      process.exit(1);
    }
  }

  static generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, "-")
      .replace(/-+/g, "-");
  }

  // eslint-disable-next-line class-methods-use-this
  async importData() {
    try {
      const possiblePaths = [
        path.join(__dirname, "../dev-data/tours.json"),
        path.join(__dirname, "../data/tours.json"),
        path.join(__dirname, "../tours.json"),
      ];

      let toursData = null;

      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          console.log(`📄 Found data file: ${path.basename(filePath)}`);
          try {
            toursData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            break;
          } catch (e) {
            console.warn(`⚠️  Could not parse JSON from ${filePath}`);
          }
        }
      }

      if (!toursData) {
        console.error("❌ No valid data file found.");
        console.log("Please create a data file at: server/dev-data/tours.json");
        process.exit(1);
      }

      if (!Array.isArray(toursData) || toursData.length === 0) {
        throw new Error("Data file must contain a non-empty array of tours");
      }

      console.log(`📊 Found ${toursData.length} tours in data file`);

      const count = await Tour.countDocuments();

      if (count > 0) {
        console.log(`⚠️  Database already has ${count} tours`);
        const confirm =
          process.argv.includes("--force") || process.argv.includes("-f");

        if (!confirm) {
          console.log("\n🛑 Use --force or -f flag to overwrite existing data");
          console.log("   Example: npm run seed -- --force");
          process.exit(0);
        }

        console.log("🗑️  Clearing existing data...");
        await Tour.deleteMany();
      }

      const processedData = toursData.map((tour) => {
        if (!tour.slug && tour.name) {
          tour.slug = DataSeeder.generateSlug(tour.name);
          console.log(`🔗 Generated slug for "${tour.name}": ${tour.slug}`);
        }

        return tour;
      });

      const inserted = await Tour.insertMany(processedData, {
        validateBeforeSave: true,
        ordered: false,
      });

      console.log(`\n✅ Successfully imported ${inserted.length} tours!`);

      const summary = {
        total: inserted.length,
        difficulties: {},
        priceRange: { min: Infinity, max: -Infinity },
        slugs: [],
      };

      inserted.forEach((tour) => {
        summary.difficulties[tour.difficulty] =
          (summary.difficulties[tour.difficulty] || 0) + 1;
        if (tour.price < summary.priceRange.min)
          summary.priceRange.min = tour.price;
        if (tour.price > summary.priceRange.max)
          summary.priceRange.max = tour.price;
        summary.slugs.push(tour.slug);
      });

      console.log("\n📊 Import Summary:");
      console.log(`   Database: ${mongoose.connection.name}`);
      console.log(`   Total Tours: ${summary.total}`);
      console.log(`   Difficulties:`, summary.difficulties);
      console.log(
        `   Price Range: $${summary.priceRange.min} - $${summary.priceRange.max}`,
      );
      console.log(`   Slugs: ${summary.slugs.join(", ")}`);

      if (inserted.length > 0) {
        console.log("\n📝 Sample Tour:");
        const sample = inserted[0];

        console.log(`   Name: ${sample.name}`);
        console.log(`   Slug: ${sample.slug}`);
        console.log(`   Price: $${sample.price}`);
        console.log(`   Difficulty: ${sample.difficulty}`);
        console.log(`   Duration: ${sample.duration} days`);
      }
    } catch (error) {
      console.error("❌ Import failed:", error.message);
      if (error.errors) {
        console.error("Validation errors:", error.errors);
      }
      process.exit(1);
    }
  }

  static async deleteData() {
    try {
      const result = await Tour.deleteMany();

      console.log(
        `🗑️  Deleted ${result.deletedCount} tours from ${mongoose.connection.name}`,
      );
    } catch (error) {
      console.error("❌ Delete failed:", error.message);
      process.exit(1);
    }
  }

  async closeConnection() {
    if (this.dbConnection) {
      await mongoose.connection.close();
      console.log("🔌 Database connection closed");
    }
  }

  async run() {
    await this.connectDB();

    const args = process.argv.slice(2);

    try {
      if (args.includes("--delete") || args.includes("-d")) {
        await DataSeeder.deleteData();
      } else if (args.includes("--list") || args.includes("-l")) {
        const tours = await Tour.find()
          .select("name price difficulty slug")
          .lean();

        console.log(`\n📋 Current tours in ${mongoose.connection.name}:`);
        tours.forEach((tour, i) => {
          console.log(
            `   ${i + 1}. ${tour.name} (slug: ${tour.slug}) - $${tour.price}, ${tour.difficulty}`,
          );
        });
        console.log(`\nTotal: ${tours.length} tours`);
      } else {
        await this.importData();
      }
    } catch (error) {
      console.error("❌ Operation failed:", error.message);
    } finally {
      await this.closeConnection();
      process.exit(0);
    }
  }
}

const seeder = new DataSeeder();

seeder.run();
