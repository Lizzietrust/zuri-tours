export const sendSuccess = (
  res,
  data,
  statusCode = 200,
  message = "Success",
) => {
  res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

export const sendPaginationSuccess = (
  res,
  data,
  pagination,
  statusCode = 200,
) => {
  res.status(statusCode).json({
    status: "success",
    results: data.length,
    pagination,
    data: { tours: data },
  });
};

export const sendError = (res, error, statusCode = 500) => {
  res.status(statusCode).json({
    status: "error",
    message: error.message || "Something went wrong",
  });
};
