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
exports.UserController = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const stockModel_1 = __importDefault(require("../models/stockModel"));
class UserController {
    constructor(userService) {
        this.userService = userService;
        this.signup = this.signup.bind(this);
        this.verifyOtp = this.verifyOtp.bind(this);
        this.resendOtp = this.resendOtp.bind(this);
        this.login = this.login.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
        this.home = this.home.bind(this);
        this.getUserProfile = this.getUserProfile.bind(this);
        this.getUserportfolio = this.getUserportfolio.bind(this);
        this.plcaeOrder = this.plcaeOrder.bind(this);
        this.getTransaction = this.getTransaction.bind(this);
        this.getStockList = this.getStockList.bind(this);
        this.updatePortfolioAfterSell = this.updatePortfolioAfterSell.bind(this);
        this.getWatchlist = this.getWatchlist.bind(this);
        this.ensureWatchlistAndAddStock =
            this.ensureWatchlistAndAddStock.bind(this);
        this.getStockData = this.getStockData.bind(this);
        this.getReferralCode = this.getReferralCode.bind(this);
        this.getOrders = this.getOrders.bind(this);
        this.getPromotions = this.getPromotions.bind(this);
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
    getStockList(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("hello from controller");
                const stocks = yield this.userService.getAllStocks();
                console.log(stocks);
                res.json(stocks);
            }
            catch (error) {
                res
                    .status(500)
                    .json({ message: "Error fetching stocks", error: error.message });
            }
        });
    }
    //User Profile
    getUserProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.userService.getUserProfile(req.userId);
                console.log(user, "from controller of user profile");
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
                const user = yield this.userService.getUserPortfolio(req.userId);
                if (!user) {
                    res.status(404).json({ message: "User not found" });
                    return;
                }
                let totalPortfolioValue = 0;
                let overallProfit = 0;
                let todaysProfit = 0;
                const updatedPortfolio = yield Promise.all(user.portfolio.map((item) => __awaiter(this, void 0, void 0, function* () {
                    const stock = yield this.userService.getStockById(item.stockId instanceof mongoose_1.default.Types.ObjectId
                        ? item.stockId.toString()
                        : item.stockId);
                    if (!stock)
                        return item;
                    const stockValue = stock.price * item.quantity;
                    const profit = stockValue - stock.open * item.quantity;
                    const todaysChange = stock.changePercent;
                    totalPortfolioValue += stockValue;
                    overallProfit += profit;
                    todaysProfit += (profit * parseFloat(todaysChange)) / 100;
                    return Object.assign(Object.assign({}, item), { stockData: stock, currentValue: stockValue, overallProfit: profit, todaysProfit });
                })));
                res.status(200).json({
                    portfolio: updatedPortfolio,
                    totalPortfolioValue,
                    overallProfit,
                    todaysProfit,
                });
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    //placeOrder
    plcaeOrder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { stock, type, orderType, quantity, price, stopPrice, isIntraday } = req.body;
            const user = req.userId
                ? new mongoose_1.default.Types.ObjectId(req.userId)
                : undefined;
            console.log(user);
            console.log(stock);
            const order = yield this.userService.placeOrder(user, stock, type, orderType, quantity, price, stopPrice, isIntraday);
            res.json(order);
        });
    }
    //Get Watchlist
    getWatchlist(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const watchlist = yield this.userService.getWatchlist(userId);
                res.json(watchlist);
            }
            catch (error) {
                res.status(500).json({ error: "Something went wrong" });
            }
        });
    }
    //Transaction
    getTransaction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("helloo from controller");
                console.log(req.userId);
                const transactions = yield this.userService.getTransactions(req.userId);
                console.log(transactions);
                res.json(transactions);
            }
            catch (error) {
                console.error("Error in getTransaction:", error); // Log the error
                res.status(500).json({ error: "Something went wrong" });
            }
        });
    }
    updatePortfolioAfterSell(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, stockId, quantityToSell } = req.body;
                const updatedData = yield this.userService.updatePortfolioAfterSell(userId, stockId, quantityToSell);
                res.json(updatedData);
            }
            catch (error) {
                console.error("Error in getTransaction:", error);
                res.status(500).json({ error: "Something went wrong" });
            }
        });
    }
    ensureWatchlistAndAddStock(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                console.log("hello from controller");
                const userId = req.userId;
                const { stocks } = req.body;
                const stockId = (_a = stocks[0]) === null || _a === void 0 ? void 0 : _a.stockId;
                console.log("from controller", req.body);
                const stock = yield stockModel_1.default.findOne({ symbol: stockId });
                console.log("stcok id:", stock);
                const updatedWathclist = yield this.userService.ensureWatchlistAndAddStock(userId, stockId);
                res.json(updatedWathclist);
            }
            catch (error) {
                console.error("Error in getTransaction:", error);
                res.status(500).json({ error: "Something went wrong" });
            }
        });
    }
    getStockData(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const symbol = req.query.symbol;
                const updatedSymbol = symbol === null || symbol === void 0 ? void 0 : symbol.toString();
                const stockData = yield this.userService.getStockData(updatedSymbol);
                res.status(200).json(stockData);
            }
            catch (error) {
                res.status(500).json({ error: "Something went wrong" });
            }
        });
    }
    getReferralCode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.userId;
            const referralCode = yield this.userService.getReferralCode(userId);
            res.status(200).json(referralCode);
        });
    }
    getOrders(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(req.userId);
            const userId = req.userId;
            const orders = yield this.userService.getOrders(userId);
            res.status(200).json(orders);
        });
    }
    getPromotions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.userId;
            const user = yield this.userService.getUserProfileWithRewards(userId);
            res.status(200).json(user);
        });
    }
}
exports.UserController = UserController;
