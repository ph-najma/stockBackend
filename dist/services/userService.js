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
exports.UserService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const sendEmail_1 = require("../utils/sendEmail");
const otpGenerator_1 = require("../utils/otpGenerator");
const crypto_1 = __importDefault(require("crypto"));
dotenv_1.default.config();
const otpStore = new Map();
class UserService {
    constructor(stockRepository, userRepository, transactionRepository, orderRepository, promotionRepository, watchlistRepsoitory) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.transactionRepository = transactionRepository;
        this.stockRepository = stockRepository;
        this.promotionRepository = promotionRepository;
        this.watchlistRepository = watchlistRepsoitory;
    }
    // Sign up a new user
    signup(name, email, password, referralCode) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield this.userRepository.findByEmail(email);
            if (existingUser) {
                throw new Error("User already exists");
            }
            const otp = (0, otpGenerator_1.generateOTP)();
            const generatedReferralCode = crypto_1.default.randomBytes(4).toString("hex");
            otpStore.set(otp, { name, email, password, otp, refferedBy: referralCode });
            yield (0, sendEmail_1.sendEmail)(email, otp);
        });
    }
    // Verify OTP
    verifyOtp(otp) {
        return __awaiter(this, void 0, void 0, function* () {
            const pendingUser = otpStore.get(otp);
            if (!pendingUser) {
                throw new Error("Invalid OTP");
            }
            const referredBy = pendingUser.refferedBy;
            const newUser = yield this.userRepository.save({
                name: pendingUser.name,
                email: pendingUser.email,
                password: pendingUser.password,
                referralCode: crypto_1.default.randomBytes(4).toString("hex"),
                referredBy,
            });
            otpStore.delete(otp);
            const promotion = yield this.promotionRepository.findPromotion();
            if (promotion && promotion.signupBonus.enabled) {
                yield this.userRepository.addSignupBonus(newUser._id.toString(), promotion._id.toString(), promotion.signupBonus.amount);
            }
            if (referredBy) {
                const referrer = yield this.userRepository.findByRefferalCode(referredBy);
                if (referrer) {
                    yield this.userRepository.updateUserBalance(referrer._id.toString(), 100); // Example bonus
                }
            }
            const token = jsonwebtoken_1.default.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
                expiresIn: "1h",
            });
            return { token };
        });
    }
    //Resend OTP
    resendOtp(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield this.userRepository.findByEmail(email);
            if (existingUser) {
                throw new Error("User already registered");
            }
            // Find the pending OTP entry for the user
            const pendingUserEntry = Array.from(otpStore.values()).find((entry) => entry.email === email);
            if (!pendingUserEntry) {
                throw new Error("No pending registration found for this email");
            }
            const newOtp = (0, otpGenerator_1.generateOTP)();
            otpStore.set(newOtp, Object.assign(Object.assign({}, pendingUserEntry), { otp: newOtp }));
            // Remove the old OTP entry for the same email
            otpStore.forEach((value, key) => {
                if (value.email === email && key !== newOtp) {
                    otpStore.delete(key);
                }
            });
            yield (0, sendEmail_1.sendEmail)(email, newOtp);
            return "OTP resent to email";
        });
    }
    // Login user
    login(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("heloo from service");
            const user = yield this.userRepository.findByEmail(email);
            if (!user) {
                throw new Error("No such user");
            }
            const isMatch = yield bcryptjs_1.default.compare(password, user.password || "");
            if (!isMatch) {
                throw new Error("Invalid password");
            }
            const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, {
                expiresIn: "1h",
            });
            return { token };
        });
    }
    // Forgot password
    forgotPassword(email) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Entered forgotPassword method in service");
            const user = yield this.userRepository.findByEmail(email);
            if (!user) {
                console.log("not uset");
                throw new Error("User not found");
            }
            console.log(user);
            const otp = (0, otpGenerator_1.generateOTP)();
            const otpExpiration = Date.now() + 10 * 60 * 1000;
            otpStore.set(email, { userId: user._id.toString(), otp, otpExpiration });
            console.log("hello from backend service forgot pass");
            console.log(otpStore);
            yield (0, sendEmail_1.sendEmail)(email, otp);
        });
    }
    // Reset password
    resetPassword(email, otp, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const otpEntry = otpStore.get(email);
            if (!otpEntry ||
                otpEntry.otp !== otp ||
                otpEntry.otpExpiration < Date.now()) {
                throw new Error("Invalid or expired OTP");
            }
            console.log("hello from reset password");
            yield this.userRepository.updatePassword(email, newPassword);
            otpStore.delete(email);
        });
    }
    //Home
    home() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    //Get User Profle
    getUserProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findById(userId);
            console.log(user, "from service....");
            if (!user) {
                throw new Error("user not found");
            }
            return user;
        });
    }
    //Get User Portfolio
    getUserPortfolio(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.getUserById(userId);
        });
    }
    //Get All Stocks
    getAllStocks() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.stockRepository.getAllStocks();
        });
    }
    //Place an Order
    placeOrder(user, stock, type, orderType, quantity, price, stopPrice, isIntraday) {
        return __awaiter(this, void 0, void 0, function* () {
            const orderData = {
                user,
                stock,
                type,
                orderType,
                quantity,
                price,
                stopPrice,
                isIntraday,
            };
            const order = yield this.orderRepository.createOrder(orderData);
            return order;
        });
    }
    //Get Transactions of a user
    getTransactions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("User ID inside service:", userId);
            const transactions = yield this.transactionRepository.getTransactions(userId);
            console.log("Transactions inside service:", transactions);
            return transactions;
        });
    }
    //Get Stock By ID
    getStockById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.stockRepository.getStockById(userId);
        });
    }
    getWatchlist(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.watchlistRepository.getByUserId(userId);
        });
    }
    //Update User Portfolio After Sell
    updatePortfolioAfterSell(userId, stockId, quantityToSell) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.updatePortfolioAfterSell(userId, stockId, quantityToSell);
        });
    }
    getMarketPrice(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.stockRepository.getMarketPrice(symbol);
        });
    }
    ensureWatchlistAndAddStock(userId, stocksymbol) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("hello from service");
            return this.watchlistRepository.ensureWatchlistAndAddStock(userId, stocksymbol);
        });
    }
    getStockData(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const stockData = yield this.stockRepository.getStockData(symbol);
            const formattedData = stockData.map((stock) => ({
                time: stock.timestamp.getTime() / 1000, // Convert to seconds (Unix timestamp)
                open: stock.open,
                high: stock.high,
                low: stock.low,
                close: stock.close,
                volume: stock.volume,
            }));
            return formattedData;
        });
    }
    getReferralCode(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            return user.referralCode;
        });
    }
    getOrders(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const orders = yield this.orderRepository.findOrders(userId);
            return orders;
        });
    }
    getUserProfileWithRewards(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Fetch the user and their promotions
                const user = yield this.userRepository.getPromotions(userId);
                if (user) {
                    for (const promotion of user.promotions) {
                        const promo = yield this.promotionRepository.findPromotion();
                        // Apply loyalty rewards if conditions are met
                        if (promo && promo.loyaltyRewards.enabled) {
                            if (user.balance >= promo.loyaltyRewards.tradingAmount) {
                                user.balance += promo.loyaltyRewards.rewardAmount;
                                console.log(`Loyalty reward applied: ${promo.loyaltyRewards.rewardAmount}`);
                            }
                        }
                    }
                    yield user.save();
                }
                return user;
            }
            catch (error) {
                throw error;
            }
        });
    }
}
exports.UserService = UserService;
