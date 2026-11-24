export function notFound(_request, response) {
  return response.status(404).json({ message: "Not found." });
}

export function errorHandler(error, _request, response, next) {
  if (response.headersSent) return next(error);
  if (error.message === "Origin not allowed.") {
    return response.status(403).json({ message: "Request origin is not allowed." });
  }

  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : 500;
  return response.status(status).json({
    message: status === 500 ? "Internal server error." : "Invalid request.",
  });
}
