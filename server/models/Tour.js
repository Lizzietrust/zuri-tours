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
      required: [true, "Please add a slug"],
      unique: true,
      lowercase: true,
      trim: true,
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
          if (val === undefined || val === null) return true;
          if (!this.price) return true;

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
    guideDetails: {
      leadGuide: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      assistantGuides: [
        {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
      ],
      guideAssignments: [
        {
          guideId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
          },
          role: {
            type: String,
            enum: ["lead", "assistant", "specialist", "translator", "local"],
            default: "assistant",
          },
          startDate: {
            type: Date,
            required: true,
          },
          endDate: {
            type: Date,
            required: true,
          },
          responsibilities: [String],
          languages: [String],
          notes: String,
          isActive: {
            type: Boolean,
            default: true,
          },
        },
      ],
      requirements: {
        minGuides: { type: Number, default: 1, min: 0 },
        maxGuides: { type: Number, default: 5, min: 1 },
        requiredLanguages: [String],
        preferredLanguages: [String],
        requiredCertifications: [String],
        preferredCertifications: [String],
        minGuideExperience: { type: Number, default: 0, min: 0 },
        maxGuideToTouristRatio: { type: Number, default: 20, min: 1 },
      },
      compensation: {
        type: {
          type: String,
          enum: ["fixed", "percentage", "hourly", "daily", "perTourist"],
          default: "fixed",
        },
        amount: { type: Number, min: 0 },
        currency: {
          type: String,
          default: "USD",
          uppercase: true,
          maxlength: 3,
          minlength: 3,
        },
        notes: String,
      },
      scheduling: {
        shiftPattern: {
          type: String,
          enum: ["fixed", "rotating", "flexible"],
          default: "fixed",
        },
        hoursPerDay: { type: Number, default: 8, min: 1, max: 24 },
        breakDuration: { type: Number, default: 60, min: 0 },
        overtimeAllowed: { type: Boolean, default: false },
        daysOff: [String],
        backupGuides: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
      },
      performance: {
        rating: { type: Number, min: 0, max: 5, default: 0 },
        reviews: { type: Number, default: 0 },
        completedTours: { type: Number, default: 0 },
        attendanceRate: { type: Number, min: 0, max: 100, default: 100 },
        skills: [String],
        strengths: [String],
        areasForImprovement: [String],
      },
    },
    guideRatings: [
      {
        guideId: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
          required: true,
        },
        rating: { type: Number, required: true, min: 1, max: 5 },
        review: { type: String, trim: true, maxlength: 500 },
        reviewerId: { type: mongoose.Schema.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
        categories: {
          knowledge: { type: Number, min: 1, max: 5 },
          communication: { type: Number, min: 1, max: 5 },
          professionalism: { type: Number, min: 1, max: 5 },
          punctuality: { type: Number, min: 1, max: 5 },
          helpfulness: { type: Number, min: 1, max: 5 },
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A tour must have a creator"],
    },
    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
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
        required: true,
      },
      coordinates: {
        type: [Number],
        required: [true, "Please add coordinates"],
        validate: {
          validator: function validateCoordinates(val) {
            if (!val || val.length !== 2) return false;
            const [lng, lat] = val;

            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
          },
          message: "Invalid coordinates. Must be [longitude, latitude]",
        },
      },
      address: {
        type: String,
        trim: true,
        required: [true, "Please add an address"],
      },
      description: { type: String, trim: true },
      city: { type: String, trim: true },
      country: { type: String, trim: true },
      region: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      placeId: { type: String, trim: true },
      formattedAddress: { type: String, trim: true },
    },
    locations: [
      {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: {
          type: [Number],
          required: true,
          validate: {
            validator: function validateCoordinates(val) {
              if (!val || val.length !== 2) return false;
              const [lng, lat] = val;

              return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
            },
            message: "Invalid coordinates. Must be [longitude, latitude]",
          },
        },
        address: { type: String, trim: true, required: true },
        description: String,
        city: String,
        country: String,
        region: String,
        order: { type: Number, default: 0 },
        duration: { type: Number, default: 1 },
        activities: [String],
        accommodation: String,
      },
    ],
    geoFence: {
      radius: { type: Number, default: 5000, min: 0 },
      unit: {
        type: String,
        enum: ["meters", "kilometers", "miles"],
        default: "meters",
      },
    },
    included: [String],
    excluded: [String],
    itinerary: [
      {
        day: Number,
        title: String,
        description: String,
        activities: [String],
        meals: { breakfast: Boolean, lunch: Boolean, dinner: Boolean },
        accommodation: String,
        assignedGuides: [
          {
            guideId: { type: mongoose.Schema.ObjectId, ref: "User" },
            role: {
              type: String,
              enum: ["lead", "assistant", "specialist"],
              default: "assistant",
            },
          },
        ],
      },
    ],
    cancellationPolicy: {
      freeCancellation: { type: Boolean, default: true },
      deadlineDays: { type: Number, default: 7 },
      refundPercentage: { type: Number, default: 100, min: 0, max: 100 },
    },
    languages: [String],
    minimumAge: { type: Number, default: 0 },
    maximumAltitude: { type: Number },
    physicalRating: { type: Number, min: 1, max: 5, default: 3 },
    isSecret: { type: Boolean, default: false },
    secretCode: { type: String, unique: true, sparse: true, trim: true },
    secretAccessLevel: {
      type: String,
      enum: ["vip", "premium", "staff", "admin", "public"],
      default: "public",
    },
    secretReleaseDate: { type: Date },
    secretExpiryDate: { type: Date },
    secretMaxBookings: { type: Number, default: 10 },
    secretBookings: { type: Number, default: 0 },
    secretWhitelist: [
      {
        userId: { type: mongoose.Schema.ObjectId, ref: "User" },
        email: String,
        accessGrantedAt: { type: Date, default: Date.now },
        accessExpiresAt: Date,
      },
    ],
    secretViewCount: { type: Number, default: 0 },
    secretLastViewed: Date,
    secretMetadata: { type: Map, of: mongoose.Schema.Types.Mixed },
    isSecretArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ------------------------------------------------------------------ */
/*  Virtuals                                                          */
/* ------------------------------------------------------------------ */

tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
  options: { sort: { createdAt: -1 }, match: { status: "approved" } },
});
tourSchema.virtual("allReviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
  options: { sort: { createdAt: -1 } },
});
tourSchema.virtual("recentReviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
  options: {
    sort: { createdAt: -1 },
    limit: 5,
    match: { status: "approved" },
  },
});
tourSchema.virtual("topReviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
  options: {
    sort: { rating: -1, helpfulCount: -1 },
    limit: 3,
    match: { status: "approved" },
  },
});
tourSchema.virtual("reviewStats", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
  options: { match: { status: "approved" } },
  count: true,
});
tourSchema.virtual("guideUsers", {
  ref: "User",
  foreignField: "_id",
  localField: "guides",
  justOne: false,
});
tourSchema.virtual("leadGuideUser", {
  ref: "User",
  foreignField: "_id",
  localField: "guideDetails.leadGuide",
  justOne: true,
});
tourSchema.virtual("assistantGuideUsers", {
  ref: "User",
  foreignField: "_id",
  localField: "guideDetails.assistantGuides",
  justOne: false,
});
tourSchema.virtual("guideCount").get(function getGuideCount() {
  return this.guides ? this.guides.length : 0;
});
tourSchema.virtual("leadGuideInfo").get(function getLeadGuideInfo() {
  return this.guideDetails && this.guideDetails.leadGuide
    ? this.guideDetails.leadGuide
    : null;
});
tourSchema
  .virtual("assistantGuideCount")
  .get(function getAssistantGuideCount() {
    return this.guideDetails && this.guideDetails.assistantGuides
      ? this.guideDetails.assistantGuides.length
      : 0;
  });
tourSchema
  .virtual("activeGuideAssignments")
  .get(function getActiveGuideAssignments() {
    if (!this.guideDetails || !this.guideDetails.guideAssignments) return [];

    return this.guideDetails.guideAssignments.filter((a) => a.isActive);
  });
tourSchema.virtual("guideSummary").get(function getGuideSummary() {
  const details = this.guideDetails || {};
  const leadGuide = details.leadGuide || "Not assigned";
  const assistantCount = details.assistantGuides
    ? details.assistantGuides.length
    : 0;
  const totalGuides = this.guides ? this.guides.length : 0;

  return {
    totalGuides,
    leadGuide,
    assistantGuides: assistantCount,
    hasGuideAssignments: !!(
      details.guideAssignments && details.guideAssignments.length > 0
    ),
    guideToTouristRatio: details.requirements
      ? details.requirements.maxGuideToTouristRatio
      : null,
  };
});
tourSchema.virtual("hasGuideRequirements").get(function hasGuideRequirements() {
  return !!(this.guideDetails && this.guideDetails.requirements);
});
tourSchema.virtual("guideAverageRating").get(function getGuideAverageRating() {
  if (!this.guideRatings || this.guideRatings.length === 0) return 0;
  const total = this.guideRatings.reduce((s, r) => s + r.rating, 0);

  return Math.round((total / this.guideRatings.length) * 10) / 10;
});
tourSchema.virtual("isFullyStaffed").get(function isFullyStaffed() {
  const requirements = this.guideDetails?.requirements || {};
  const minGuides = requirements.minGuides || 1;
  const currentGuides = this.guides ? this.guides.length : 0;

  return currentGuides >= minGuides;
});
tourSchema.virtual("hasGuideCapacity").get(function hasGuideCapacity() {
  const requirements = this.guideDetails?.requirements || {};
  const maxGuides = requirements.maxGuides || 5;
  const currentGuides = this.guides ? this.guides.length : 0;

  return currentGuides < maxGuides;
});
tourSchema.virtual("reviewSummary").get(function getReviewSummary() {
  return {
    averageRating: this.ratingsAverage || 0,
    totalReviews: this.ratingsQuantity || 0,
    hasReviews: (this.ratingsQuantity || 0) > 0,
  };
});
tourSchema.virtual("hasReviews").get(function hasReviews() {
  return (this.ratingsQuantity || 0) > 0;
});
tourSchema.virtual("hasLocation").get(function hasLocation() {
  return !!(
    this.location &&
    Array.isArray(this.location.coordinates) &&
    this.location.coordinates.length === 2
  );
});

/* ------------------------ Helper: id compare ---------------------- */

function idsEqual(a, b) {
  if (!a || !b) return false;

  return a.toString() === b.toString();
}

/* ---------------------------- Methods ----------------------------- */

tourSchema.methods.addGuide = function addGuide(
  guideId,
  role = "assistant",
  startDate = new Date(),
  endDate = null,
) {
  if (!this.guides) this.guides = [];
  if (this.guides.some((id) => idsEqual(id, guideId)))
    throw new Error("Guide already assigned to this tour");
  const requirements = this.guideDetails?.requirements || {};
  const maxGuides = requirements.maxGuides || 5;

  if (this.guides.length >= maxGuides)
    throw new Error(`Maximum guide capacity of ${maxGuides} reached`);
  this.guides.push(guideId);
  if (this.guideDetails) {
    if (!this.guideDetails.guideAssignments)
      this.guideDetails.guideAssignments = [];
    let finalEndDate = endDate;

    if (!finalEndDate) {
      const lastStartDate =
        this.startDates && this.startDates.length > 0
          ? new Date(Math.max(...this.startDates.map((d) => new Date(d))))
          : new Date();

      finalEndDate = new Date(lastStartDate);
      finalEndDate.setDate(finalEndDate.getDate() + (this.duration || 1));
    }
    this.guideDetails.guideAssignments.push({
      guideId,
      role,
      startDate,
      endDate: finalEndDate,
      isActive: true,
    });
  }

  return this;
};

tourSchema.methods.removeGuide = function removeGuide(guideId) {
  if (!this.guides) throw new Error("No guides assigned to this tour");
  this.guides = this.guides.filter((id) => !idsEqual(id, guideId));
  if (this.guideDetails && this.guideDetails.guideAssignments) {
    const a = this.guideDetails.guideAssignments.find((x) =>
      idsEqual(x.guideId, guideId),
    );

    if (a) a.isActive = false;
  }

  return this;
};

tourSchema.methods.setLeadGuide = function setLeadGuide(guideId) {
  if (!this.guides || !this.guides.some((id) => idsEqual(id, guideId)))
    throw new Error("Guide must be assigned to the tour first");
  if (!this.guideDetails) this.guideDetails = {};
  this.guideDetails.leadGuide = guideId;
  if (this.guideDetails.guideAssignments) {
    const a = this.guideDetails.guideAssignments.find((x) =>
      idsEqual(x.guideId, guideId),
    );

    if (a) a.role = "lead";
  }

  return this;
};

tourSchema.methods.addGuideRating = function addGuideRating(
  guideId,
  rating,
  review = "",
  reviewerId = null,
  categories = {},
) {
  if (rating < 1 || rating > 5)
    throw new Error("Rating must be between 1 and 5");
  if (!this.guideRatings) this.guideRatings = [];
  this.guideRatings.push({
    guideId,
    rating,
    review,
    reviewerId,
    categories,
    createdAt: new Date(),
  });

  return this;
};

tourSchema.methods.getGuideRating = function getGuideRating(guideId) {
  if (!this.guideRatings) return null;
  const ratings = this.guideRatings.filter((r) => idsEqual(r.guideId, guideId));

  if (ratings.length === 0) return null;
  const average = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;

  return {
    average: Math.round(average * 10) / 10,
    count: ratings.length,
    ratings,
  };
};

tourSchema.methods.getGuideAssignment = function getGuideAssignment(guideId) {
  if (!this.guideDetails || !this.guideDetails.guideAssignments) return null;

  return (
    this.guideDetails.guideAssignments.find((a) =>
      idsEqual(a.guideId, guideId),
    ) || null
  );
};

tourSchema.methods.isGuideAssigned = function isGuideAssigned(guideId) {
  if (!this.guides) return false;

  return this.guides.some((id) => idsEqual(id, guideId));
};

tourSchema.methods.populateGuides = async function populateGuides() {
  await this.populate("guides")
    .populate("guideDetails.leadGuide")
    .populate("guideDetails.assistantGuides")
    .populate("guideDetails.guideAssignments.guideId")
    .populate("guideDetails.scheduling.backupGuides")
    .populate("guideRatings.guideId")
    .populate("guideRatings.reviewerId")
    .populate("itinerary.assignedGuides.guideId");

  return this;
};

tourSchema.methods.populateReviews = async function populateReviews(
  options = {},
) {
  const {
    type = "approved",
    limit = 10,
    skip = 0,
    sort = "-createdAt",
    populateUser = true,
    populateTour = false,
  } = options;
  let virtualField = "reviews";

  if (type === "all") virtualField = "allReviews";
  else if (type === "recent") virtualField = "recentReviews";
  else if (type === "top") virtualField = "topReviews";
  let query = this.populate({
    path: virtualField,
    options: { limit, skip, sort },
  });

  if (populateUser) {
    query = query.populate({
      path: `${virtualField}.user`,
      select: "name email profileImage role bio",
    });
  }
  if (populateTour && type !== "all") {
    query = query.populate({
      path: `${virtualField}.tour`,
      select: "name slug price duration difficulty imageCover",
    });
  }
  await query;

  return this;
};

tourSchema.methods.getPaginatedReviews = async function getPaginatedReviews(
  page = 1,
  limit = 10,
  sort = "-createdAt",
) {
  const skip = (page - 1) * limit;

  await this.populate({
    path: "reviews",
    options: { limit, skip, sort },
    populate: [{ path: "user", select: "name email profileImage role bio" }],
  });
  const Review = mongoose.model("Review");
  const total = await Review.countDocuments({
    tour: this._id,
    status: "approved",
  });

  return {
    reviews: this.reviews || [],
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
};

tourSchema.methods.getGeoJSON = function getGeoJSON() {
  if (!this.location || !this.location.coordinates) return null;

  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: this.location.coordinates },
    properties: {
      id: this._id,
      name: this.name,
      description: this.description,
      price: this.price,
      ratingsAverage: this.ratingsAverage,
      imageCover: this.imageCover,
      address: this.location.address,
      city: this.location.city,
      country: this.location.country,
    },
  };
};

tourSchema.methods.getLocationsGeoJSON = function getLocationsGeoJSON() {
  if (!this.locations || this.locations.length === 0) return null;

  return {
    type: "FeatureCollection",
    features: this.locations.map((loc, index) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: loc.coordinates },
      properties: {
        id: `${this._id}-${index}`,
        name: this.name,
        address: loc.address,
        city: loc.city,
        country: loc.country,
        order: loc.order,
        duration: loc.duration,
      },
    })),
  };
};

tourSchema.methods.distanceTo = function distanceTo(point) {
  if (!this.location || !this.location.coordinates) return null;
  const [lng1, lat1] = this.location.coordinates;
  const [lng2, lat2] = point;
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

tourSchema.methods.isWithinRadius = function isWithinRadius(
  point,
  radius = 5000,
) {
  const distance = this.distanceTo(point);

  return distance !== null && distance <= radius;
};

/* ---------------------------- Queries ----------------------------- */

tourSchema.query = {
  priceRange(min, max) {
    return this.where("price").gte(min).lte(max);
  },
  durationRange(min, max) {
    return this.where("duration").gte(min).lte(max);
  },
  byDifficulty(d) {
    return this.where("difficulty").equals(d);
  },
  minRating(r) {
    return this.where("ratingsAverage").gte(r);
  },
  available() {
    return this.where("startDates").elemMatch({ $gte: new Date() });
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
  byCategory(c) {
    return this.where("category").equals(c);
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
    return this.skip((page - 1) * limit).limit(limit);
  },
  selectBasic() {
    return this.select(
      "name slug price priceDiscount duration difficulty ratingsAverage ratingsQuantity imageCover summary location",
    );
  },
  selectDetailed() {
    return this.select(
      "name slug price priceDiscount duration difficulty ratingsAverage ratingsQuantity imageCover summary description images startDates guides maxGroupSize location locations guideDetails",
    );
  },
  withVirtuals() {
    return this.lean().select("+virtuals");
  },
  byGuide(g) {
    return this.where("guides").in([g]);
  },
  byLeadGuide(g) {
    return this.where("guideDetails.leadGuide").equals(g);
  },
  byGuideRole(r) {
    return this.where("guideDetails.guideAssignments.role").equals(r);
  },
  withGuideRequirements() {
    return this.where("guideDetails.requirements").exists(true);
  },
  byGuideLanguage(l) {
    return this.where("guideDetails.requirements.requiredLanguages").in([l]);
  },
  byGuideExperience(y = 0) {
    return this.where("guideDetails.requirements.minGuideExperience").gte(y);
  },
  withActiveGuideAssignments() {
    return this.where("guideDetails.guideAssignments.isActive").equals(true);
  },
  byGuideCapacity(min = 1, max = null) {
    let q = this.where("guideDetails.requirements.minGuides").gte(min);

    if (max !== null)
      q = q.where("guideDetails.requirements.maxGuides").lte(max);

    return q;
  },
  byGuideRating(r = 0) {
    return this.where("guideDetails.performance.rating").gte(r);
  },
  byCompensationType(t) {
    return this.where("guideDetails.compensation.type").equals(t);
  },
  hasGuideAvailability() {
    return this.where("guideDetails.scheduling.backupGuides").exists(true);
  },
  near(point, maxDistance = 5000, minDistance = 0) {
    const [lng, lat] = point;

    if (!point || !Array.isArray(point) || point.length !== 2)
      throw new Error("Invalid coordinates. Must be [longitude, latitude]");
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90)
      throw new Error(
        "Invalid coordinates. Longitude must be -180 to 180, latitude -90 to 90",
      );

    return this.where("location.coordinates").near({
      center: [lng, lat],
      maxDistance,
      minDistance,
      spherical: true,
    });
  },
  withinBox(sw, ne) {
    return this.where("location.coordinates").within({ box: [sw, ne] });
  },
  withinPolygon(p) {
    return this.where("location.coordinates").within({ polygon: p });
  },
  byCity(c) {
    return this.where("location.city").equals(c);
  },
  byCountry(c) {
    return this.where("location.country").equals(c);
  },
  byRegion(r) {
    return this.where("location.region").equals(r);
  },
  hasMultipleLocations() {
    return this.where("locations.0").exists(true);
  },
  locationCount(min = 1, max = null) {
    let q = this.where("locations").size(min);

    if (max !== null) q = q.where("locations").size(max);

    return q;
  },
  byLocationActivity(a) {
    return this.where("locations.activities").in([a]);
  },
  byLocationAccommodation(a) {
    return this.where("locations.accommodation").equals(a);
  },
  withGeoFence() {
    return this.where("geoFence.radius").gt(0);
  },
  includeSecret() {
    this._includeSecret = true;

    return this;
  },
  onlySecret() {
    return this.where("isSecret").equals(true);
  },
  bySecretAccessLevel(l) {
    return this.where("secretAccessLevel").equals(l);
  },
  bySecretCode(c) {
    return this.where("secretCode").equals(c);
  },
  secretAvailable() {
    return this.where("isSecret")
      .equals(true)
      .where("isSecretArchived")
      .equals(false)
      .where("secretExpiryDate")
      .gte(new Date())
      .where("secretBookings")
      .lt(this.where("secretMaxBookings"));
  },
  byWhitelistedUser(id) {
    return this.where("secretWhitelist.userId").equals(id);
  },
  secretReleaseDateRange(s, e) {
    return this.where("secretReleaseDate").gte(s).lte(e);
  },
  secretExpiryDateRange(s, e) {
    return this.where("secretExpiryDate").gte(s).lte(e);
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
  byCreator(id) {
    return this.where("createdBy").equals(id);
  },
  accessibleBy(id) {
    return this.where({ $or: [{ createdBy: id }, { guides: id }] });
  },
  sortByDistance(point) {
    const [lng, lat] = point;

    return this.aggregate([
      {
        $addFields: {
          distance: {
            $function: {
              body(coords, targetLng, targetLat) {
                if (!coords || coords.length !== 2) return null;
                const [lng, lat] = coords;
                const R = 6371000;
                const dLat = ((lat - targetLat) * Math.PI) / 180;
                const dLng = ((lng - targetLng) * Math.PI) / 180;
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos((targetLat * Math.PI) / 180) *
                    Math.cos((lat * Math.PI) / 180) *
                    Math.sin(dLng / 2) *
                    Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                return R * c;
              },
              args: ["$location.coordinates", lng, lat],
              lang: "js",
            },
          },
        },
      },
      { $sort: { distance: 1 } },
    ]);
  },
  sortByLocationCount(asc = false) {
    return this.sort({ locationCount: asc ? 1 : -1 });
  },
  sortByGuideCount(asc = false) {
    return this.sort({ guideCount: asc ? 1 : -1 });
  },
  sortByGuideRating(asc = false) {
    return this.sort({ "guideDetails.performance.rating": asc ? 1 : -1 });
  },
  sortByGuideExperience(asc = false) {
    return this.sort({
      "guideDetails.requirements.minGuideExperience": asc ? 1 : -1,
    });
  },
};

/* ================================================================== */
/*  MIDDLEWARE                                                        */
/* ================================================================== */

tourSchema.pre("save", function preSaveMiddleware() {
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
      const d = new Date();

      d.setMonth(d.getMonth() + 6);
      this.secretExpiryDate = d;
    }
  }

  const skipGuideCountValidation =
    this.isNew || this.$locals?.skipGuideCountValidation === true;

  if (this.guideDetails && this.guideDetails.requirements) {
    const { minGuides, maxGuides } = this.guideDetails.requirements;

    if (minGuides > maxGuides) {
      throw new Error("Minimum guides cannot be greater than maximum guides");
    }
    if (!skipGuideCountValidation) {
      const guideCount = Array.isArray(this.guides) ? this.guides.length : 0;

      if (guideCount < minGuides) {
        throw new Error(`Tour requires at least ${minGuides} guides`);
      }
      if (guideCount > maxGuides) {
        throw new Error(`Tour cannot have more than ${maxGuides} guides`);
      }
    }
  }

  if (
    this.guideDetails &&
    this.guideDetails.leadGuide &&
    Array.isArray(this.guides)
  ) {
    const leadAssigned = this.guides.some((id) =>
      idsEqual(id, this.guideDetails.leadGuide),
    );

    if (!leadAssigned) {
      throw new Error("Lead guide must be assigned to the tour");
    }
  }

  if (this.guideDetails && Array.isArray(this.guideDetails.guideAssignments)) {
    for (const assignment of this.guideDetails.guideAssignments) {
      const assigned =
        Array.isArray(this.guides) &&
        this.guides.some((id) => idsEqual(id, assignment.guideId));

      if (!assigned) {
        throw new Error(
          `Guide ${assignment.guideId} must be assigned to the tour`,
        );
      }
      if (
        assignment.startDate &&
        assignment.endDate &&
        assignment.startDate > assignment.endDate
      ) {
        throw new Error("Assignment start date must be before end date");
      }
    }
  }

  if (Array.isArray(this.itinerary)) {
    for (const day of this.itinerary) {
      if (Array.isArray(day.assignedGuides)) {
        for (const assigned of day.assignedGuides) {
          const isAssigned =
            Array.isArray(this.guides) &&
            this.guides.some((id) => idsEqual(id, assigned.guideId));

          if (!isAssigned) {
            throw new Error(
              `Guide ${assigned.guideId} must be assigned to the tour`,
            );
          }
        }
      }
    }
  }

  if (this.location && Array.isArray(this.location.coordinates)) {
    const [lng, lat] = this.location.coordinates;

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw new Error(
        "Invalid coordinates. Longitude must be -180 to 180, latitude -90 to 90",
      );
    }
  }

  if (Array.isArray(this.locations) && this.locations.length > 0) {
    for (const loc of this.locations) {
      if (!Array.isArray(loc.coordinates) || loc.coordinates.length !== 2) {
        throw new Error(`Invalid coordinates for location: ${loc.address}`);
      }
      const [lng, lat] = loc.coordinates;

      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new Error(`Invalid coordinates for location: ${loc.address}`);
      }
    }
  }
});

tourSchema.pre("find", function preFindMiddleware() {
  if (!this._skipActiveFilter) this.where("isActive").equals(true);
  if (!this._includeSecret && !this._skipSecretFilter)
    this.where("isSecret").equals(false);
  if (!this._sort) this.sort({ createdAt: -1 });
});

tourSchema.post("find", function postFindMiddleware(docs) {
  if (docs && docs.length > 0) {
    const secretCount = docs.filter((d) => d.isSecret).length;
    const locationCount = docs.filter((d) => d.hasLocation).length;
    const guideCount = docs.filter(
      (d) => d.guides && d.guides.length > 0,
    ).length;

    console.log(
      `🔍 Found ${docs.length} tours (${secretCount} secret tours, ${locationCount} with location, ${guideCount} with guides)`,
    );
  }
});

tourSchema.pre("findOne", function preFindOneMiddleware() {
  if (!this._skipActiveFilter) this.where("isActive").equals(true);
  if (!this._includeSecret && !this._skipSecretFilter)
    this.where("isSecret").equals(false);
});

tourSchema.post("findOne", function postFindOneMiddleware(doc) {
  if (doc) {
    const secretStatus = doc.isSecret ? "🔒 SECRET" : "📄";
    const locationStatus = doc.hasLocation ? "📍" : "📍❌";
    const guideStatus =
      doc.guides && doc.guides.length > 0
        ? `👥 ${doc.guides.length} guides`
        : "👥 No guides";

    console.log(
      `${secretStatus} ${locationStatus} ${guideStatus} Found tour: ${doc.name}`,
    );
  }
});

tourSchema.pre("count", function preCountMiddleware() {
  if (!this._skipActiveFilter) this.where("isActive").equals(true);
  if (!this._includeSecret && !this._skipSecretFilter)
    this.where("isSecret").equals(false);
});

tourSchema.pre("findById", function preFindByIdMiddleware() {
  if (!this._skipActiveFilter) this.where("isActive").equals(true);
  if (!this._includeSecret && !this._skipSecretFilter)
    this.where("isSecret").equals(false);
});

tourSchema.pre("aggregate", function preAggregateMiddleware() {
  const pipeline = this.pipeline();
  const shouldIncludeSecret = this._includeSecret || false;
  const firstStage = pipeline[0];
  const hasSecretFilter =
    firstStage &&
    firstStage.$match &&
    (firstStage.$match.isSecret !== undefined ||
      (firstStage.$match.$and &&
        firstStage.$match.$and.some((i) => i && i.isSecret !== undefined)));

  if (!hasSecretFilter && !shouldIncludeSecret) {
    const hasActiveFilter =
      firstStage &&
      firstStage.$match &&
      (firstStage.$match.isActive !== undefined ||
        (firstStage.$match.$and &&
          firstStage.$match.$and.some((i) => i && i.isActive !== undefined)));

    if (!hasActiveFilter) {
      this.pipeline().unshift({ $match: { isActive: true, isSecret: false } });
    } else if (firstStage && firstStage.$match) {
      firstStage.$match.isSecret = false;
    }
  }
});

tourSchema.post("aggregate", function postAggregateMiddleware(result) {
  if (result && result.length > 0) {
    const secretCount = result.filter((i) => i.isSecret).length;

    console.log(
      `📊 Aggregation returned ${result.length} documents (${secretCount} secret)`,
    );
  }
});

/* ================================================================== */
/*  INDEXES                                                           */
/*                                                                    */
/*  Design rules:                                                     */
/*    1. A compound index covers its prefixes — never declare both.   */
/*    2. Partial indexes on `isSecret: true` so secrets don't bloat.  */
/*    3. Every index must serve a real query in the app.              */
/*    4. `_id`, `slug`, `name`, `secretCode` are field-level unique   */
/*       indexes — do NOT redeclare them here.                        */
/* ================================================================== */

/* #1 CORE — every Tour.find() via the pre-find hook */
tourSchema.index({ isActive: 1, isSecret: 1, createdAt: -1 });

/* #2 SORT-FRIENDLY — cover the filters + user-chosen sort */
tourSchema.index({ isActive: 1, isSecret: 1, price: 1 });
tourSchema.index({ isActive: 1, isSecret: 1, ratingsAverage: -1 });
tourSchema.index({ isActive: 1, isSecret: 1, ratingsQuantity: -1 });
tourSchema.index({ isActive: 1, isSecret: 1, duration: 1 });

/* #3 FILTER INDEXES */
tourSchema.index({ category: 1, price: 1 });
tourSchema.index({ difficulty: 1, price: 1 });
tourSchema.index({ startDates: 1 });
tourSchema.index({ priceDiscount: 1 }, { sparse: true });
tourSchema.index({ featured: 1, ratingsAverage: -1 });

/* #4 OWNERSHIP / GUIDE INDEXES */
tourSchema.index({ createdBy: 1, isActive: 1, createdAt: -1 });
tourSchema.index({ guides: 1, isActive: 1, createdAt: -1 });
tourSchema.index({ "guideDetails.leadGuide": 1, isActive: 1, startDates: 1 });
tourSchema.index({ "guideDetails.guideAssignments.guideId": 1 });
tourSchema.index({ "guideDetails.guideAssignments.role": 1 });
tourSchema.index({ "guideRatings.guideId": 1 });
tourSchema.index({ "itinerary.assignedGuides.guideId": 1 });

/* #5 GEO — only two 2dsphere indexes, one per coordinates path */
tourSchema.index({ "location.coordinates": "2dsphere" });
tourSchema.index({ "locations.coordinates": "2dsphere" });

/* #6 LOCATION FILTERS */
tourSchema.index({ "location.city": 1, "location.country": 1 });
tourSchema.index({ "location.region": 1 });

/* #7 SECRET-TOUR — PARTIAL indexes, only index isSecret:true rows */
tourSchema.index(
  { secretAccessLevel: 1 },
  { partialFilterExpression: { isSecret: true } },
);
tourSchema.index(
  { secretReleaseDate: 1 },
  { partialFilterExpression: { isSecret: true } },
);
tourSchema.index(
  { secretExpiryDate: 1 },
  { partialFilterExpression: { isSecret: true } },
);
tourSchema.index(
  { "secretWhitelist.userId": 1 },
  { partialFilterExpression: { isSecret: true } },
);
tourSchema.index(
  { isSecret: 1, secretBookings: 1, secretMaxBookings: 1 },
  { partialFilterExpression: { isSecret: true } },
);
tourSchema.index(
  { secretAccessLevel: 1, secretReleaseDate: 1 },
  { partialFilterExpression: { isSecret: true } },
);

/* #8 TEXT SEARCH — only one text index per collection */
tourSchema.index(
  { name: "text", summary: "text", description: "text" },
  {
    weights: { name: 10, summary: 5, description: 1 },
    name: "TourTextIndex",
  },
);

/* ---------------------------- Statics ----------------------------- */

tourSchema.statics.findByGuide = function findByGuide(
  guideId,
  populateGuides = true,
) {
  let query = this.find({ guides: guideId });

  if (populateGuides) {
    query = query.populate("guides").populate("guideDetails.leadGuide");
  }

  return query.lean();
};

tourSchema.statics.findByGuideRole = function findByGuideRole(
  role,
  populateGuides = true,
) {
  let query = this.find({ "guideDetails.guideAssignments.role": role });

  if (populateGuides) {
    query = query.populate("guides").populate("guideDetails.leadGuide");
  }

  return query.lean();
};

tourSchema.statics.getGuideStatistics = function getGuideStatistics() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalTours: { $sum: 1 },
        totalGuides: { $sum: { $size: "$guides" } },
        averageGuidesPerTour: { $avg: { $size: "$guides" } },
        maxGuidesInTour: { $max: { $size: "$guides" } },
        minGuidesInTour: { $min: { $size: "$guides" } },
        toursWithLeadGuide: {
          $sum: {
            $cond: [{ $ifNull: ["$guideDetails.leadGuide", false] }, 1, 0],
          },
        },
        toursWithAssistantGuides: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ifNull: ["$guideDetails.assistantGuides", false] },
                  { $gt: [{ $size: "$guideDetails.assistantGuides" }, 0] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);
};

tourSchema.statics.getGuidePerformanceSummary =
  function getGuidePerformanceSummary(guideId) {
    return this.aggregate([
      { $match: { guides: guideId } },
      {
        $unwind: {
          path: "$guideRatings",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $match: { "guideRatings.guideId": guideId } },
      {
        $group: {
          _id: "$_id",
          tourName: { $first: "$name" },
          totalRatings: { $sum: 1 },
          averageRating: { $avg: "$guideRatings.rating" },
          averageKnowledge: { $avg: "$guideRatings.categories.knowledge" },
          averageCommunication: {
            $avg: "$guideRatings.categories.communication",
          },
          averageProfessionalism: {
            $avg: "$guideRatings.categories.professionalism",
          },
          averagePunctuality: {
            $avg: "$guideRatings.categories.punctuality",
          },
          averageHelpfulness: {
            $avg: "$guideRatings.categories.helpfulness",
          },
        },
      },
      {
        $group: {
          _id: null,
          tours: { $push: "$$ROOT" },
          totalTours: { $sum: 1 },
          overallAverageRating: { $avg: "$averageRating" },
        },
      },
    ]);
  };

const Tour = mongoose.models.Tour || mongoose.model("Tour", tourSchema);

export default Tour;
