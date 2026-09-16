import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Tour from "../models/Tour.js";
import User from "../models/User.js";
import Review from "../models/Review.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB = process.env.MONGO_URI;

if (!DB) {
  console.error("❌ MONGO_URI not found in .env file!");
  process.exit(1);
}

const connectDB = async () => {
  try {
    await mongoose.connect(DB);
    console.log(
      `✅ Database connected successfully to: ${mongoose.connection.name}`,
    );
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  }
};

const usersFilePath = path.join(__dirname, "../dev-data/users.json");
const toursFilePath = path.join(__dirname, "../dev-data/tours.json");
const reviewsFilePath = path.join(__dirname, "../dev-data/reviews.json");

const requiredFiles = [
  { path: usersFilePath, label: "users.json" },
  { path: toursFilePath, label: "tours.json" },
  { path: reviewsFilePath, label: "reviews.json" },
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file.path)) {
    console.error(`❌ Data file not found: ${file.path}`);
    process.exit(1);
  }
}

const readJSON = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf-8"));

const importData = async () => {
  await connectDB();

  try {
    await Review.deleteMany();
    await Tour.deleteMany();
    await User.deleteMany();
    console.log("🗑️  Cleared existing reviews, tours, and users");

    const usersData = readJSON(usersFilePath);
    const createdUsers = [];

    for (const rawUser of usersData) {
      const user = new User(rawUser);

      // eslint-disable-next-line no-await-in-loop
      await user.save();
      createdUsers.push(user);
    }
    console.log(`✅ Imported ${createdUsers.length} users`);

    const userByEmail = new Map();

    createdUsers.forEach((u) =>
      userByEmail.set(String(u.email).toLowerCase(), u._id),
    );

    const toursData = readJSON(toursFilePath);

    const normalizedTours = toursData.map((tour, i) => {
      const creatorEmail = String(tour.createdByEmail || "").toLowerCase();
      const createdBy = userByEmail.get(creatorEmail);

      if (!createdBy) {
        throw new Error(
          `Tour #${i} ("${tour.name}") references unknown createdByEmail: ${tour.createdByEmail}`,
        );
      }
      if (!tour.location || !Array.isArray(tour.location.coordinates)) {
        throw new Error(
          `Tour #${i} ("${tour.name}") is missing location.coordinates`,
        );
      }

      const { createdByEmail: _createdByEmail, _id, id: _id2, ...rest } = tour;

      return {
        ...rest,
        createdBy,
        startDates: (tour.startDates || []).map((d) => new Date(d)),
        location: {
          ...tour.location,
          type: tour.location.type || "Point",
        },
      };
    });

    const createdTours = await Tour.create(normalizedTours);

    console.log(`✅ Imported ${createdTours.length} tours`);

    const tourBySlug = new Map();

    createdTours.forEach((t) => tourBySlug.set(t.slug, t._id));

    const reviewsData = readJSON(reviewsFilePath);

    const remappedReviews = reviewsData.map((review, i) => {
      const user = userByEmail.get(
        String(review.userEmail || "").toLowerCase(),
      );
      const tour = tourBySlug.get(review.tourSlug);

      if (!user) {
        throw new Error(
          `Review #${i} references unknown userEmail: ${review.userEmail}`,
        );
      }
      if (!tour) {
        throw new Error(
          `Review #${i} references unknown tourSlug: ${review.tourSlug}`,
        );
      }

      return {
        review: review.review,
        rating: review.rating,
        user,
        tour,
        status: "approved",
      };
    });

    const createdReviews = await Review.create(remappedReviews);

    console.log(`✅ Imported ${createdReviews.length} reviews`);

    const [u, t, r] = await Promise.all([
      User.countDocuments(),
      Tour.countDocuments(),
      Review.countDocuments(),
    ]);

    console.log(`\n📊 Counts → users: ${u}, tours: ${t}, reviews: ${r}`);
    console.log("🎉 All data imported successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error importing data:", error.message);
    if (error.errors) {
      Object.values(error.errors).forEach((e) =>
        console.error(`   → ${e.path}: ${e.message}`),
      );
    }
    if (error.name === "ValidationError") {
      console.error("   Validation details:", error.message);
    }
    process.exit(1);
  }
};

const deleteData = async () => {
  await connectDB();
  try {
    await Review.deleteMany();
    await Tour.deleteMany();
    await User.deleteMany();
    console.log("🗑️  All reviews, tours, and users deleted successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error deleting data:", error.message);
    process.exit(1);
  }
};

const args = process.argv.slice(2);

if (args.includes("--delete") || args.includes("-d")) {
  console.log("🗑️  Deleting all data...");
  deleteData();
} else if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage:
  npm run import-data              # Import users, tours, and reviews
  npm run import-data -- --delete  # Delete all data
  npm run import-data -- --help    # Show this help
  `);
  process.exit(0);
} else {
  console.log("📥 Starting data import...");
  importData();
}
