import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/userModel";

dotenv.config();

interface DecodedToken {
  userId: string;
}

// Assuming tokenBlacklist is defined elsewhere in your application
const tokenBlacklist = new Set<string>();

// Middleware to verify JWT token for users
export const verifyUserToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token || tokenBlacklist.has(token)) {
      res.status(401).json({ message: "Unauthorized access." });
      return;
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      async (err, decoded: any) => {
        if (err) {
          res.status(403).json({ message: "Failed to authenticate token." });
          return;
        }

        const { userId } = decoded as DecodedToken;

        const user = (await User.findById(userId)) as IUser | null;
        if (!user) {
          res.status(404).json({ message: "User not found." });
          return;
        }

        if (user.is_Blocked) {
          res.status(403).json({ message: "User is blocked. Logging out." });
          return;
        }

        req.userId = userId; // Attach userId to the request object
        next();
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};

// Middleware to verify JWT token for admins
export const verifyAdminToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token =
      req.headers.authorization && req.headers.authorization.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "No token provided." });
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded: any) => {
      if (err) {
        res.status(403).json({ message: "Failed to authenticate token." });
        return;
      }

      const { userId } = decoded as DecodedToken;

      req.userId = userId; // Attach userId to the request object
      console.log("Admin authenticated successfully. User ID:", req.userId);
      next();
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error." });
  }
};
