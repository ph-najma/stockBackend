import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      role?: string; // Add the userId property
    }
  }
}
