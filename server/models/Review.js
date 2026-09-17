import mongoose from "mongoose";
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
    createdAt: { type: Date, default: Date.now },
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
    title: { type: String, trim: true, maxlength: 100 },
    helpfulCount: { type: Number, default: 0, min: 0 },
    isVerifiedPurchase: { type: Boolean, default: false },
    isRecommended: { type: Boolean, default: true },
    response: {
      text: { type: String, trim: true, maxlength: 1000 },
      respondedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
      respondedAt: { type: Date },
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
        flaggedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
        flaggedAt: { type: Date, default: Date.now },
      },
    ],
    metadata: {
      userAgent: String,
      ipAddress: String,
      location: {
        city: String,
        country: String,
        coordinates: { type: [Number], index: "2dsphere" },
      },
      device: {
        type: String,
        enum: ["mobile", "desktop", "tablet", "other"],
      },
    },
    attachments: [
      {
        url: String,
        type: { type: String, enum: ["image", "video", "document"] },
        caption: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    editHistory: [
      {
        review: String,
        rating: Number,
        editedAt: { type: Date, default: Date.now },
        editedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ================================================================== */
/*  INDEXES — the unique compound index is what enforces one review   */
/*  per user per tour at the DATABASE level.                          */
/* ================================================================== */

/**
 * #1 CRITICAL — one review per user per tour.
 * MongoDB will reject any second insert with `E11000 duplicate key`.
 * This is the ultimate source of truth for duplicate prevention.
 */
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.index({ tour: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ isVerifiedPurchase: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ helpfulCount: -1 });
reviewSchema.index({ tour: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, status: 1 });
reviewSchema.index({ rating: -1, helpfulCount: -1 });
reviewSchema.index(
  { review: "text", title: "text" },
  {
    weights: { review: 10, title: 5 },
    name: "TextIndex",
    default_language: "english",
  },
);

/* ---------------------------- Virtuals ---------------------------- */

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

/* ---------------------------- Queries ----------------------------- */

reviewSchema.query = {
  byTour(tourId) {
    return this.where("tour").equals(tourId);
  },
  byUser(userId) {
    return this.where("user").equals(userId);
  },
  byRating(min, max) {
    let q = this.where("rating").gte(min);

    if (max) q = q.lte(max);

    return q;
  },
  byStatus(s) {
    return this.where("status").equals(s);
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
  withHelpful(min = 1) {
    return this.where("helpfulCount").gte(min);
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
    return this.skip((page - 1) * limit).limit(limit);
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
    let q = this;

    if (populateUser) {
      q = q.populate({ path: "user", select: "name email profileImage role" });
    }
    if (populateTour) {
      q = q.populate({
        path: "tour",
        select: "name slug price duration difficulty imageCover",
      });
    }

    return q;
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

/* ================================================================== */
/*  STATICS — average rating calculation                              */
/* ================================================================== */

reviewSchema.statics.calcAverageRatings = async function calcAverageRatings(
  tourId,
) {
  if (!tourId || !mongoose.Types.ObjectId.isValid(tourId)) {
    return null;
  }

  try {
    const stats = await this.aggregate([
      {
        $match: {
          tour: new mongoose.Types.ObjectId(tourId),
          status: "approved",
        },
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
      await Tour.findByIdAndUpdate(
        tourId,
        {
          ratingsQuantity: stats[0].nRating,
          ratingsAverage: Math.round(stats[0].avgRating * 10) / 10,
        },
        { runValidators: false, new: true },
      );
    } else {
      await Tour.findByIdAndUpdate(
        tourId,
        {
          ratingsQuantity: 0,
          ratingsAverage: 4.5,
        },
        { runValidators: false, new: true },
      );
    }

    return stats[0] || null;
  } catch (error) {
    console.error("Error calculating average ratings:", error);
    throw error;
  }
};

reviewSchema.statics.calcAverageRatingsForTours =
  async function calcAverageRatingsForTours(tourIds) {
    if (!Array.isArray(tourIds) || tourIds.length === 0) return [];

    const uniqueIds = [...new Set(tourIds.map((id) => String(id)))]
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (uniqueIds.length === 0) return [];

    const results = await Promise.all(
      uniqueIds.map((id) => this.calcAverageRatings(id)),
    );

    return results.filter(Boolean);
  };

/* ================================================================== */
/*  STATICS — DUPLICATE PREVENTION HELPERS                            */
/* ================================================================== */

/**
 * Check whether a user has already reviewed a given tour.
 * Cheaper than a full query — uses `exists()` under the hood.
 *
 * @param {ObjectId|string} userId
 * @param {ObjectId|string} tourId
 * @returns {Promise<boolean>}
 */
reviewSchema.statics.hasUserReviewedTour = async function hasUserReviewedTour(
  userId,
  tourId,
) {
  if (
    !userId ||
    !tourId ||
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(tourId)
  ) {
    return false;
  }

  const existing = await this.exists({ user: userId, tour: tourId });

  return !!existing;
};

/**
 * Fetch a user's review for a specific tour, or null.
 *
 * @param {ObjectId|string} userId
 * @param {ObjectId|string} tourId
 * @returns {Promise<Document|null>}
 */
reviewSchema.statics.getUserReviewForTour = function getUserReviewForTour(
  userId,
  tourId,
) {
  return this.findOne({ user: userId, tour: tourId });
};

/**
 * Fetch a user's review for a specific tour WITH the user and tour
 * documents populated. Useful when you want to render an "edit your
 * review" form directly.
 */
reviewSchema.statics.getUserReviewForTourPopulated =
  function getUserReviewForTourPopulated(userId, tourId) {
    return this.findOne({ user: userId, tour: tourId })
      .populate({ path: "user", select: "name email profileImage" })
      .populate({
        path: "tour",
        select: "name slug imageCover price duration difficulty",
      })
      .lean();
  };

/**
 * Return an array of tour ids that a given user has already reviewed.
 * Useful for rendering "you already reviewed these" badges on a list
 * of tours.
 *
 * @param {ObjectId|string} userId
 * @returns {Promise<ObjectId[]>}
 */
reviewSchema.statics.getReviewedTourIds = async function getReviewedTourIds(
  userId,
) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return [];

  const reviews = await this.find({ user: userId }, { tour: 1 }).lean();

  return reviews.map((r) => r.tour);
};

/* --------------------------- Aggregate statics -------------------- */

reviewSchema.statics.getReviewStats = async function getReviewStats(tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId, status: "approved" } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
        minRating: { $min: "$rating" },
        maxRating: { $max: "$rating" },
        totalRatingSum: { $sum: "$rating" },
        verifiedPurchases: { $sum: { $cond: ["$isVerifiedPurchase", 1, 0] } },
        recommendedCount: { $sum: { $cond: ["$isRecommended", 1, 0] } },
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
};

reviewSchema.statics.getRatingDistribution =
  async function getRatingDistribution(tourId) {
    const distribution = await this.aggregate([
      { $match: { tour: tourId, status: "approved" } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      {
        $group: {
          _id: null,
          distribution: { $push: { rating: "$_id", count: "$count" } },
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
  };

reviewSchema.statics.getReviewsByDateRange =
  async function getReviewsByDateRange(startDate, endDate, tourId = null) {
    const match = {
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
      status: "approved",
    };

    if (tourId) match.tour = tourId;

    const results = await this.aggregate([
      { $match: match },
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
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    return results;
  };

/* --------------------------- Methods ------------------------------ */

reviewSchema.methods.markHelpful = async function markHelpful() {
  this.helpfulCount += 1;
  await this.save();

  return this;
};
reviewSchema.methods.addResponse = async function addResponse(
  text,
  responderId,
) {
  this.response = { text, respondedBy: responderId, respondedAt: new Date() };
  await this.save();

  return this;
};
reviewSchema.methods.flagReview = async function flagReview(
  reason,
  description,
  flaggerId,
) {
  if (!this.flagReasons) this.flagReasons = [];
  this.flagReasons.push({
    reason,
    description,
    flaggedBy: flaggerId,
    flaggedAt: new Date(),
  });
  if (this.flagReasons.length >= 3) this.status = "flagged";
  await this.save();

  return this;
};
reviewSchema.methods.approve = async function approve() {
  this.status = "approved";
  await this.save();

  return this;
};
reviewSchema.methods.reject = async function reject() {
  this.status = "rejected";
  await this.save();

  return this;
};
reviewSchema.methods.editReview = async function editReview(
  newReview,
  newRating,
  editorId,
) {
  if (!this.editHistory) this.editHistory = [];
  this.editHistory.push({
    review: this.review,
    rating: this.rating,
    editedAt: new Date(),
    editedBy: editorId,
  });
  this.review = newReview;
  this.rating = newRating;
  await this.save();

  return this;
};

reviewSchema.pre("save", async function preSaveMiddleware() {
  if (this.rating < 1 || this.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  if (!this.isNew) return;

  if (this.$locals?.allowDuplicate === true) return;

  if (!this.tour || !this.user) return;

  const existing = await this.constructor.exists({
    tour: this.tour,
    user: this.user,
  });

  if (existing) {
    const err = new mongoose.Error.ValidationError(this);

    err.addError(
      "tour",
      new mongoose.Error.ValidatorError({
        path: "tour",
        message: "You have already reviewed this tour",
        kind: "DuplicateReview",
      }),
    );
    throw err;
  }
});

reviewSchema.post("save", function postSaveDuplicateMapper(err, doc, next) {
  if (!err) return next();

  if (err.code === 11000 && err.keyPattern?.tour && err.keyPattern?.user) {
    const validationErr = new mongoose.Error.ValidationError(doc);

    validationErr.addError(
      "tour",
      new mongoose.Error.ValidatorError({
        path: "tour",
        message: "You have already reviewed this tour",
        kind: "DuplicateReview",
      }),
    );

    return next(validationErr);
  }

  return next(err);
});

/**
 * Recalculate the tour's average rating after a review is saved.
 * Only runs when something that can affect the average changed.
 */
reviewSchema.post("save", async function handleSavePost(doc) {
  if (!doc || !doc.tour) return;

  try {
    const affectsAverage =
      doc.isNew ||
      doc.isModified("rating") ||
      doc.isModified("status") ||
      doc.isModified("tour");

    if (!affectsAverage) return;

    await doc.constructor.calcAverageRatings(doc.tour);
  } catch (error) {
    console.error("Error updating tour ratings after save:", error);
  }
});

reviewSchema.pre("findOneAndUpdate", async function preFindOneAndUpdate() {
  const update = this.getUpdate() || {};
  const filter = this.getFilter();

  const newTour = update.tour || update.$set?.tour;
  const newUser = update.user || update.$set?.user;

  if (!newTour && !newUser) return;

  const tour = newTour || filter.tour;
  const user = newUser || filter.user;

  if (!tour || !user) return;

  const existing = await this.model.exists({
    tour,
    user,
    _id: { $ne: filter._id },
  });

  if (existing) {
    throw new Error("You have already reviewed this tour");
  }
});

/**
 * Recalculate after `findOneAndUpdate` / `findByIdAndUpdate`.
 */
reviewSchema.post(/^findOneAnd/, async function handleFindOneAndPost(doc) {
  try {
    if (doc && doc.tour) {
      await doc.constructor.calcAverageRatings(doc.tour);
    }
  } catch (error) {
    console.error("Error updating tour ratings after update:", error);
  }
});

reviewSchema.pre("find", function preFindMiddleware() {
  if (!this._includeAll && !this._skipStatusFilter) {
    this.where("status").equals("approved");
  }
});

/* ---------------------------- Statics ----------------------------- */

reviewSchema.statics.getAllForTour = function getAllForTour(
  tourId,
  options = {},
) {
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

  if (status) query = query.where("status").equals(status);
  if (minRating) query = query.where("rating").gte(minRating);
  if (maxRating) query = query.where("rating").lte(maxRating);
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

reviewSchema.statics.getTopReviews = function getTopReviews(limit = 5) {
  return this.find({ status: "approved" })
    .sort("-rating")
    .limit(limit)
    .populate({ path: "user", select: "name email profileImage" })
    .populate({ path: "tour", select: "name slug imageCover" })
    .lean();
};

reviewSchema.statics.getRecentReviews = function getRecentReviews(limit = 5) {
  return this.find({ status: "approved" })
    .sort("-createdAt")
    .limit(limit)
    .populate({ path: "user", select: "name email profileImage" })
    .populate({ path: "tour", select: "name slug imageCover" })
    .lean();
};

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default Review;
