import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string; // Add the userId property
    }
  }
}

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string | undefined;
  email: string | undefined;
  password?: string | undefined; // Optional because it's not always required
  createdAt: Date;
  is_Blocked: boolean;
  is_Admin: boolean;
  googleId?: string;
  profilePhoto?: string; // Optional for users without Google login
}
