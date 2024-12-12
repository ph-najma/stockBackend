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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const userService_1 = require("../services/userService");
class UserController {
    constructor() {
        this.userService = new userService_1.UserService();
        this.signup = this.signup.bind(this);
        this.verifyOtp = this.verifyOtp.bind(this);
        this.resendOtp = this.resendOtp.bind(this);
        this.login = this.login.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
        this.home = this.home.bind(this);
        this.getUserProfile = this.getUserProfile.bind(this);
        this.plcaeOrder = this.plcaeOrder.bind(this);
    }
    //signup
    signup(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, email, password } = req.body;
            try {
                yield this.userService.signup(name, email, password);
                res.status(200).json({ message: "OTP sent to email", email });
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    //verify OTP
    verifyOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { otp } = req.body;
            try {
                const result = yield this.userService.verifyOtp(otp);
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    //Resend OTP
    resendOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            try {
                const message = yield this.userService.resendOtp(email);
                res.status(200).json({ message });
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    //Login
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            try {
                const result = yield this.userService.login(email, password);
                res.status(200).json(result);
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    //Forgot Password
    forgotPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email } = req.body;
            try {
                yield this.userService.forgotPassword(email);
                res.status(200).json({ message: "OTP sent to email", email });
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    //Reset Password
    resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, otp, newPassword } = req.body;
            try {
                yield this.userService.resetPassword(email, otp, newPassword);
                res.status(200).json({ message: "Password reset successfully" });
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    //Home
    home(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.userService.home();
                res.status(200).json({ message: "Home rendered successfully" });
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    //User Profile
    getUserProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.userService.getUserProfile(req.userId);
                res.json(user);
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    //User Portfolio
    getUserportfolio(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const portfolio = yield this.userService.getUserPortfolio(req.userId);
                console.log(req.userId);
                console.log(portfolio);
                res.json(portfolio);
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    //placeOrder
    plcaeOrder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user, stock, type, orderType, quantity, price, stopPrice } = req.body;
            const order = yield this.userService.placeOrder(user, stock, type, orderType, quantity, price, stopPrice);
            res.json(order);
        });
    }
}
exports.UserController = UserController;
