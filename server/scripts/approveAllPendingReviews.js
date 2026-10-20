import mongoose from "mongoose";
import dotenv from "dotenv";
import Review from "../models/Review.js";
import Tour from "../models/Tour.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: false,
    });
    console.log("✅ Connected");

    await Promise.all([Review.init(), Tour.init()]);
    console.log("✅ Model indexes ready (Review + Tour)");

    const result = await Review.updateMany(
      { status: "pending" },
      {
        $set: {
          status: "approved",
          needsModeration: false,
          moderatedAt: new Date(),
          moderationNote: "Bulk approved during post-moderation migration",
        },
      },
    );

    console.log(`✅ Approved ${result.modifiedCount} pending reviews`);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("👋 Done");
  }
}

run();
