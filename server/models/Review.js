import mongoose from "mongoose"; // eslint-disable-line import/no-extraneous-dependencies
import Tour from "./Tour.js";

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Please add a review"],
      trim: true,
      maxlength: [500, "Review cannot be more than 500 characters"],
    },
    rating: {
      type: Number,
      required: [true, "Please add a rating"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.statics.calcAverageRatings = async function calcAverageRatings(
  tourId,
) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post("save", function handleSavePost() {
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function handleFindOneAndPost(doc) {
  await doc.constructor.calcAverageRatings(doc.tour);
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
