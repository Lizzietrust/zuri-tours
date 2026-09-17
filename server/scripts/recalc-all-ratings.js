import mongoose from "mongoose";
import dotenv from "dotenv";
import Tour from "../models/Tour.js";
import Review from "../models/Review.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const tours = await Tour.find({}, { _id: 1, name: 1 });

  console.log(`🔄 Recalculating ratings for ${tours.length} tours...`);

  for (const tour of tours) {
    // eslint-disable-next-line no-await-in-loop
    const stat = await Review.calcAverageRatings(tour._id);

    console.log(
      `   ${tour.name}: ${stat ? `${stat.nRating} reviews, avg ${stat.avgRating.toFixed(2)}` : "no approved reviews"}`,
    );
  }

  console.log("🎉 Done!");
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
