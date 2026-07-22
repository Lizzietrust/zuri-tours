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

tourSchema.virtual("durationHours").get(function getDurationHours() {
  return this.duration * 24;
});

tourSchema.virtual("durationWeeks").get(function getDurationWeeks() {
  return Math.round((this.duration / 7) * 10) / 10;
});

tourSchema.virtual("durationFormatted").get(function getDurationFormatted() {
  if (this.duration < 7) {
    return `${this.duration} day${this.duration > 1 ? "s" : ""}`;
  }
  const weeks = Math.round((this.duration / 7) * 10) / 10;

  return `${weeks} week${weeks > 1 ? "s" : ""}`;
});

tourSchema.virtual("durationBreakdown").get(function getDurationBreakdown() {
  const weeks = Math.floor(this.duration / 7);
  const days = this.duration % 7;

  if (weeks === 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  }
  if (days === 0) {
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  }

  return `${weeks} week${weeks > 1 ? "s" : ""} and ${days} day${days > 1 ? "s" : ""}`;
});

tourSchema.virtual("pricePerDay").get(function getPricePerDay() {
  return Math.round(this.price / this.duration);
});

tourSchema.virtual("discountPercentage").get(function getDiscountPercentage() {
  if (!this.priceDiscount || this.priceDiscount === 0) return 0;

  return Math.round(((this.price - this.priceDiscount) / this.price) * 100);
});

tourSchema.virtual("finalPrice").get(function getFinalPrice() {
  return this.priceDiscount || this.price;
});

tourSchema.virtual("isOnSale").get(function getIsOnSale() {
  return !!(this.priceDiscount && this.priceDiscount > 0);
});

tourSchema.virtual("ratingStatus").get(function getRatingStatus() {
  const rating = this.ratingsAverage;

  if (rating >= 4.7) return "Excellent ⭐⭐⭐⭐⭐";
  if (rating >= 4.3) return "Very Good ⭐⭐⭐⭐";
  if (rating >= 3.8) return "Good ⭐⭐⭐";
  if (rating >= 3.0) return "Average ⭐⭐";

  return "Below Average ⭐";
});

tourSchema.virtual("reviewCount").get(function getReviewCount() {
  return this.reviews ? this.reviews.length : 0;
});

tourSchema.virtual("computedRating").get(function getComputedRating() {
  if (!this.reviews || this.reviews.length === 0) return 0;
  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);

  return Math.round((total / this.reviews.length) * 10) / 10;
});

tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

tourSchema.virtual("upcomingStartDates").get(function getUpcomingStartDates() {
  if (!this.startDates || this.startDates.length === 0) return [];
  const now = new Date();

  return this.startDates.filter((date) => date >= now).sort((a, b) => a - b);
});

tourSchema.virtual("pastStartDates").get(function getPastStartDates() {
  if (!this.startDates || this.startDates.length === 0) return [];
  const now = new Date();

  return this.startDates.filter((date) => date < now).sort((a, b) => b - a);
});

tourSchema.virtual("nextStartDate").get(function getNextStartDate() {
  const upcoming = this.upcomingStartDates;

  return upcoming.length > 0 ? upcoming[0] : null;
});

tourSchema.virtual("isFullyBooked").get(function getIsFullyBooked() {
  return false;
});

tourSchema.virtual("availabilityStatus").get(function getAvailabilityStatus() {
  if (!this.startDates || this.startDates.length === 0) {
    return "No dates available";
  }
  const upcoming = this.upcomingStartDates;

  if (upcoming.length === 0) {
    return "No upcoming dates";
  }
  if (upcoming.length <= 2) {
    return "Limited availability";
  }

  return "Available";
});

tourSchema.virtual("difficultyLevel").get(function getDifficultyLevel() {
  const levels = {
    easy: "🟢 Easy",
    medium: "🟡 Medium",
    difficult: "🔴 Difficult",
  };

  return levels[this.difficulty] || this.difficulty;
});

tourSchema.virtual("displayPrice").get(function getDisplayPrice() {
  const { finalPrice } = this;
  const formatted = `$${finalPrice.toLocaleString()}`;

  if (this.isOnSale) {
    const original = `$${this.price.toLocaleString()}`;

    return `${formatted} (was ${original})`;
  }

  return formatted;
});

tourSchema.virtual("durationInUnits").get(function getDurationInUnits() {
  return {
    days: this.duration,
    hours: this.duration * 24,
    minutes: this.duration * 24 * 60,
    seconds: this.duration * 24 * 60 * 60,
    weeks: Math.round((this.duration / 7) * 100) / 100,
    months: Math.round((this.duration / 30) * 100) / 100,
  };
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
tourSchema.index({ startDates: 1 });
tourSchema.index({ difficulty: 1 });
tourSchema.index({ duration: 1 });

const Tour = mongoose.model("Tour", tourSchema);

export default Tour;
