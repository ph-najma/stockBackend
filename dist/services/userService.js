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
const userRepository_1 = require("../repositories/userRepository");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const sendEmail_1 = require("../utils/sendEmail");
const otpGenerator_1 = require("../utils/otpGenerator");
const orderRepository_1 = require("../repositories/orderRepository");
dotenv_1.default.config();
const otpStore = new Map();
class UserService {
    constructor() {
        this.userRepository = new userRepository_1.UserRepository();
        this.orderRepository = new orderRepository_1.OrderRepository();
    }
    // Sign up a new user
    signup(name, email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield this.userRepository.findByEmail(email);
            if (existingUser) {
                throw new Error("User already exists");
            }
            const otp = (0, otpGenerator_1.generateOTP)();
            otpStore.set(otp, { name, email, password, otp });
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
            const newUser = yield this.userRepository.save({
                name: pendingUser.name,
                email: pendingUser.email,
                password: pendingUser.password,
            });
            otpStore.delete(otp);
            const token = jsonwebtoken_1.default.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
                expiresIn: "1h",
            });
            return { token };
        });
    }
    //Resnd OTP
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
    home() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    getUserProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findById(userId);
            if (!user) {
                throw new Error("user not found");
            }
            return user;
        });
    }
    getUserPortfolio(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const portfolio = yield this.userRepository.findById(userId);
            return portfolio;
        });
    }
    placeOrder(user, stock, type, orderType, quantity, price, stopPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.orderRepository.createOrder({
                user,
                stock,
                type,
                orderType,
                quantity,
                price,
                stopPrice,
            });
            return order;
        });
    }
}
exports.UserService = UserService;
