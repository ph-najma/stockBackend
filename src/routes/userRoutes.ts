import express, { Router, Request, Response, NextFunction } from "express";
import passport, { use } from "passport";
import { OAuth2Client } from "google-auth-library";
import { verifyTokenWithRole } from "../middleware/auth";
import dotenv from "dotenv";
import { UserController } from "../controllers/userController";
import User, { IUser } from "../models/userModel";
import jwt from "jsonwebtoken";
import { checkPortfolio } from "../controllers/checkPortfolio";
import { UserService } from "../services/userService";
import { StockRepository } from "../repositories/stockrepository";
import { UserRepository } from "../repositories/userRepository";
import { transactionRepository } from "../repositories/transactionRepository";
import { OrderRepository } from "../repositories/orderRepository";
import { PromotionRepository } from "../repositories/promotionRepository";
import { watchlistRepostory } from "../repositories/watchlistRepsoitory";
import { PaymentController } from "../controllers/paymentController";
const userRepository = new UserRepository();
const stockRepository = new StockRepository();
const TransactionRepository = new transactionRepository();
const orderRepository = new OrderRepository();
const promotionRepository = new PromotionRepository();
const watchlistRepository = new watchlistRepostory();
const paymentController = new PaymentController();
const userController = new UserController(
  new UserService(
    stockRepository,
    userRepository,
    TransactionRepository,
    orderRepository,
    promotionRepository,
    watchlistRepository
  )
);

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
router.get("/home", verifyTokenWithRole("user"), userController.home);
router.get("/stocks", verifyTokenWithRole("user"), userController.getStockList);
router.get(
  "/UserProfile",
  verifyTokenWithRole("user"),
  userController.getUserProfile
);
router.post("/orders", verifyTokenWithRole("user"), userController.plcaeOrder);
router.get(
  "/portfolio",
  verifyTokenWithRole("user"),
  userController.getUserportfolio
);
router.post("/checkPortfolio", checkPortfolio);
router.get(
  "/transactions",
  verifyTokenWithRole("user"),
  userController.getTransaction
);
router.post("/updatePortfolio", userController.updatePortfolioAfterSell);
router.get(
  "/getWatchlist",
  verifyTokenWithRole("user"),
  userController.getWatchlist
);
router.post(
  "/ensureAndAddStock",
  verifyTokenWithRole("user"),
  userController.ensureWatchlistAndAddStock
);

router.get(
  "/getStockData",
  verifyTokenWithRole("user"),
  userController.getStockData
);

router.get("/getOrders", verifyTokenWithRole("user"), userController.getOrders);

router.post("/create-order", verifyTokenWithRole("user"), (req, res) =>
  paymentController.createOrder(req, res)
);
router.post("/verify-payment", verifyTokenWithRole("user"), (req, res) =>
  paymentController.verifyPayment(req, res)
);

router.get(
  "/promotions",
  verifyTokenWithRole("user"),
  userController.getPromotions
);

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
