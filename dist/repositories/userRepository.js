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
exports.UserRepository = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const mongoose_1 = __importDefault(require("mongoose"));
class UserRepository {
    constructor() {
        this.model = userModel_1.default;
    }
    // Find user by email
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield userModel_1.default.findOne({ email });
        });
    }
    // Find user by OTP
    findByOtp(otp) {
        return __awaiter(this, void 0, void 0, function* () {
            return userModel_1.default.findOne({ otp });
        });
    }
    //Find by ID
    findById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield userModel_1.default.findById(userId).populate({
                path: "portfolio.stockId", // This is the path to the referenced model
                model: "Stock", // Ensure you specify the model name for Stock
            });
        });
    }
    // Save a new user
    save(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = new userModel_1.default(userData);
            return user.save();
        });
    }
    // Update user data
    updateById(userId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            return userModel_1.default.findByIdAndUpdate(userId, updateData, { new: true });
        });
    }
    // Update user password
    updatePassword(email, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield userModel_1.default.findOne({ email });
            if (user) {
                user.password = newPassword;
                yield user.save();
            }
        });
    }
    // Find or create Google user
    findOrCreateGoogleUser(googleId, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            let user = yield userModel_1.default.findOne({ googleId });
            if (!user) {
                user = new userModel_1.default(userData);
                yield user.save();
            }
            return user;
        });
    }
    //Find an admin by email
    findAdminByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return userModel_1.default.findOne({ email, is_Admin: true });
        });
    }
    //Find all users
    findAllUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return userModel_1.default.find({ is_Admin: false });
        });
    }
    //Save a user
    saveUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return user.save();
        });
    }
    // Fetch user by ID
    getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.model
                .findById(id)
                .populate({
                path: "portfolio.stockId", // This is the path to the referenced model
                model: "Stock", // Ensure you specify the model name for Stock
            })
                .exec();
            console.log(user, "from repo");
            return user;
        });
    }
    updatePortfolio(userId, portfolioData) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.findByIdAndUpdate(userId, { $push: { portfolio: portfolioData } }, { new: true });
        });
    }
    // Fetch user balance
    getUserBalance(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.model.findById(userId);
            return (user === null || user === void 0 ? void 0 : user.balance) || null;
        });
    }
    // Update user balance
    updateUserBalance(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.findByIdAndUpdate(userId, { $inc: { balance: amount } }, { new: true });
        });
    }
    addSignupBonus(userId, promotionId, bonusAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield userModel_1.default.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            user.balance += bonusAmount;
            user.promotions.push(new mongoose_1.default.Types.ObjectId(promotionId));
            yield user.save();
            return user;
        });
    }
    updatePortfolioAfterSell(userId, stockId, quantityToSell) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.model.findById(userId);
            if (!user)
                throw new Error("User not found");
            // Check if the stock exists in the portfolio
            const stockIdObject = new mongoose_1.default.Types.ObjectId(stockId);
            const stockIndex = user.portfolio.findIndex((item) => item.stockId.toString() === stockIdObject.toString());
            if (stockIndex === -1) {
                throw new Error("Stock not found in portfolio");
            }
            const stockInPortfolio = user.portfolio[stockIndex];
            if (stockInPortfolio.quantity < quantityToSell) {
                throw new Error("Not enough stock to sell");
            }
            if (stockInPortfolio.quantity === quantityToSell) {
                user.portfolio.splice(stockIndex, 1);
            }
            else {
                stockInPortfolio.quantity -= quantityToSell;
            }
            return yield user.save();
        });
    }
    findByRefferalCode(refferalcode) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield userModel_1.default.findOne({ referralCode: refferalcode });
        });
    }
    getPromotions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield userModel_1.default.findById(userId).populate("promotions").exec();
            return user;
        });
    }
}
exports.UserRepository = UserRepository;
