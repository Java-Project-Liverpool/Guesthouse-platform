import { authenticate, authorizeRole } from "./authMiddleware";
import type { UserRole } from "../models/User";

// Compatibility names used by the customer and admin route modules.
export const requireAuth = authenticate;
export const requireRole = (role: UserRole) => authorizeRole(role);
