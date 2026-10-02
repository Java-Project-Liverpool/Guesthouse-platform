import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/jwt";
import type { UserRole } from "../models/User";

const validRoles: UserRole[] = ["admin", "customer"];

export const authenticate: RequestHandler = (req, res, next) => {
  const authorization = req.get("authorization");
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);

  if (!match) {
    return res.status(401).json({ message: "A bearer token is required." });
  }

  try {
    const payload = jwt.verify(match[1], getJwtSecret(), {
      algorithms: ["HS256"]
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.role !== "string" ||
      !validRoles.includes(payload.role as UserRole)
    ) {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    req.authenticatedUser = {
      id: payload.sub,
      role: payload.role as UserRole
    };

    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid or expired authentication token." });
    }

    return next(error);
  }
};

export function authorizeRole(role: UserRole): RequestHandler {
  return (req, res, next) => {
    if (!req.authenticatedUser) {
      return res.status(401).json({ message: "Authentication is required." });
    }

    if (req.authenticatedUser.role !== role) {
      return res.status(403).json({ message: "You do not have permission to access this resource." });
    }

    return next();
  };
}

export const requireAdmin = authorizeRole("admin");
export const requireCustomer = authorizeRole("customer");
