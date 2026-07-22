class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.filterConditions = {};
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = [
      "page",
      "sort",
      "limit",
      "fields",
      "search",
      "minPrice",
      "maxPrice",
      "minRating",
      "maxRating",
      "startDate",
      "endDate",
    ];

    excludedFields.forEach((field) => delete queryObj[field]);

    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.filterConditions = JSON.parse(queryStr);
    this.query = this.query.find(this.filterConditions);

    return this;
  }

  search() {
    if (this.queryString.search) {
      const searchTerm = this.queryString.search.trim();

      const searchConditions = {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { summary: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
          { location: { $regex: searchTerm, $options: "i" } },
        ],
      };

      this.filterConditions = {
        ...this.filterConditions,
        ...searchConditions,
      };
      this.query = this.query.find(this.filterConditions);
    }

    return this;
  }

  priceRange() {
    const minPrice = parseInt(this.queryString.minPrice, 10);
    const maxPrice = parseInt(this.queryString.maxPrice, 10);

    if (minPrice || maxPrice) {
      const priceFilter = {};

      if (minPrice) priceFilter.$gte = minPrice;
      if (maxPrice) priceFilter.$lte = maxPrice;

      this.filterConditions.price = priceFilter;
      this.query = this.query.find(this.filterConditions);
    }

    return this;
  }

  ratingFilter() {
    const minRating = parseFloat(this.queryString.minRating);
    const maxRating = parseFloat(this.queryString.maxRating);

    if (minRating || maxRating) {
      const ratingFilter = {};

      if (minRating) ratingFilter.$gte = minRating;
      if (maxRating) ratingFilter.$lte = maxRating;

      this.filterConditions.ratingsAverage = ratingFilter;
      this.query = this.query.find(this.filterConditions);
    }

    return this;
  }

  dateRange() {
    const { startDate } = this.queryString;
    const { endDate } = this.queryString;

    if (startDate || endDate) {
      const dateFilter = {};

      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);

      this.filterConditions.startDates = dateFilter;
      this.query = this.query.find(this.filterConditions);
    }

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");

      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");

      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    const page = Math.max(1, parseInt(this.queryString.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(this.queryString.limit, 10) || 100),
    );
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  getTotalCount() {
    return this.query.model.countDocuments(this.filterConditions);
  }

  static getPaginationMetadata(totalCount, page, limit) {
    const totalPages = Math.ceil(totalCount / limit);

    return {
      currentPage: page,
      limit,
      totalPages,
      totalItems: totalCount,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    };
  }

  cloneForCount() {
    const cloned = new APIFeatures(this.query.model.find(), this.queryString);

    cloned.filterConditions = { ...this.filterConditions };

    return cloned;
  }
}

export default APIFeatures;
