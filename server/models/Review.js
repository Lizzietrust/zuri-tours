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
      set: function setRating(val) {
        return Math.round(val * 10) / 10;
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
      index: true,
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
      index: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },

    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },

    isRecommended: {
      type: Boolean,
      default: true,
    },

    response: {
      text: {
        type: String,
        trim: true,
        maxlength: [1000, "Response cannot be more than 1000 characters"],
      },
      respondedBy: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      respondedAt: {
        type: Date,
      },
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "flagged"],
      default: "pending",
    },

    flagReasons: [
      {
        reason: {
          type: String,
          enum: ["inappropriate", "spam", "fake", "offensive", "other"],
        },
        description: String,
        flaggedBy: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        flaggedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    metadata: {
      userAgent: String,
      ipAddress: String,
      location: {
        city: String,
        country: String,
        coordinates: {
          type: [Number],
          index: "2dsphere",
        },
      },
      device: {
        type: String,
        enum: ["mobile", "desktop", "tablet", "other"],
      },
    },

    attachments: [
      {
        url: String,
        type: {
          type: String,
          enum: ["image", "video", "document"],
        },
        caption: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    editHistory: [
      {
        review: String,
        rating: Number,
        editedAt: {
          type: Date,
          default: Date.now,
        },
        editedBy: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.index({ tour: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ isVerifiedPurchase: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ helpfulCount: -1 });
reviewSchema.index({ "metadata.location.coordinates": "2dsphere" });

reviewSchema.index({ tour: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, status: 1 });
reviewSchema.index({ rating: -1, helpfulCount: -1 });

reviewSchema.virtual("formattedRating").get(function getFormattedRating() {
  const stars = "⭐".repeat(Math.floor(this.rating));
  const halfStar = this.rating % 1 >= 0.5 ? "½" : "";

  return `${stars}${halfStar} (${this.rating.toFixed(1)})`;
});

reviewSchema.virtual("reviewAge").get(function getReviewAge() {
  const now = new Date();
  const diff = now - this.createdAt;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;

  return `${Math.floor(days / 365)} years ago`;
});

reviewSchema.virtual("isEdited").get(function getIsEdited() {
  return this.editHistory && this.editHistory.length > 0;
});

reviewSchema.virtual("hasResponse").get(function getHasResponse() {
  return !!(this.response && this.response.text);
});

reviewSchema.virtual("canBeHelpful").get(function getCanBeHelpful() {
  return this.status === "approved";
});

reviewSchema.query = {
  byTour(tourId) {
    return this.where("tour").equals(tourId);
  },

  byUser(userId) {
    return this.where("user").equals(userId);
  },

  byRating(minRating, maxRating) {
    let query = this.where("rating").gte(minRating);

    if (maxRating) {
      query = query.lte(maxRating);
    }

    return query;
  },

  byStatus(status) {
    return this.where("status").equals(status);
  },

  approved() {
    return this.where("status").equals("approved");
  },

  pending() {
    return this.where("status").equals("pending");
  },

  verified() {
    return this.where("isVerifiedPurchase").equals(true);
  },

  recommended() {
    return this.where("isRecommended").equals(true);
  },

  withHelpful(minCount = 1) {
    return this.where("helpfulCount").gte(minCount);
  },

  sortByNewest() {
    return this.sort({ createdAt: -1 });
  },

  sortByOldest() {
    return this.sort({ createdAt: 1 });
  },

  sortByHighestRating() {
    return this.sort({ rating: -1 });
  },

  sortByLowestRating() {
    return this.sort({ rating: 1 });
  },

  sortByMostHelpful() {
    return this.sort({ helpfulCount: -1 });
  },

  search(text) {
    return this.find({
      $text: {
        $search: text,
        $language: "en",
        $caseSensitive: false,
        $diacriticSensitive: false,
      },
    });
  },

  paginate(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return this.skip(skip).limit(limit);
  },

  selectBasic() {
    return this.select(
      "review rating createdAt tour user helpfulCount isVerifiedPurchase isRecommended",
    );
  },

  selectDetailed() {
    return this.select(
      "review rating createdAt tour user helpfulCount isVerifiedPurchase isRecommended title response status attachments",
    );
  },

  populateParents(populateUser = true, populateTour = true) {
    let query = this;

    if (populateUser) {
      query = query.populate({
        path: "user",
        select: "name email profileImage role",
      });
    }

    if (populateTour) {
      query = query.populate({
        path: "tour",
        select: "name slug price duration difficulty imageCover",
      });
    }

    return query;
  },

  populateResponseUser() {
    return this.populate({
      path: "response.respondedBy",
      select: "name email role profileImage",
    });
  },

  populateFlagUsers() {
    return this.populate({
      path: "flagReasons.flaggedBy",
      select: "name email role",
    });
  },

  populateEditHistory() {
    return this.populate({
      path: "editHistory.editedBy",
      select: "name email role",
    });
  },

  populateAll() {
    return this.populateParents(true, true)
      .populateResponseUser()
      .populateFlagUsers()
      .populateEditHistory();
  },
};

reviewSchema.statics.calcAverageRatings = async function calcAverageRatings(
  tourId,
) {
  try {
    const stats = await this.aggregate([
      {
        $match: { tour: tourId, status: "approved" },
      },
      {
        $group: {
          _id: "$tour",
          nRating: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          minRating: { $min: "$rating" },
          maxRating: { $max: "$rating" },
          totalRatingSum: { $sum: "$rating" },
        },
      },
    ]);

    if (stats.length > 0) {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: stats[0].nRating,
        ratingsAverage: Math.round(stats[0].avgRating * 10) / 10,
      });
    } else {
      await Tour.findByIdAndUpdate(tourId, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5,
      });
    }

    return stats[0] || null;
  } catch (error) {
    console.error("Error calculating average ratings:", error);
    throw error;
  }
};

reviewSchema.statics.getReviewStats = async function getReviewStats(tourId) {
  try {
    const stats = await this.aggregate([
      {
        $match: { tour: tourId, status: "approved" },
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          minRating: { $min: "$rating" },
          maxRating: { $max: "$rating" },
          totalRatingSum: { $sum: "$rating" },
          verifiedPurchases: {
            $sum: { $cond: ["$isVerifiedPurchase", 1, 0] },
          },
          recommendedCount: {
            $sum: { $cond: ["$isRecommended", 1, 0] },
          },
          totalHelpful: { $sum: "$helpfulCount" },
        },
      },
      {
        $project: {
          _id: 0,
          totalReviews: 1,
          averageRating: { $round: ["$averageRating", 1] },
          minRating: 1,
          maxRating: 1,
          totalRatingSum: 1,
          verifiedPurchases: 1,
          recommendedCount: 1,
          totalHelpful: 1,
          recommendationRate: {
            $cond: [
              { $eq: ["$totalReviews", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$recommendedCount", "$totalReviews"] },
                  100,
                ],
              },
            ],
          },
          verifiedRate: {
            $cond: [
              { $eq: ["$totalReviews", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$verifiedPurchases", "$totalReviews"] },
                  100,
                ],
              },
            ],
          },
          averageHelpfulPerReview: {
            $cond: [
              { $eq: ["$totalReviews", 0] },
              0,
              { $divide: ["$totalHelpful", "$totalReviews"] },
            ],
          },
        },
      },
    ]);

    return stats[0] || null;
  } catch (error) {
    console.error("Error getting review stats:", error);
    throw error;
  }
};

reviewSchema.statics.getRatingDistribution =
  async function getRatingDistribution(tourId) {
    try {
      const distribution = await this.aggregate([
        {
          $match: { tour: tourId, status: "approved" },
        },
        {
          $group: {
            _id: "$rating",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: -1 },
        },
        {
          $group: {
            _id: null,
            distribution: {
              $push: {
                rating: "$_id",
                count: "$count",
              },
            },
            total: { $sum: "$count" },
          },
        },
        {
          $project: {
            _id: 0,
            distribution: 1,
            total: 1,
            percentages: {
              $map: {
                input: "$distribution",
                as: "item",
                in: {
                  rating: "$$item.rating",
                  count: "$$item.count",
                  percentage: {
                    $multiply: [{ $divide: ["$$item.count", "$total"] }, 100],
                  },
                },
              },
            },
          },
        },
      ]);

      return distribution[0] || null;
    } catch (error) {
      console.error("Error getting rating distribution:", error);
      throw error;
    }
  };

reviewSchema.statics.getReviewsByDateRange =
  async function getReviewsByDateRange(startDate, endDate, tourId = null) {
    try {
      const match = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        status: "approved",
      };

      if (tourId) {
        match.tour = tourId;
      }

      const reviews = await this.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
            averageRating: { $avg: "$rating" },
            reviews: { $push: "$$ROOT" },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
        },
      ]);

      return reviews;
    } catch (error) {
      console.error("Error getting reviews by date range:", error);
      throw error;
    }
  };

reviewSchema.methods.markHelpful = async function markHelpful() {
  this.helpfulCount += 1;
  await this.save();

  return this;
};

reviewSchema.methods.addResponse = async function addResponse(
  text,
  responderId,
) {
  this.response = {
    text,
    respondedBy: responderId,
    respondedAt: new Date(),
  };
  await this.save();

  return this;
};

reviewSchema.methods.flagReview = async function flagReview(
  reason,
  description,
  flaggerId,
) {
  if (!this.flagReasons) {
    this.flagReasons = [];
  }

  this.flagReasons.push({
    reason,
    description,
    flaggedBy: flaggerId,
    flaggedAt: new Date(),
  });

  if (this.flagReasons.length >= 3) {
    this.status = "flagged";
  }

  await this.save();

  return this;
};

// Approve review
reviewSchema.methods.approve = async function approve() {
  this.status = "approved";
  await this.save();
  await this.constructor.calcAverageRatings(this.tour);

  return this;
};

// Reject review
reviewSchema.methods.reject = async function reject() {
  this.status = "rejected";
  await this.save();
  await this.constructor.calcAverageRatings(this.tour);

  return this;
};

// Edit review
reviewSchema.methods.editReview = async function editReview(
  newReview,
  newRating,
  editorId,
) {
  if (!this.editHistory) {
    this.editHistory = [];
  }

  // Save current version to history
  this.editHistory.push({
    review: this.review,
    rating: this.rating,
    editedAt: new Date(),
    editedBy: editorId,
  });

  // Update review
  this.review = newReview;
  this.rating = newRating;
  await this.save();

  // Recalculate tour ratings
  await this.constructor.calcAverageRatings(this.tour);

  return this;
};

// ==================== MIDDLEWARE ====================

// Pre-save middleware
reviewSchema.pre("save", function preSaveMiddleware(next) {
  try {
    // Auto-approve if user is admin or tour creator
    // This would need user context - you can pass it through the request
    // For now, we'll set it as pending by default

    // Validate rating is between 1 and 5
    if (this.rating < 1 || this.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check for duplicate review
    // This is handled by the unique index

    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware - update tour ratings
reviewSchema.post("save", async function handleSavePost() {
  try {
    await this.constructor.calcAverageRatings(this.tour);
  } catch (error) {
    console.error("Error updating tour ratings after save:", error);
  }
});

// Post-findOneAndUpdate middleware - update tour ratings
reviewSchema.post(/^findOneAnd/, async function handleFindOneAndPost(doc) {
  try {
    if (doc) {
      await doc.constructor.calcAverageRatings(doc.tour);
    }
  } catch (error) {
    console.error("Error updating tour ratings after update:", error);
  }
});

// Post-delete middleware
reviewSchema.post(
  "findOneAndDelete",
  async function handleFindOneAndDelete(doc) {
    try {
      if (doc) {
        await doc.constructor.calcAverageRatings(doc.tour);
      }
    } catch (error) {
      console.error("Error updating tour ratings after delete:", error);
    }
  },
);

// Pre-find middleware - apply default filters
reviewSchema.pre("find", function preFindMiddleware() {
  // Optionally apply default filters
  // For example, by default only show approved reviews
  if (!this._includeAll && !this._skipStatusFilter) {
    this.where("status").equals("approved");
  }
});

// Post-find middleware - log or transform
reviewSchema.post("find", function postFindMiddleware(_docs) {
  // Can add logging or transformations here if needed
  // _docs parameter is intentionally unused
});

// ==================== MODEL CREATION ====================

// Add text index for search
reviewSchema.index(
  { review: "text", title: "text" },
  {
    weights: {
      review: 10,
      title: 5,
    },
    name: "TextIndex",
    default_language: "english",
  },
);

// Create the model
const Review = mongoose.model("Review", reviewSchema);

// ==================== STATIC QUERY METHODS ====================

// Get all reviews for a tour with options
Review.getAllForTour = function getAllForTour(tourId, options = {}) {
  const {
    limit = 10,
    page = 1,
    sort = "-createdAt",
    status = "approved",
    minRating = null,
    maxRating = null,
    populateUser = true,
  } = options;

  let query = this.find({ tour: tourId });

  if (status) {
    query = query.where("status").equals(status);
  }

  if (minRating) {
    query = query.where("rating").gte(minRating);
  }

  if (maxRating) {
    query = query.where("rating").lte(maxRating);
  }

  const skip = (page - 1) * limit;

  query = query.sort(sort).skip(skip).limit(limit);

  if (populateUser) {
    query = query.populate({
      path: "user",
      select: "name email profileImage",
    });
  }

  return query.lean();
};

// Get a user's review for a specific tour
Review.getUserReviewForTour = function getUserReviewForTour(userId, tourId) {
  return this.findOne({
    user: userId,
    tour: tourId,
  });
};

// Get top-rated reviews
Review.getTopReviews = function getTopReviews(limit = 5) {
  return this.find({ status: "approved" })
    .sort("-rating")
    .limit(limit)
    .populate({
      path: "user",
      select: "name email profileImage",
    })
    .populate({
      path: "tour",
      select: "name slug imageCover",
    })
    .lean();
};

// Get most recent reviews
Review.getRecentReviews = function getRecentReviews(limit = 5) {
  return this.find({ status: "approved" })
    .sort("-createdAt")
    .limit(limit)
    .populate({
      path: "user",
      select: "name email profileImage",
    })
    .populate({
      path: "tour",
      select: "name slug imageCover",
    })
    .lean();
};

export default Review;
