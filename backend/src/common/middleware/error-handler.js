export function errorHandler(error, _req, res, _next) {
  const status = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    error: status >= 500 ? "Server Error" : "Request Error",
    message,
    details: error.details || null,
  });
}
