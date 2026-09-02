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

tourSchema.virtual("location.coordinates").get(function getCoordinates() {
  return this.location && this.location.coordinates
    ? this.location.coordinates
    : null;
});

tourSchema.virtual("geoJSON").get(function getGeoJSON() {
  if (!this.location || !this.location.coordinates) return null;

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: this.location.coordinates,
    },
    properties: {
      name: this.name,
      address: this.location.address,
      city: this.location.city,
      country: this.location.country,
    },
  };
});

tourSchema.virtual("centerPoint").get(function getCenterPoint() {
  if (!this.locations || this.locations.length === 0) {
    return this.location ? this.location.coordinates : null;
  }

  const coords = this.locations.map((loc) => loc.coordinates);

  const latSum = coords.reduce((sum, coord) => sum + coord[1], 0);
  const lngSum = coords.reduce((sum, coord) => sum + coord[0], 0);

  return [lngSum / coords.length, latSum / coords.length];
});

tourSchema.virtual("locationCount").get(function getLocationCount() {
  if (this.locations) {
    return this.locations.length;
  }

  return this.location ? 1 : 0;
});

tourSchema.virtual("locationSummary").get(function getLocationSummary() {
  const parts = [];

  if (this.location) {
    if (this.location.city) parts.push(this.location.city);
    if (this.location.country) parts.push(this.location.country);
    if (this.location.address) parts.push(this.location.address);

    if (parts.length > 0) return parts.join(", ");
  }

  if (this.locations && this.locations.length > 0) {
    const uniqueCities = [
      ...new Set(this.locations.map((l) => l.city).filter(Boolean)),
    ];
    const uniqueCountries = [
      ...new Set(this.locations.map((l) => l.country).filter(Boolean)),
    ];

    if (uniqueCities.length > 0) {
      if (uniqueCities.length > 3) {
        return `${uniqueCities.slice(0, 3).join(", ")} + ${uniqueCities.length - 3} more cities`;
      }

      return uniqueCities.join(", ");
    }

    if (uniqueCountries.length > 0) {
      if (uniqueCountries.length > 2) {
        return `${uniqueCountries.slice(0, 2).join(", ")} + ${uniqueCountries.length - 2} more countries`;
      }

      return uniqueCountries.join(", ");
    }
  }

  return "Location not specified";
});

tourSchema.virtual("hasLocation").get(function hasLocation() {
  return !!(
    this.location &&
    this.location.coordinates &&
    this.location.coordinates.length === 2
  );
});

tourSchema.virtual("hasMultipleLocations").get(function hasMultipleLocations() {
  return !!(this.locations && this.locations.length > 1);
});

tourSchema.methods.getNearestLocation = function getNearestLocation(point) {
  if (!this.locations || this.locations.length === 0) {
    return this.location;
  }

  const [targetLng, targetLat] = point;
  let nearest = null;
  let minDistance = Infinity;

  for (const location of this.locations) {
    const [lng, lat] = location.coordinates;
    const distance = Math.sqrt((lng - targetLng) ** 2 + (lat - targetLat) ** 2);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = location;
    }
  }

  return nearest;
};

tourSchema.methods.getSortedLocationsByDistance =
  function getSortedLocationsByDistance(point) {
    if (!this.locations || this.locations.length === 0) {
      return [];
    }

    const [targetLng, targetLat] = point;

    return [...this.locations].sort((a, b) => {
      const [aLng, aLat] = a.coordinates;
      const [bLng, bLat] = b.coordinates;
      const distA = Math.sqrt(
        (aLng - targetLng) ** 2 + (aLat - targetLat) ** 2,
      );
      const distB = Math.sqrt(
        (bLng - targetLng) ** 2 + (bLat - targetLat) ** 2,
      );

      return distA - distB;
    });
  };

tourSchema.methods.calculateDistance = function calculateDistance(
  coord1,
  coord2,
) {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

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
      "name slug price priceDiscount duration difficulty ratingsAverage ratingsQuantity imageCover summary location",
    );
  },

  selectDetailed() {
    return this.select(
      "name slug price priceDiscount duration difficulty ratingsAverage ratingsQuantity imageCover summary description images startDates guides maxGroupSize location locations",
    );
  },

  withVirtuals() {
    return this.lean().select("+virtuals");
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

  // Find tours with specific location count
  locationCount(min = 1, max = null) {
    let query = this.where("locations").size(min);

    if (max !== null) {
      query = query.where("locations").size(max);
    }

    return query;
  },

  // Find tours by location activity
  byLocationActivity(activity) {
    return this.where("locations.activities").in([activity]);
  },

  // Find tours by accommodation type at locations
  byLocationAccommodation(accommodation) {
    return this.where("locations.accommodation").equals(accommodation);
  },

  // Find tours with geo-fence
  withGeoFence() {
    return this.where("geoFence.radius").gt(0);
  },

  // Enhanced secret methods
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

  // Enhanced location sorting
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

  // Sort by number of locations
  sortByLocationCount(asc = false) {
    return this.sort({ locationCount: asc ? 1 : -1 });
  },
};

// ==================== MIDDLEWARE ====================

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

      console.log(
        `🔍 Found ${docs.length} tours (${secretCount} secret tours, ${locationCount} with location)`,
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

      console.log(`${secretStatus} ${locationStatus} Found tour: ${doc.name}`);
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
    // Generate secret code if needed
    if (this.isSecret && !this.secretCode) {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();

      this.secretCode = `SEC-${Date.now().toString(36).toUpperCase()}-${random}`;
    }

    // Set secret defaults
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

    // Validate geospatial data
    if (this.location && this.location.coordinates) {
      const [lng, lat] = this.location.coordinates;

      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        throw new Error(
          "Invalid coordinates. Longitude must be -180 to 180, latitude -90 to 90",
        );
      }
    }

    // Validate multiple locations
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

// ==================== INDEXES ====================

// Secret indexes
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

// Basic indexes
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startDates: 1 });
tourSchema.index({ difficulty: 1 });
tourSchema.index({ duration: 1 });
tourSchema.index({ name: "text", summary: "text", description: "text" });

tourSchema.index({ category: 1 });
tourSchema.index({ featured: 1, ratingsAverage: -1 });
tourSchema.index({ isActive: 1, createdAt: -1 });

// Geospatial indexes
// 2dsphere index for location (main location)
tourSchema.index({ "location.coordinates": "2dsphere" });

// 2dsphere index for multiple locations
tourSchema.index({ "locations.coordinates": "2dsphere" });

// Combined geospatial index
tourSchema.index(
  { "location.coordinates": "2dsphere", "locations.coordinates": "2dsphere" },
  { sparse: true },
);

// Location metadata indexes
tourSchema.index({ "location.city": 1 });
tourSchema.index({ "location.country": 1 });
tourSchema.index({ "location.region": 1 });
tourSchema.index({ "location.address": "text" });

tourSchema.index({ "locations.city": 1 });
tourSchema.index({ "locations.country": 1 });
tourSchema.index({ "locations.region": 1 });
tourSchema.index({ "locations.address": "text" });

// Geo-fence index
tourSchema.index({ "geoFence.radius": 1 });

// Combined indexes for common queries
tourSchema.index({ isActive: 1, featured: 1, ratingsAverage: -1 });
tourSchema.index({ category: 1, price: 1, duration: 1 });
tourSchema.index({ isActive: 1, isSecret: 1, createdAt: -1 });

// Location + price + rating
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

// Location + category
tourSchema.index({ "location.coordinates": "2dsphere", category: 1 });
tourSchema.index({ "locations.coordinates": "2dsphere", category: 1 });

// Location + difficulty
tourSchema.index({ "location.coordinates": "2dsphere", difficulty: 1 });
tourSchema.index({ "locations.coordinates": "2dsphere", difficulty: 1 });

// User related indexes
tourSchema.index({ createdBy: 1 });
tourSchema.index({ createdBy: 1, isActive: 1 });
tourSchema.index({ guides: 1 });
tourSchema.index({ guides: 1, isActive: 1 });

tourSchema.index({ createdBy: 1, isActive: 1, createdAt: -1 });
tourSchema.index({ guides: 1, isActive: 1, createdAt: -1 });

// ==================== STATIC METHODS ====================

// Find tours near a point with distance calculation
tourSchema.statics.findNear = function findNear(
  point,
  maxDistance = 5000,
  minDistance = 0,
  limit = 10,
) {
  const [lng, lat] = point;

  return this.find()
    .where("location.coordinates")
    .near({
      center: [lng, lat],
      maxDistance,
      minDistance,
      spherical: true,
    })
    .limit(limit)
    .lean();
};

// Find tours by bounding box
tourSchema.statics.findInBoundingBox = function findInBoundingBox(
  southWest,
  northEast,
  limit = 10,
) {
  return this.find()
    .where("location.coordinates")
    .within({
      box: [southWest, northEast],
    })
    .limit(limit)
    .lean();
};

// Find tours with location metadata
tourSchema.statics.findByLocationMetadata = function findByLocationMetadata(
  city = null,
  country = null,
  region = null,
) {
  const query = {};

  if (city) query["location.city"] = city;
  if (country) query["location.country"] = country;
  if (region) query["location.region"] = region;

  return this.find(query).lean();
};

// Get location statistics
tourSchema.statics.getLocationStatistics = function getLocationStatistics() {
  return this.aggregate([
    {
      $group: {
        _id: "$location.country",
        count: { $sum: 1 },
        tours: { $push: { name: "$name", city: "$location.city" } },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Get tours by distance from multiple points
tourSchema.statics.findByMultiplePoints = function findByMultiplePoints(
  points,
  maxDistance = 5000,
) {
  const orConditions = points.map((point) => ({
    "location.coordinates": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: point,
        },
        $maxDistance: maxDistance,
      },
    },
  }));

  return this.find({ $or: orConditions }).lean();
};

// Get tours with locations
tourSchema.statics.getToursWithLocation = function getToursWithLocation() {
  return this.find({
    "location.coordinates": { $exists: true, $ne: null },
  }).lean();
};

// ==================== MODEL CREATION ====================

// Add geospatial helper methods to schema
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

// Get multiple locations as GeoJSON
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

// Calculate distance to a point
tourSchema.methods.distanceTo = function distanceTo(point) {
  if (!this.location || !this.location.coordinates) return null;

  const [lng1, lat1] = this.location.coordinates;
  const [lng2, lat2] = point;

  const R = 6371000; // Earth's radius in meters
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

// Check if point is within radius
tourSchema.methods.isWithinRadius = function isWithinRadius(
  point,
  radius = 5000,
) {
  const distance = this.distanceTo(point);

  return distance !== null && distance <= radius;
};

const Tour = mongoose.models.Tour || mongoose.model("Tour", tourSchema);

export default Tour;
