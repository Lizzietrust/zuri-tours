import mongoose from "mongoose"; // eslint-disable-line import/no-extraneous-dependencies

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a tour name"],
      unique: true,
      trim: true,
      maxlength: [100, "Tour name cannot be more than 100 characters"],
    },
    slug: {
      type: String,
      // unique: true,
    },
    duration: {
      type: Number,
      required: [true, "Please add duration in days"],
      min: [1, "Duration must be at least 1 day"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "Please add max group size"],
      min: [1, "Group size must be at least 1"],
    },
    difficulty: {
      type: String,
      required: [true, "Please add difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty must be easy, medium, or difficult",
      },
    },
    price: {
      type: Number,
      required: [true, "Please add price"],
      min: [0, "Price cannot be negative"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function validatePriceDiscount(val) {
          return val < this.price;
        },
        message: "Discount price ({VALUE}) should be below regular price",
      },
    },
    summary: {
      type: String,
      required: [true, "Please add a summary"],
      trim: true,
      maxlength: [200, "Summary cannot be more than 200 characters"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "Please add cover image"],
    },
    images: {
      type: [String],
    },
    startDates: {
      type: [Date],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
      set: function setRatingsAverage(val) {
        return Math.round(val * 10) / 10;
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

tourSchema.pre("save", function preSaveMiddleware(next) {
  try {
    if (this.name && !this.slug) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, "-")
        .replace(/-+/g, "-");
    }
    next();
  } catch (error) {
    next(error);
  }
});

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

const Tour = mongoose.model("Tour", tourSchema);

export default Tour;
