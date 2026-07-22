import Tour from "../models/Tour.js";

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "search"];

    excludedFields.forEach((field) => delete queryObj[field]);

    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

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
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  search() {
    if (this.queryString.search) {
      const searchTerm = this.queryString.search;

      this.query = this.query.find({
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { summary: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
        ],
      });
    }

    return this;
  }
}

export const getAllTours = async (req, res) => {
  try {
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .search()
      .sort()
      .limitFields()
      .paginate();

    const tours = await features.query;

    const filterFeatures = new APIFeatures(Tour.find(), req.query)
      .filter()
      .search();
    const filteredCount = await filterFeatures.query.countDocuments();

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const totalPages = Math.ceil(filteredCount / limit);

    res.status(200).json({
      success: true,
      results: tours.length,
      pagination: {
        currentPage: page,
        limit,
        totalPages,
        totalItems: filteredCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
      data: {
        tours,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getTour = async (req, res) => {
  try {
    let tour;

    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      tour = await Tour.findById(req.params.id).populate({
        path: "reviews",
        select: "review rating user",
      });
    } else {
      tour = await Tour.findOne({ slug: req.params.id }).populate({
        path: "reviews",
        select: "review rating user",
      });
    }

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const createTour = async (req, res) => {
  try {
    const tour = await Tour.create(req.body);

    res.status(201).json({
      success: true,
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const updateTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour not found",
      });
    }

    res.status(200).json({
      success: true,
      data: null,
      message: "Tour deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: "$difficulty",
          numTours: { $sum: 1 },
          numRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);

    const overallStats = await Tour.aggregate([
      {
        $group: {
          _id: null,
          totalTours: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          avgRating: { $avg: "$ratingsAverage" },
          totalRatings: { $sum: "$ratingsQuantity" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: overallStats[0] || {},
        byDifficulty: stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getMonthlyPlan = async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10) || new Date().getFullYear();

    const plan = await Tour.aggregate([
      {
        $unwind: "$startDates",
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDates" },
          numTourStarts: { $sum: 1 },
          tours: { $push: "$name" },
        },
      },
      {
        $addFields: { month: "$_id" },
      },
      {
        $project: {
          _id: 0,
          month: 1,
          numTourStarts: 1,
          tours: 1,
        },
      },
      {
        $sort: { month: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getToursByPriceRange = async (req, res) => {
  try {
    const minPrice = parseInt(req.query.min, 10) || 0;
    const maxPrice = parseInt(req.query.max, 10) || 10000;

    const tours = await Tour.find({
      price: { $gte: minPrice, $lte: maxPrice },
    })
      .sort("price")
      .select("name price difficulty ratingsAverage");

    res.status(200).json({
      success: true,
      count: tours.length,
      data: {
        tours,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getTopCheapTours = async (req, res) => {
  try {
    const tours = await Tour.find()
      .sort("price")
      .limit(5)
      .select("name price difficulty ratingsAverage");

    res.status(200).json({
      success: true,
      count: tours.length,
      data: {
        tours,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getToursByDifficulty = async (req, res) => {
  try {
    const { level } = req.params;
    const validLevels = ["easy", "medium", "difficult"];

    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: "Invalid difficulty level. Use: easy, medium, or difficult",
      });
    }

    const tours = await Tour.find({ difficulty: level })
      .sort("price")
      .select("name price duration ratingsAverage");

    res.status(200).json({
      success: true,
      count: tours.length,
      data: {
        tours,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
