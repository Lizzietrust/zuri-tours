import mongoose from "mongoose";

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
    isActive: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: ["adventure", "cultural", "nature", "city", "beach", "mountain"],
      default: "adventure",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: String,
      description: String,
    },
    included: [String],
    excluded: [String],
    itinerary: [
      {
        day: Number,
        title: String,
        description: String,
        activities: [String],
        meals: {
          breakfast: Boolean,
          lunch: Boolean,
          dinner: Boolean,
        },
        accommodation: String,
      },
    ],
    cancellationPolicy: {
      freeCancellation: {
        type: Boolean,
        default: true,
      },
      deadlineDays: {
        type: Number,
        default: 7,
      },
      refundPercentage: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
    },
    languages: [String],
    minimumAge: {
      type: Number,
      default: 0,
    },
    maximumAltitude: {
      type: Number,
    },
    physicalRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },

    isSecret: {
      type: Boolean,
      default: false,
    },
    secretCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    secretAccessLevel: {
      type: String,
      enum: ["vip", "premium", "staff", "admin", "public"],
      default: "public",
    },
    secretReleaseDate: {
      type: Date,
    },
    secretExpiryDate: {
      type: Date,
    },
    secretMaxBookings: {
      type: Number,
      default: 10,
    },
    secretBookings: {
      type: Number,
      default: 0,
    },
    secretWhitelist: [
      {
        userId: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        email: String,
        accessGrantedAt: {
          type: Date,
          default: Date.now,
        },
        accessExpiresAt: Date,
      },
    ],
    secretViewCount: {
      type: Number,
      default: 0,
    },
    secretLastViewed: Date,
    secretMetadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    isSecretArchived: {
      type: Boolean,
      default: false,
    },
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
  if (!this.priceDiscount || this.priceDiscount === 0) {
    return 0;
  }

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

  if (rating >= 4.7) {
    return "Excellent ⭐⭐⭐⭐⭐";
  }
  if (rating >= 4.3) {
    return "Very Good ⭐⭐⭐⭐";
  }
  if (rating >= 3.8) {
    return "Good ⭐⭐⭐";
  }
  if (rating >= 3.0) {
    return "Average ⭐⭐";
  }

  return "Below Average ⭐";
});

tourSchema.virtual("reviewCount").get(function getReviewCount() {
  return this.reviews ? this.reviews.length : 0;
});

tourSchema.virtual("computedRating").get(function getComputedRating() {
  if (!this.reviews || this.reviews.length === 0) {
    return 0;
  }
  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);

  return Math.round((total / this.reviews.length) * 10) / 10;
});

tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

tourSchema.virtual("upcomingStartDates").get(function getUpcomingStartDates() {
  if (!this.startDates || this.startDates.length === 0) {
    return [];
  }
  const now = new Date();

  return this.startDates.filter((date) => date >= now).sort((a, b) => a - b);
});

tourSchema.virtual("pastStartDates").get(function getPastStartDates() {
  if (!this.startDates || this.startDates.length === 0) {
    return [];
  }
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

tourSchema.virtual("itineraryDays").get(function getItineraryDays() {
  return this.itinerary ? this.itinerary.length : 0;
});

tourSchema.virtual("includedItems").get(function getIncludedItems() {
  return this.included || [];
});

tourSchema.virtual("excludedItems").get(function getExcludedItems() {
  return this.excluded || [];
});

tourSchema.virtual("isSecretAvailable").get(function getIsSecretAvailable() {
  if (!this.isSecret) {
    return false;
  }
  if (this.isSecretArchived) {
    return false;
  }

  const now = new Date();

  if (this.secretExpiryDate && this.secretExpiryDate < now) {
    return false;
  }
  if (this.secretReleaseDate && this.secretReleaseDate > now) {
    return false;
  }

  return this.secretBookings < this.secretMaxBookings;
});

tourSchema
  .virtual("secretRemainingSlots")
  .get(function getSecretRemainingSlots() {
    if (!this.isSecret) {
      return 0;
    }

    return Math.max(0, this.secretMaxBookings - this.secretBookings);
  });

tourSchema
  .virtual("secretAvailabilityPercentage")
  .get(function getSecretAvailabilityPercentage() {
    if (!this.isSecret || this.secretMaxBookings === 0) {
      return 0;
    }

    return Math.round(
      (this.secretRemainingSlots / this.secretMaxBookings) * 100,
    );
  });

tourSchema.virtual("isSecretExpired").get(function getIsSecretExpired() {
  if (!this.isSecret) {
    return false;
  }
  if (this.isSecretArchived) {
    return true;
  }

  const now = new Date();

  if (this.secretExpiryDate && this.secretExpiryDate < now) {
    return true;
  }

  return this.secretBookings >= this.secretMaxBookings;
});

tourSchema.virtual("secretStatus").get(function getSecretStatus() {
  if (!this.isSecret) {
    return "Not a secret tour";
  }
  if (this.isSecretArchived) {
    return "Archived";
  }
  if (this.isSecretExpired) {
    return "Expired";
  }
  if (!this.isSecretAvailable) {
    return "Unavailable";
  }

  const now = new Date();

  if (this.secretReleaseDate && this.secretReleaseDate > now) {
    return `Releases on ${this.secretReleaseDate.toLocaleDateString()}`;
  }

  return `${this.secretRemainingSlots} slots remaining`;
});

tourSchema.query = {
  priceRange(min, max) {
    return this.where("price").gte(min).lte(max);
  },

  durationRange(min, max) {
    return this.where("duration").gte(min).lte(max);
  },

  byDifficulty(difficulty) {
    return this.where("difficulty").equals(difficulty);
  },

  minRating(rating) {
    return this.where("ratingsAverage").gte(rating);
  },

  available() {
    const now = new Date();

    return this.where("startDates").elemMatch({
      $gte: now,
    });
  },

  onSale() {
    return this.where("priceDiscount").gt(0);
  },

  featured() {
    return this.where("featured").equals(true);
  },

  active() {
    return this.where("isActive").equals(true);
  },

  byCategory(category) {
    return this.where("category").equals(category);
  },

  search(term) {
    return this.find({
      $text: {
        $search: term,
        $language: "en",
        $caseSensitive: false,
        $diacriticSensitive: false,
      },
    });
  },

  sortByPrice(asc = true) {
    return this.sort({ price: asc ? 1 : -1 });
  },

  sortByRating() {
    return this.sort({ ratingsAverage: -1 });
  },

  sortByPopularity() {
    return this.sort({ ratingsQuantity: -1 });
  },

  sortByNewest() {
    return this.sort({ createdAt: -1 });
  },

  sortByDuration(asc = true) {
    return this.sort({ duration: asc ? 1 : -1 });
  },

  paginate(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return this.skip(skip).limit(limit);
  },

  selectBasic() {
    return this.select(
      "name slug price priceDiscount duration difficulty ratingsAverage ratingsQuantity imageCover summary",
    );
  },

  selectDetailed() {
    return this.select(
      "name slug price priceDiscount duration difficulty ratingsAverage ratingsQuantity imageCover summary description images startDates guides maxGroupSize",
    );
  },

  withVirtuals() {
    return this.lean().select("+virtuals");
  },

  includeSecret() {
    this._includeSecret = true;

    return this;
  },

  onlySecret() {
    return this.where("isSecret").equals(true);
  },

  bySecretAccessLevel(level) {
    return this.where("secretAccessLevel").equals(level);
  },

  bySecretCode(code) {
    return this.where("secretCode").equals(code);
  },

  secretAvailable() {
    const now = new Date();

    return this.where("isSecret")
      .equals(true)
      .where("isSecretArchived")
      .equals(false)
      .where("secretExpiryDate")
      .gte(now)
      .where("secretBookings")
      .lt(this.where("secretMaxBookings"));
  },

  byWhitelistedUser(userId) {
    return this.where("secretWhitelist.userId").equals(userId);
  },

  secretReleaseDateRange(start, end) {
    return this.where("secretReleaseDate").gte(start).lte(end);
  },

  secretExpiryDateRange(start, end) {
    return this.where("secretExpiryDate").gte(start).lte(end);
  },

  hasRemainingSlots() {
    return this.where("secretBookings").lt(this.where("secretMaxBookings"));
  },

  sortBySecretAvailability() {
    return this.sort({ secretRemainingSlots: -1 });
  },

  sortBySecretReleaseDate(asc = true) {
    return this.sort({ secretReleaseDate: asc ? 1 : -1 });
  },

  selectSecretFields() {
    return this.select(
      "isSecret secretCode secretAccessLevel secretReleaseDate secretExpiryDate secretMaxBookings secretBookings secretWhitelist secretViewCount secretMetadata",
    );
  },

  excludeSecret() {
    return this.where("isSecret").equals(false);
  },
};

tourSchema.pre("find", function preFindMiddleware(next) {
  try {
    if (!this._skipActiveFilter) {
      this.where("isActive").equals(true);
    }

    if (!this._includeSecret && !this._skipSecretFilter) {
      this.where("isSecret").equals(false);
    }

    if (!this._sort) {
      this.sort({ createdAt: -1 });
    }

    next();
  } catch (error) {
    next(error);
  }
});

tourSchema.post("find", function postFindMiddleware(docs, next) {
  try {
    if (docs && docs.length > 0) {
      const secretCount = docs.filter((doc) => doc.isSecret).length;

      console.log(
        `🔍 Found ${docs.length} tours (${secretCount} secret tours)`,
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

tourSchema.pre("findOne", function preFindOneMiddleware(next) {
  try {
    if (!this._skipActiveFilter) {
      this.where("isActive").equals(true);
    }

    if (!this._includeSecret && !this._skipSecretFilter) {
      this.where("isSecret").equals(false);
    }

    next();
  } catch (error) {
    next(error);
  }
});

tourSchema.post("findOne", function postFindOneMiddleware(doc, next) {
  try {
    if (doc) {
      const secretStatus = doc.isSecret ? "🔒 SECRET" : "📄";

      console.log(`${secretStatus} Found tour: ${doc.name}`);
    }
    next();
  } catch (error) {
    next(error);
  }
});

tourSchema.pre("count", function preCountMiddleware(next) {
  try {
    if (!this._skipActiveFilter) {
      this.where("isActive").equals(true);
    }

    if (!this._includeSecret && !this._skipSecretFilter) {
      this.where("isSecret").equals(false);
    }

    next();
  } catch (error) {
    next(error);
  }
});

tourSchema.pre("findById", function preFindByIdMiddleware(next) {
  try {
    if (!this._skipActiveFilter) {
      this.where("isActive").equals(true);
    }

    if (!this._includeSecret && !this._skipSecretFilter) {
      this.where("isSecret").equals(false);
    }

    next();
  } catch (error) {
    next(error);
  }
});

tourSchema.pre("save", function preSaveMiddleware(next) {
  try {
    if (this.isSecret && !this.secretCode) {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();

      this.secretCode = `SEC-${Date.now().toString(36).toUpperCase()}-${random}`;
    }

    if (this.isSecret) {
      if (!this.secretAccessLevel || this.secretAccessLevel === "public") {
        this.secretAccessLevel = "vip";
      }

      if (!this.secretMaxBookings || this.secretMaxBookings < 1) {
        this.secretMaxBookings = 10;
      }

      if (!this.secretExpiryDate) {
        const defaultExpiry = new Date();

        defaultExpiry.setMonth(defaultExpiry.getMonth() + 6);
        this.secretExpiryDate = defaultExpiry;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

tourSchema.pre("aggregate", function preAggregateMiddleware(next) {
  try {
    const pipeline = this.pipeline();

    const shouldIncludeSecret = this._includeSecret || false;

    const firstStage = pipeline[0];
    const hasSecretFilter =
      firstStage &&
      firstStage.$match &&
      (firstStage.$match.isSecret !== undefined ||
        (firstStage.$match.$and &&
          firstStage.$match.$and.some(
            (item) => item && item.isSecret !== undefined,
          )));

    if (!hasSecretFilter && !shouldIncludeSecret) {
      const hasActiveFilter =
        firstStage &&
        firstStage.$match &&
        (firstStage.$match.isActive !== undefined ||
          (firstStage.$match.$and &&
            firstStage.$match.$and.some(
              (item) => item && item.isActive !== undefined,
            )));

      if (!hasActiveFilter) {
        this.pipeline().unshift({
          $match: { isActive: true, isSecret: false },
        });
      } else if (firstStage && firstStage.$match) {
        firstStage.$match.isSecret = false;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

tourSchema.post("aggregate", function postAggregateMiddleware(result, next) {
  try {
    if (result && result.length > 0) {
      const secretCount = result.filter((item) => item.isSecret).length;

      console.log(
        `📊 Aggregation returned ${result.length} documents (${secretCount} secret)`,
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

tourSchema.index({ isSecret: 1 });
tourSchema.index({ secretCode: 1 }, { unique: true, sparse: true });
tourSchema.index({ secretAccessLevel: 1 });
tourSchema.index({ secretReleaseDate: 1 });
tourSchema.index({ secretExpiryDate: 1 });
tourSchema.index({ secretWhitelist: 1 });
tourSchema.index({ secretBookings: 1, secretMaxBookings: 1 });

tourSchema.index({ isSecret: 1, secretAccessLevel: 1 });
tourSchema.index({ isSecret: 1, secretReleaseDate: 1, secretExpiryDate: 1 });
tourSchema.index({ isSecret: 1, secretBookings: 1, secretMaxBookings: 1 });
tourSchema.index({ secretAccessLevel: 1, secretReleaseDate: 1 });

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startDates: 1 });
tourSchema.index({ difficulty: 1 });
tourSchema.index({ duration: 1 });
tourSchema.index({ name: "text", summary: "text", description: "text" });

tourSchema.index({ category: 1 });
tourSchema.index({ featured: 1, ratingsAverage: -1 });
tourSchema.index({ isActive: 1, createdAt: -1 });
tourSchema.index({ "location.coordinates": "2dsphere" });
tourSchema.index({ maxGroupSize: 1 });
tourSchema.index({ minimumAge: 1 });
tourSchema.index({ physicalRating: 1 });

tourSchema.index({ isActive: 1, featured: 1, ratingsAverage: -1 });
tourSchema.index({ category: 1, price: 1, duration: 1 });
tourSchema.index({ isActive: 1, isSecret: 1, createdAt: -1 });

const Tour = mongoose.models.Tour || mongoose.model("Tour", tourSchema);

export default Tour;
