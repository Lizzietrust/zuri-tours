import APIFeatures from "../utils/APIFeatures.js";
import Tour from "../models/Tour.js";

class TourQueryService {
  static buildQuery(queryString) {
    return new APIFeatures(Tour.find(), queryString)
      .filter()
      .search()
      .priceRange()
      .ratingFilter()
      .dateRange()
      .sort()
      .limitFields()
      .paginate();
  }

  static async executePaginatedQuery(queryString) {
    const features = this.buildQuery(queryString);

    const [tours, totalCount] = await Promise.all([
      features.query,
      features.getTotalCount(),
    ]);

    const page = Math.max(1, parseInt(queryString.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(queryString.limit, 10) || 100),
    );

    const pagination = features.getPaginationMetadata(totalCount, page, limit);

    return {
      tours,
      pagination,
      count: tours.length,
    };
  }

  static async getToursMinimal(queryString) {
    const features = new APIFeatures(Tour.find(), queryString)
      .filter()
      .search()
      .priceRange()
      .ratingFilter()
      .sort()
      .limitFields()
      .paginate();

    const tours = await features.query.select(
      "name price difficulty duration ratingsAverage",
    );
    const totalCount = await features.getTotalCount();

    return { tours, totalCount };
  }

  static getTourById(id, populateOptions = {}) {
    const query = Tour.findById(id);

    const defaultPopulate = [
      { path: "reviews", select: "review rating user createdAt" },
      { path: "guides", select: "name email photo" },
    ];

    const populate = populateOptions.populate || defaultPopulate;

    populate.forEach((opt) => query.populate(opt));

    return query;
  }

  static getTourBySlug(slug, populateOptions = {}) {
    const query = Tour.findOne({ slug });

    const defaultPopulate = [
      { path: "reviews", select: "review rating user createdAt" },
      { path: "guides", select: "name email photo" },
    ];

    const populate = populateOptions.populate || defaultPopulate;

    populate.forEach((opt) => query.populate(opt));

    return query;
  }

  static advancedSearch(searchParams) {
    const {
      q,
      location,
      minPrice,
      maxPrice,
      difficulty,
      minRating,
      maxDuration,
    } = searchParams;

    const searchQuery = {};

    if (q) {
      searchQuery.$or = [
        { name: { $regex: q, $options: "i" } },
        { summary: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (location) {
      searchQuery.location = { $regex: location, $options: "i" };
    }

    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = parseInt(minPrice, 10);
      if (maxPrice) searchQuery.price.$lte = parseInt(maxPrice, 10);
    }

    if (difficulty && ["easy", "medium", "difficult"].includes(difficulty)) {
      searchQuery.difficulty = difficulty;
    }

    if (minRating) {
      searchQuery.ratingsAverage = { $gte: parseFloat(minRating) };
    }

    if (maxDuration) {
      searchQuery.duration = { $lte: parseInt(maxDuration, 10) };
    }

    return Tour.find(searchQuery)
      .sort("-createdAt")
      .select("name price difficulty duration ratingsAverage location");
  }
}

export default TourQueryService;
