import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    return next(error);
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload;
    return next();
  } catch {
    const error = new Error("Invalid token");
    error.statusCode = 401;
    return next(error);
  }
}

export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      const error = new Error("Forbidden");
      error.statusCode = 403;
      return next(error);
    }
    return next();
  };
}
