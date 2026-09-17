import mongoose from "mongoose";
import dotenv from "dotenv";
import Tour from "../models/Tour.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const tour = await Tour.findOne({ slug: "the-forest-hiker" });
  const user = await User.findOne({ email: "alice@example.com" });

  console.log("Before:", {
    ratingsAverage: tour.ratingsAverage,
    ratingsQuantity: tour.ratingsQuantity,
  });

  const r = await Review.create({
    review: "Fantastic experience!",
    rating: 5,
    tour: tour._id,
    user: user._id,
    status: "approved",
  });

  const updated = await Tour.findById(tour._id);

  console.log("After create:", {
    ratingsAverage: updated.ratingsAverage,
    ratingsQuantity: updated.ratingsQuantity,
  });

  await Review.findByIdAndDelete(r._id);

  const afterDelete = await Tour.findById(tour._id);

  console.log("After delete:", {
    ratingsAverage: afterDelete.ratingsAverage,
    ratingsQuantity: afterDelete.ratingsQuantity,
  });

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
