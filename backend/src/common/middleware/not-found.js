export function notFoundHandler(_req, res) {
  res.status(404).json({
    error: "Not Found",
    message: "Route does not exist",
  });
}
