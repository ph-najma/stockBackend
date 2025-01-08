"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const google_auth_library_1 = require("google-auth-library");
const auth_1 = require("../middleware/auth");
const dotenv_1 = __importDefault(require("dotenv"));
const userController_1 = require("../controllers/userController");
const userModel_1 = __importDefault(require("../models/userModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const checkPortfolio_1 = require("../controllers/checkPortfolio");
const userService_1 = require("../services/userService");
const stockrepository_1 = require("../repositories/stockrepository");
const userRepository_1 = require("../repositories/userRepository");
const transactionRepository_1 = require("../repositories/transactionRepository");
const orderRepository_1 = require("../repositories/orderRepository");
const promotionRepository_1 = require("../repositories/promotionRepository");
const watchlistRepsoitory_1 = require("../repositories/watchlistRepsoitory");
const paymentController_1 = require("../controllers/paymentController");
const userRepository = new userRepository_1.UserRepository();
const stockRepository = new stockrepository_1.StockRepository();
const TransactionRepository = new transactionRepository_1.transactionRepository();
const orderRepository = new orderRepository_1.OrderRepository();
const promotionRepository = new promotionRepository_1.PromotionRepository();
const watchlistRepository = new watchlistRepsoitory_1.watchlistRepostory();
const paymentController = new paymentController_1.PaymentController();
const userController = new userController_1.UserController(new userService_1.UserService(stockRepository, userRepository, TransactionRepository, orderRepository, promotionRepository, watchlistRepository));
dotenv_1.default.config();
const router = express_1.default.Router();
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
function generateToken(user) {
    const payload = { userId: user._id };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
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
router.get("/home", (0, auth_1.verifyTokenWithRole)("user"), userController.home);
router.get("/stocks", (0, auth_1.verifyTokenWithRole)("user"), userController.getStockList);
router.get("/UserProfile", (0, auth_1.verifyTokenWithRole)("user"), userController.getUserProfile);
router.post("/orders", (0, auth_1.verifyTokenWithRole)("user"), userController.plcaeOrder);
router.get("/portfolio", (0, auth_1.verifyTokenWithRole)("user"), userController.getUserportfolio);
router.post("/checkPortfolio", checkPortfolio_1.checkPortfolio);
router.get("/transactions", (0, auth_1.verifyTokenWithRole)("user"), userController.getTransaction);
router.post("/updatePortfolio", userController.updatePortfolioAfterSell);
router.get("/getWatchlist", (0, auth_1.verifyTokenWithRole)("user"), userController.getWatchlist);
router.post("/ensureAndAddStock", (0, auth_1.verifyTokenWithRole)("user"), userController.ensureWatchlistAndAddStock);
router.get("/getStockData", (0, auth_1.verifyTokenWithRole)("user"), userController.getStockData);
router.get("/getOrders", (0, auth_1.verifyTokenWithRole)("user"), userController.getOrders);
router.post("/create-order", (0, auth_1.verifyTokenWithRole)("user"), (req, res) => paymentController.createOrder(req, res));
router.post("/verify-payment", (0, auth_1.verifyTokenWithRole)("user"), (req, res) => paymentController.verifyPayment(req, res));
router.get("/promotions", (0, auth_1.verifyTokenWithRole)("user"), userController.getPromotions);
// Google OAuth routes
router.get("/auth/google", passport_1.default.authenticate("google", {
    scope: ["profile", "email"], // Request access to the user's profile and email
}));
router.get("/auth/google/callback", passport_1.default.authenticate("google", { failureRedirect: "/" }), (req, res) => {
    res.redirect("/home"); // Redirect on successful authentication
});
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error("Error during logout:", err);
            return res.status(500).send("Error logging out");
        }
        res.redirect("/"); // Redirect after logout
    });
});
// Google Login API route
router.post("/auth/google/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_token } = req.body;
    try {
        // Verify the Google token
        const ticket = yield client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const googleId = payload === null || payload === void 0 ? void 0 : payload.sub;
        const email = payload === null || payload === void 0 ? void 0 : payload.email;
        const name = payload === null || payload === void 0 ? void 0 : payload.name;
        const profilePicture = payload === null || payload === void 0 ? void 0 : payload.picture;
        if (!googleId || !email || !name) {
            res.status(400).json({ message: "Invalid token payload" });
            return;
        }
        // Find or create the user
        let user = yield userModel_1.default.findOne({ googleId });
        if (!user) {
            user = new userModel_1.default({
                googleId,
                name,
                email,
                profilePicture,
            });
            yield user.save();
        }
        // Generate and return a JWT token
        const token = generateToken(user);
        res.json({ token });
    }
    catch (err) {
        console.error("Error during Google login:", err);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
exports.default = router;
