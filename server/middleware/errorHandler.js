export const errorHandler = (err, req, res) => {
  let error = { ...err };

  error.message = err.message;

  console.error("Error:", err);

  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`;

    error = { message, statusCode: 404 };
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `Duplicate field value: ${field}. Please use another value`;

    error = { message, statusCode: 400 };
  }

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message);

    error = { message: message.join(", "), statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);

  res.status(404);
  next(error);
};
