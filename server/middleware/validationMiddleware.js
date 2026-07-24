import mongoose from "mongoose";
import { sendValidationErrorResponse } from "../utils/responseHelper.js";

export const checkValidId = (req, res, next) => {
  const { id } = req.params;

  if (mongoose.Types.ObjectId.isValid(id)) {
    req.parsedId = id;

    return next();
  }

  const numericId = parseInt(id, 10);

  if (!Number.isNaN(numericId) && numericId >= 0) {
    req.parsedId = numericId;

    return next();
  }

  return sendValidationErrorResponse(
    res,
    "Invalid ID format. ID must be a valid ObjectId or positive number",
  );
};

export const checkTourBody = (req, res, next) => {
  const { name, price, difficulty } = req.body;

  if (!name) {
    return sendValidationErrorResponse(
      res,
      "Missing tour name. Please provide a name for the tour",
    );
  }

  if (price === undefined || price === null) {
    return sendValidationErrorResponse(
      res,
      "Missing tour price. Please provide a price for the tour",
    );
  }

  if (typeof price !== "number" || price < 0) {
    return sendValidationErrorResponse(
      res,
      "Invalid price. Price must be a positive number",
    );
  }

  if (!difficulty) {
    return sendValidationErrorResponse(
      res,
      "Missing tour difficulty. Please provide difficulty level (easy/medium/hard)",
    );
  }

  next();
};

export const validateUser = (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  const errors = [];

  if (!name) {
    errors.push("Name is required");
  } else if (name.length < 2 || name.length > 50) {
    errors.push("Name must be between 2 and 50 characters");
  }

  if (!email) {
    errors.push("Email is required");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      errors.push("Invalid email format. Please provide a valid email address");
    }
  }

  if (req.method === "POST" || req.method === "PUT") {
    if (!password) {
      errors.push("Password is required");
    } else if (password.length < 6) {
      errors.push("Password must be at least 6 characters");
    }

    if (req.method === "POST" || req.body.passwordConfirm !== undefined) {
      if (!passwordConfirm) {
        errors.push("Password confirmation is required");
      } else if (password && password !== passwordConfirm) {
        errors.push("Passwords do not match");
      }
    }
  }

  if (errors.length > 0) {
    return sendValidationErrorResponse(res, errors.join(", "));
  }

  next();
};

export const checkUserBody = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name) {
    return sendValidationErrorResponse(
      res,
      "Missing user name. Please provide a name",
    );
  }

  if (!email) {
    return sendValidationErrorResponse(
      res,
      "Missing user email. Please provide an email address",
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return sendValidationErrorResponse(
      res,
      "Invalid email format. Please provide a valid email address",
    );
  }

  if (!password) {
    return sendValidationErrorResponse(
      res,
      "Missing password. Please provide a password",
    );
  }

  if (password.length < 6) {
    return sendValidationErrorResponse(
      res,
      "Password must be at least 6 characters long",
    );
  }

  next();
};

export const validateAuth = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendValidationErrorResponse(
      res,
      "Please provide email and password",
    );
  }

  next();
};
