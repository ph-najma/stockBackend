import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/userModel";

dotenv.config();

interface DecodedToken {
  userId: string;
  role: string;
}

// Assuming tokenBlacklist is defined elsewhere in your application
const tokenBlacklist = new Set<string>();

// General Token Verification Middleware with Role Check
export const verifyTokenWithRole = (requiredRole: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      console.log("Middleware is running");

      const token =
        req.headers.authorization && req.headers.authorization.split(" ")[1];

      console.log("Extracted token:", token);
      if (!token) {
        res
          .status(401)
          .json({ message: "Unauthorized access. Token missing." });
        return;
      }
      if (tokenBlacklist.has(token)) {
        console.log("Token is blacklisted:", token);
        res
          .status(401)
          .json({ message: "Unauthorized access. Token blacklisted." });
        return;
      }

      jwt.verify(
        token,
        process.env.JWT_SECRET as string,
        async (err, decoded: any) => {
          if (err) {
            console.error("JWT verification error:", err);
            res.status(403).json({ message: "Failed to authenticate token." });
            return;
          }

          const { userId, role: tokenRole } = decoded as DecodedToken;

          const user = (await User.findById(userId)) as IUser | null;
          if (!user) {
            res.status(404).json({ message: "User not found." });
            return;
          }

          if (user.is_Blocked) {
            res.status(403).json({ message: "User is blocked. Logging out." });
            return;
          }

          // Check role from database, not just the token
          if (user.role !== requiredRole) {
            res.status(403).json({ message: "Insufficient permissions." });
            return;
          }
          console.log("Token:", token);
          console.log("Decoded token:", decoded);
          console.log("User from DB:", user);

          req.userId = userId; // Attach userId to the request object
          req.role = user.role; // Attach role from the database to the request object
          next();
        }
      );
    } catch (error) {
      res.status(500).json({ message: "Internal server error." });
    }
  };
};
