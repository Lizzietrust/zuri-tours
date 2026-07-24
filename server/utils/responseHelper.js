export const sendSuccessResponse = (res, statusCode, message, data, meta) => {
  const response = {
    status: "success",
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  res.status(statusCode).json(response);
};

export const sendSuccess = (
  res,
  data,
  statusCode = 200,
  message = "Success",
) => {
  return sendSuccessResponse(res, statusCode, message, data);
};

export const sendPaginationSuccess = (
  res,
  data,
  pagination,
  statusCode = 200,
  message = "Success",
) => {
  const response = {
    status: "success",
    message,
    results: data.length,
    pagination,
    data: { tours: data },
  };

  res.status(statusCode).json(response);
};

export const sendErrorResponse = (res, statusCode, message, error) => {
  const response = {
    status: "error",
    message,
  };

  if (error && process.env.NODE_ENV === "development") {
    response.error = error.message;
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

export const sendError = (res, error, statusCode = 500) => {
  return sendErrorResponse(
    res,
    statusCode,
    error.message || "Something went wrong",
    error,
  );
};

export const sendNotFoundResponse = (res, message = "Resource not found") => {
  res.status(404).json({
    status: "fail",
    message,
  });
};

export const sendValidationErrorResponse = (res, message) => {
  res.status(400).json({
    status: "fail",
    message,
  });
};

export const sendUnauthorizedResponse = (res, message = "Unauthorized") => {
  res.status(401).json({
    status: "fail",
    message,
  });
};

export const sendForbiddenResponse = (res, message = "Forbidden") => {
  res.status(403).json({
    status: "fail",
    message,
  });
};

export const sendCreated = (
  res,
  data,
  message = "Resource created successfully",
) => {
  return sendSuccessResponse(res, 201, message, data);
};

export const sendNoContent = (res) => {
  res.status(204).json({
    status: "success",
    data: null,
  });
};

export const sendBadRequest = (res, message = "Bad request") => {
  return sendValidationErrorResponse(res, message);
};

export const sendUnauthorized = (res, message = "Unauthorized") => {
  return sendUnauthorizedResponse(res, message);
};

export const sendForbidden = (res, message = "Forbidden") => {
  return sendForbiddenResponse(res, message);
};

export const sendNotFound = (res, message = "Resource not found") => {
  return sendNotFoundResponse(res, message);
};
