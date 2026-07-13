// controllers/tourController.js

// Sample in-memory data (replace with database later)
let tours = [
  {
    id: 1,
    name: "Paris Explorer",
    duration: 5,
    maxGroupSize: 15,
    difficulty: "easy",
    price: 499,
    rating: 4.8,
    description: "Explore the beautiful city of Paris",
    startDates: ["2026-08-15", "2026-09-01"],
  },
  {
    id: 2,
    name: "Alpine Adventure",
    duration: 7,
    maxGroupSize: 10,
    difficulty: "medium",
    price: 799,
    rating: 4.9,
    description: "Hike through the Swiss Alps",
    startDates: ["2026-07-10", "2026-08-05"],
  },
];

// Get all tours
export const getAllTours = (req, res) => {
  try {
    res.status(200).json({
      status: "success",
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get a single tour by ID
export const getTour = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const tour = tours.find((t) => t.id === id);

    if (!tour) {
      return res.status(404).json({
        status: "fail",
        message: "Tour not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Create a new tour
export const createTour = (req, res) => {
  try {
    const newTour = {
      id: tours.length > 0 ? Math.max(...tours.map((t) => t.id)) + 1 : 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    };

    // Basic validation
    if (!newTour.name || !newTour.price || !newTour.difficulty) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide name, price, and difficulty",
      });
    }

    tours.push(newTour);

    res.status(201).json({
      status: "success",
      data: {
        tour: newTour,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update a tour (PATCH - partial update)
export const updateTour = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const tourIndex = tours.findIndex((t) => t.id === id);

    if (tourIndex === -1) {
      return res.status(404).json({
        status: "fail",
        message: "Tour not found",
      });
    }

    // Update only the fields provided in the request
    tours[tourIndex] = {
      ...tours[tourIndex],
      ...req.body,
      id: tours[tourIndex].id, // Keep the original ID
    };

    res.status(200).json({
      status: "success",
      data: {
        tour: tours[tourIndex],
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// Delete a tour
export const deleteTour = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const tourIndex = tours.findIndex((t) => t.id === id);

    if (tourIndex === -1) {
      return res.status(404).json({
        status: "fail",
        message: "Tour not found",
      });
    }

    // Remove the tour
    tours.splice(tourIndex, 1);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
