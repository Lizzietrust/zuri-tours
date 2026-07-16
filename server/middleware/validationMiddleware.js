export const checkValidId = (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id) || id < 0) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid ID format. ID must be a positive number",
    });
  }

  req.parsedId = id;
  next();
};

export const checkTourBody = (req, res, next) => {
  const { name, price, difficulty } = req.body;

  if (!name) {
    return res.status(400).json({
      status: "fail",
      message: "Missing tour name. Please provide a name for the tour",
    });
  }

  if (price === undefined || price === null) {
    return res.status(400).json({
      status: "fail",
      message: "Missing tour price. Please provide a price for the tour",
    });
  }

  if (typeof price !== "number" || price < 0) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid price. Price must be a positive number",
    });
  }

  if (!difficulty) {
    return res.status(400).json({
      status: "fail",
      message:
        "Missing tour difficulty. Please provide difficulty level (easy/medium/hard)",
    });
  }

  next();
};

export const checkUserBody = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name) {
    return res.status(400).json({
      status: "fail",
      message: "Missing user name. Please provide a name",
    });
  }

  if (!email) {
    return res.status(400).json({
      status: "fail",
      message: "Missing user email. Please provide an email address",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid email format. Please provide a valid email address",
    });
  }

  if (!password) {
    return res.status(400).json({
      status: "fail",
      message: "Missing password. Please provide a password",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      status: "fail",
      message: "Password must be at least 6 characters long",
    });
  }

  next();
};
