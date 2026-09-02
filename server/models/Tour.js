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

    // ==================== ENHANCED GUIDES SECTION ====================
    // Main guides array with reference to User model
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "A tour must have at least one guide"],
        validate: {
          validator: function validateGuide(_value) {
            // This validation will be done in pre-save middleware
            return true;
          },
          message: "Invalid guide ID",
        },
      },
    ],

    // Enhanced guide details with additional metadata
    guideDetails: {
      // Lead guide information
      leadGuide: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: [true, "A tour must have a lead guide"],
        validate: {
          validator: function validateLeadGuide(_value) {
            // This validation will be done in pre-save middleware
            return true;
          },
          message: "Invalid lead guide ID",
        },
      },
      // Assistant guides
      assistantGuides: [
        {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
      ],
      // Guide assignments with specific roles and schedules
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
      // Guide requirements
      requirements: {
        minGuides: {
          type: Number,
          default: 1,
          min: 0,
        },
        maxGuides: {
          type: Number,
          default: 5,
          min: 1,
        },
        requiredLanguages: [String],
        preferredLanguages: [String],
        requiredCertifications: [String],
        preferredCertifications: [String],
        minGuideExperience: {
          type: Number,
          default: 0,
          min: 0,
        },
        maxGuideToTouristRatio: {
          type: Number,
          default: 20,
          min: 1,
        },
      },
      // Guide compensation
      compensation: {
        type: {
          type: String,
          enum: ["fixed", "percentage", "hourly", "daily", "perTourist"],
          default: "fixed",
        },
        amount: {
          type: Number,
          min: 0,
        },
        currency: {
          type: String,
          default: "USD",
          uppercase: true,
          maxlength: 3,
          minlength: 3,
        },
        notes: String,
      },
      // Guide availability and scheduling
      scheduling: {
        shiftPattern: {
          type: String,
          enum: ["fixed", "rotating", "flexible"],
          default: "fixed",
        },
        hoursPerDay: {
          type: Number,
          default: 8,
          min: 1,
          max: 24,
        },
        breakDuration: {
          type: Number,
          default: 60,
          min: 0,
        },
        overtimeAllowed: {
          type: Boolean,
          default: false,
        },
        daysOff: [String],
        // Alternative guides for backup
        backupGuides: [
          {
            type: mongoose.Schema.ObjectId,
            ref: "User",
          },
        ],
      },
      // Guide performance tracking
      performance: {
        rating: {
          type: Number,
          min: 0,
          max: 5,
          default: 0,
        },
        reviews: {
          type: Number,
          default: 0,
        },
        completedTours: {
          type: Number,
          default: 0,
        },
        attendanceRate: {
          type: Number,
          min: 0,
          max: 100,
          default: 100,
        },
        skills: [String],
        strengths: [String],
        areasForImprovement: [String],
      },
    },

    // Guide-specific ratings and feedback
    guideRatings: [
      {
        guideId: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        review: {
          type: String,
          trim: true,
          maxlength: 500,
        },
        reviewerId: {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        categories: {
          knowledge: {
            type: Number,
            min: 1,
            max: 5,
          },
          communication: {
            type: Number,
            min: 1,
            max: 5,
          },
          professionalism: {
            type: Number,
            min: 1,
            max: 5,
          },
          punctuality: {
            type: Number,
            min: 1,
            max: 5,
          },
          helpfulness: {
            type: Number,
            min: 1,
            max: 5,
          },
        },
      },
    ],

    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A tour must have a creator"],
    },
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
      description: {
        type: String,
        trim: true,
      },

      city: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
      region: {
        type: String,
        trim: true,
      },
      postalCode: {
        type: String,
        trim: true,
      },
      placeId: {
        type: String,
        trim: true,
      },
      formattedAddress: {
        type: String,
        trim: true,
      },
    },

    locations: [
      {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
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
        address: {
          type: String,
          trim: true,
          required: true,
        },
        description: String,
        city: String,
        country: String,
        region: String,
        order: {
          type: Number,
          default: 0,
        },
        duration: {
          type: Number,
          default: 1,
        },
        activities: [String],
        accommodation: String,
      },
    ],

    geoFence: {
      radius: {
        type: Number,
        default: 5000,
        min: 0,
      },
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
        meals: {
          breakfast: Boolean,
          lunch: Boolean,
          dinner: Boolean,
        },
        accommodation: String,
        // Assign guides to specific itinerary days
        assignedGuides: [
          {
            guideId: {
              type: mongoose.Schema.ObjectId,
              ref: "User",
            },
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

// ==================== GUIDE VIRTUALS ====================

// Get guide count
tourSchema.virtual("guideCount").get(function getGuideCount() {
  return this.guides ? this.guides.length : 0;
});

// Get lead guide
tourSchema.virtual("leadGuideInfo").get(function getLeadGuideInfo() {
  return this.guideDetails && this.guideDetails.leadGuide
    ? this.guideDetails.leadGuide
    : null;
});

// Get assistant guides
tourSchema
  .virtual("assistantGuideCount")
  .get(function getAssistantGuideCount() {
    return this.guideDetails && this.guideDetails.assistantGuides
      ? this.guideDetails.assistantGuides.length
      : 0;
  });

// Get active guide assignments
tourSchema
  .virtual("activeGuideAssignments")
  .get(function getActiveGuideAssignments() {
    if (!this.guideDetails || !this.guideDetails.guideAssignments) {
      return [];
    }

    return this.guideDetails.guideAssignments.filter(
      (assignment) => assignment.isActive,
    );
  });

// Get guide summary
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

// Check if tour has guide requirements
tourSchema.virtual("hasGuideRequirements").get(function hasGuideRequirements() {
  return !!(this.guideDetails && this.guideDetails.requirements);
});

// Get guide average rating
tourSchema.virtual("guideAverageRating").get(function getGuideAverageRating() {
  if (!this.guideRatings || this.guideRatings.length === 0) {
    return 0;
  }

  const total = this.guideRatings.reduce(
    (sum, rating) => sum + rating.rating,
    0,
  );

  return Math.round((total / this.guideRatings.length) * 10) / 10;
});

// Check if guide is fully staffed
tourSchema.virtual("isFullyStaffed").get(function isFullyStaffed() {
  const requirements = this.guideDetails?.requirements || {};
  const minGuides = requirements.minGuides || 1;
  const currentGuides = this.guides ? this.guides.length : 0;

  return currentGuides >= minGuides;
});

// Check if guide capacity is met
tourSchema.virtual("hasGuideCapacity").get(function hasGuideCapacity() {
  const requirements = this.guideDetails?.requirements || {};
  const maxGuides = requirements.maxGuides || 5;
  const currentGuides = this.guides ? this.guides.length : 0;

  return currentGuides < maxGuides;
});

// ==================== GUIDE METHODS ====================

// Add a guide to the tour
tourSchema.methods.addGuide = function addGuide(
  guideId,
  role = "assistant",
  startDate = new Date(),
  endDate = null,
) {
  if (!this.guides) {
    this.guides = [];
  }

  // Check if guide already exists
  if (this.guides.includes(guideId)) {
    throw new Error("Guide already assigned to this tour");
  }

  // Check guide capacity
  const requirements = this.guideDetails?.requirements || {};
  const maxGuides = requirements.maxGuides || 5;

  if (this.guides.length >= maxGuides) {
    throw new Error(`Maximum guide capacity of ${maxGuides} reached`);
  }

  // Add to guides array
  this.guides.push(guideId);

  // Add to guide assignments if guideDetails exists
  if (this.guideDetails) {
    if (!this.guideDetails.guideAssignments) {
      this.guideDetails.guideAssignments = [];
    }

    // Set end date to tour end if not provided
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

// Remove a guide from the tour
tourSchema.methods.removeGuide = function removeGuide(guideId) {
  if (!this.guides) {
    throw new Error("No guides assigned to this tour");
  }

  // Remove from guides array
  this.guides = this.guides.filter(
    (id) => id.toString() !== guideId.toString(),
  );

  // Deactivate assignment if exists
  if (this.guideDetails && this.guideDetails.guideAssignments) {
    const assignment = this.guideDetails.guideAssignments.find(
      (a) => a.guideId.toString() === guideId.toString(),
    );

    if (assignment) {
      assignment.isActive = false;
    }
  }

  return this;
};

// Set lead guide
tourSchema.methods.setLeadGuide = function setLeadGuide(guideId) {
  if (!this.guides || !this.guides.includes(guideId)) {
    throw new Error("Guide must be assigned to the tour first");
  }

  if (!this.guideDetails) {
    this.guideDetails = {};
  }

  this.guideDetails.leadGuide = guideId;

  // Update assignment role
  if (this.guideDetails.guideAssignments) {
    const assignment = this.guideDetails.guideAssignments.find(
      (a) => a.guideId.toString() === guideId.toString(),
    );

    if (assignment) {
      assignment.role = "lead";
    }
  }

  return this;
};

// Add guide rating
tourSchema.methods.addGuideRating = function addGuideRating(
  guideId,
  rating,
  review = "",
  reviewerId = null,
  categories = {},
) {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  if (!this.guideRatings) {
    this.guideRatings = [];
  }

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

// Get guide rating by guide ID
tourSchema.methods.getGuideRating = function getGuideRating(guideId) {
  if (!this.guideRatings) {
    return null;
  }

  const ratings = this.guideRatings.filter(
    (r) => r.guideId.toString() === guideId.toString(),
  );

  if (ratings.length === 0) {
    return null;
  }

  const average =
    ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  return {
    average: Math.round(average * 10) / 10,
    count: ratings.length,
    ratings,
  };
};

// Get guide assignment by guide ID
tourSchema.methods.getGuideAssignment = function getGuideAssignment(guideId) {
  if (!this.guideDetails || !this.guideDetails.guideAssignments) {
    return null;
  }

  return (
    this.guideDetails.guideAssignments.find(
      (a) => a.guideId.toString() === guideId.toString(),
    ) || null
  );
};

// Check if guide is assigned to tour
tourSchema.methods.isGuideAssigned = function isGuideAssigned(guideId) {
  if (!this.guides) {
    return false;
  }

  return this.guides.some((id) => id.toString() === guideId.toString());
};

// ==================== GUIDE QUERY METHODS ====================

tourSchema.query = {
  // Existing query methods...
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

  // ==================== GUIDE QUERY METHODS ====================

  // Find tours by guide ID
  byGuide(guideId) {
    return this.where("guides").in([guideId]);
  },

  // Find tours by lead guide
  byLeadGuide(guideId) {
    return this.where("guideDetails.leadGuide").equals(guideId);
  },

  // Find tours by guide role
  byGuideRole(role) {
    return this.where("guideDetails.guideAssignments.role").equals(role);
  },

  // Find tours with guide requirements
  withGuideRequirements() {
    return this.where("guideDetails.requirements").exists(true);
  },

  byGuideLanguage(language) {
    return this.where("guideDetails.requirements.requiredLanguages").in([
      language,
    ]);
  },

  byGuideExperience(minYears = 0) {
    return this.where("guideDetails.requirements.minGuideExperience").gte(
      minYears,
    );
  },

  withActiveGuideAssignments() {
    return this.where("guideDetails.guideAssignments.isActive").equals(true);
  },

  byGuideCapacity(min = 1, max = null) {
    let query = this.where("guideDetails.requirements.minGuides").gte(min);

    if (max !== null) {
      query = query.where("guideDetails.requirements.maxGuides").lte(max);
    }

    return query;
  },

  byGuideRating(minRating = 0) {
    return this.where("guideDetails.performance.rating").gte(minRating);
  },

  byCompensationType(type) {
    return this.where("guideDetails.compensation.type").equals(type);
  },

  fullyStaffed() {
    return this.where("guideDetails.requirements.minGuides").lte(
      this.where("guides.length"),
    );
  },

  hasGuideAvailability() {
    return this.where("guideDetails.scheduling.backupGuides").exists(true);
  },

  near(point, maxDistance = 5000, minDistance = 0) {
    const [lng, lat] = point;

    if (!point || !Array.isArray(point) || point.length !== 2) {
      throw new Error("Invalid coordinates. Must be [longitude, latitude]");
    }

    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw new Error(
        "Invalid coordinates. Longitude must be -180 to 180, latitude -90 to 90",
      );
    }

    return this.where("location.coordinates").near({
      center: [lng, lat],
      maxDistance,
      minDistance,
      spherical: true,
    });
  },

  withinBox(southWest, northEast) {
    return this.where("location.coordinates").within({
      box: [southWest, northEast],
    });
  },

  withinPolygon(polygon) {
    return this.where("location.coordinates").within({
      polygon,
    });
  },

  byCity(city) {
    return this.where("location.city").equals(city);
  },

  byCountry(country) {
    return this.where("location.country").equals(country);
  },

  byRegion(region) {
    return this.where("location.region").equals(region);
  },

  hasMultipleLocations() {
    return this.where("locations.0").exists(true);
  },

  locationCount(min = 1, max = null) {
    let query = this.where("locations").size(min);

    if (max !== null) {
      query = query.where("locations").size(max);
    }

    return query;
  },

  byLocationActivity(activity) {
    return this.where("locations.activities").in([activity]);
  },

  byLocationAccommodation(accommodation) {
    return this.where("locations.accommodation").equals(accommodation);
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

  byCreator(userId) {
    return this.where("createdBy").equals(userId);
  },

  accessibleBy(userId) {
    return this.where({
      $or: [{ createdBy: userId }, { guides: userId }],
    });
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

    if (this.guideDetails && this.guideDetails.requirements) {
      const { minGuides, maxGuides } = this.guideDetails.requirements;

      if (minGuides && maxGuides && minGuides > maxGuides) {
        throw new Error("Minimum guides cannot be greater than maximum guides");
      }

      if (this.guides && minGuides && this.guides.length < minGuides) {
        throw new Error(`Tour requires at least ${minGuides} guides`);
      }

      if (this.guides && maxGuides && this.guides.length > maxGuides) {
        throw new Error(`Tour cannot have more than ${maxGuides} guides`);
      }
    }

    if (this.guideDetails && this.guideDetails.leadGuide) {
      if (!this.guides || !this.guides.includes(this.guideDetails.leadGuide)) {
        throw new Error("Lead guide must be assigned to the tour");
      }
    }

    if (this.guideDetails && this.guideDetails.guideAssignments) {
      for (const assignment of this.guideDetails.guideAssignments) {
        if (!this.guides || !this.guides.includes(assignment.guideId)) {
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

    if (this.itinerary) {
      for (const day of this.itinerary) {
        if (day.assignedGuides) {
          for (const assigned of day.assignedGuides) {
            if (!this.guides || !this.guides.includes(assigned.guideId)) {
              throw new Error(
                `Guide ${assigned.guideId} must be assigned to the tour`,
              );
            }
          }
        }
      }
    }

    if (this.location && this.location.coordinates) {
      const [lng, lat] = this.location.coordinates;

      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new Error(
          "Invalid coordinates. Longitude must be -180 to 180, latitude -90 to 90",
        );
      }
    }

    if (this.locations && this.locations.length > 0) {
      for (const loc of this.locations) {
        const [lng, lat] = loc.coordinates;

        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          throw new Error(`Invalid coordinates for location: ${loc.address}`);
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

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
      const locationCount = docs.filter((doc) => doc.hasLocation).length;
      const guideCount = docs.filter(
        (doc) => doc.guides && doc.guides.length > 0,
      ).length;

      console.log(
        `🔍 Found ${docs.length} tours (${secretCount} secret tours, ${locationCount} with location, ${guideCount} with guides)`,
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
      const locationStatus = doc.hasLocation ? "📍" : "📍❌";
      const guideStatus =
        doc.guides && doc.guides.length > 0
          ? `👥 ${doc.guides.length} guides`
          : "👥 No guides";

      console.log(
        `${secretStatus} ${locationStatus} ${guideStatus} Found tour: ${doc.name}`,
      );
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

tourSchema.index({ guides: 1 });
tourSchema.index({ "guideDetails.leadGuide": 1 });
tourSchema.index({ "guideDetails.guideAssignments.guideId": 1 });
tourSchema.index({ "guideDetails.guideAssignments.role": 1 });
tourSchema.index({ "guideDetails.requirements.minGuides": 1 });
tourSchema.index({ "guideDetails.requirements.maxGuides": 1 });
tourSchema.index({ "guideDetails.requirements.requiredLanguages": 1 });
tourSchema.index({ "guideDetails.performance.rating": 1 });
tourSchema.index({ "guideDetails.compensation.type": 1 });
tourSchema.index({ "guideDetails.scheduling.backupGuides": 1 });
tourSchema.index({ "guideRatings.guideId": 1 });
tourSchema.index({ "itinerary.assignedGuides.guideId": 1 });

tourSchema.index({ guides: 1, isActive: 1 });
tourSchema.index({ "guideDetails.leadGuide": 1, isActive: 1 });
tourSchema.index({ guides: 1, startDates: 1 });
tourSchema.index({ "guideDetails.leadGuide": 1, startDates: 1 });

tourSchema.index({ "location.coordinates": "2dsphere" });
tourSchema.index({ "locations.coordinates": "2dsphere" });

tourSchema.index(
  { "location.coordinates": "2dsphere", "locations.coordinates": "2dsphere" },
  { sparse: true },
);

tourSchema.index({ "location.city": 1 });
tourSchema.index({ "location.country": 1 });
tourSchema.index({ "location.region": 1 });
tourSchema.index({ "location.address": "text" });

tourSchema.index({ "locations.city": 1 });
tourSchema.index({ "locations.country": 1 });
tourSchema.index({ "locations.region": 1 });
tourSchema.index({ "locations.address": "text" });

tourSchema.index({ "geoFence.radius": 1 });

tourSchema.index({ isActive: 1, featured: 1, ratingsAverage: -1 });
tourSchema.index({ category: 1, price: 1, duration: 1 });
tourSchema.index({ isActive: 1, isSecret: 1, createdAt: -1 });

tourSchema.index({
  "location.coordinates": "2dsphere",
  price: 1,
  ratingsAverage: -1,
});
tourSchema.index({
  "locations.coordinates": "2dsphere",
  price: 1,
  ratingsAverage: -1,
});

tourSchema.index({ "location.coordinates": "2dsphere", category: 1 });
tourSchema.index({ "locations.coordinates": "2dsphere", category: 1 });

tourSchema.index({ "location.coordinates": "2dsphere", difficulty: 1 });
tourSchema.index({ "locations.coordinates": "2dsphere", difficulty: 1 });

tourSchema.index({ createdBy: 1 });
tourSchema.index({ createdBy: 1, isActive: 1 });
tourSchema.index({ guides: 1 });
tourSchema.index({ guides: 1, isActive: 1 });

tourSchema.index({ createdBy: 1, isActive: 1, createdAt: -1 });
tourSchema.index({ guides: 1, isActive: 1, createdAt: -1 });

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
      {
        $match: {
          "guideRatings.guideId": guideId,
        },
      },
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
          averagePunctuality: { $avg: "$guideRatings.categories.punctuality" },
          averageHelpfulness: { $avg: "$guideRatings.categories.helpfulness" },
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

tourSchema.methods.getGeoJSON = function getGeoJSON() {
  if (!this.location || !this.location.coordinates) return null;

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: this.location.coordinates,
    },
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
      geometry: {
        type: "Point",
        coordinates: loc.coordinates,
      },
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

const Tour = mongoose.models.Tour || mongoose.model("Tour", tourSchema);

export default Tour;
