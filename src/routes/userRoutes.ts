import express, { Router, Request, Response, NextFunction } from "express";
import passport, { use } from "passport";
import { OAuth2Client } from "google-auth-library";
import { verifyUserToken } from "../middleware/auth";
import dotenv from "dotenv";
import { UserController } from "../controllers/userController";
import User, { IUser } from "../models/userModel";
import jwt from "jsonwebtoken";
import getPortfolio from "../controllers/portfoliocontroller";
import { checkPortfolio } from "../controllers/checkPortfolio";

const userController = new UserController();

dotenv.config();

const router: Router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateToken(user: IUser): string {
  const payload = { userId: user._id };
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "1h",
  });
}

// User authentication routes
router.post("/signup", userController.signup);
router.post("/resendOtp", userController.resendOtp);
router.post("/verifyOtp", userController.verifyOtp);
router.post("/login", userController.login);
router.post("/forgotPassword", userController.forgotPassword);
router.post("/resetPassword", userController.resetPassword);
router.get("/home", verifyUserToken, userController.home);
router.get("/UserProfile", verifyUserToken, userController.getUserProfile);
router.post("/orders", userController.plcaeOrder);
router.get("/portfolio", verifyUserToken, getPortfolio);
router.post("/checkPortfolio", checkPortfolio);
// Google OAuth routes
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], // Request access to the user's profile and email
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req: Request, res: Response) => {
    res.redirect("/home"); // Redirect on successful authentication
  }
);

router.get("/logout", (req: Request, res: Response) => {
  req.logout((err: any) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).send("Error logging out");
    }
    res.redirect("/"); // Redirect after logout
  });
});

// Google Login API route
router.post(
  "/auth/google/login",
  async (req: Request, res: Response): Promise<void> => {
    const { id_token } = req.body;

    try {
      // Verify the Google token
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const googleId = payload?.sub;
      const email = payload?.email;
      const name = payload?.name;
      const profilePicture = payload?.picture;

      if (!googleId || !email || !name) {
        res.status(400).json({ message: "Invalid token payload" });
        return;
      }

      // Find or create the user
      let user = await User.findOne({ googleId });

      if (!user) {
        user = new User({
          googleId,
          name,
          email,
          profilePicture,
        });
        await user.save();
      }

      // Generate and return a JWT token
      const token = generateToken(user);

      res.json({ token });
    } catch (err) {
      console.error("Error during Google login:", err);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

export default router;
