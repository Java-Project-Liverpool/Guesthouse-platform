import type { UserRole } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: {
        id: string;
        role: UserRole;
      };
    }
  }
}

export {};
