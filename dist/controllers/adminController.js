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
exports.AdminController = void 0;
const orderModel_1 = __importDefault(require("../models/orderModel"));
const transactionModel_1 = __importDefault(require("../models/transactionModel"));
const mongoose_1 = __importDefault(require("mongoose"));
class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
        this.login = this.login.bind(this);
        this.getUserList = this.getUserList.bind(this);
        this.disableUser = this.disableUser.bind(this);
        this.getStockList = this.getStockList.bind(this);
        this.softDeleteStock = this.softDeleteStock.bind(this);
        this.getAllOrders = this.getAllOrders.bind(this);
        this.getLimitOrders = this.getLimitOrders.bind(this);
        this.getMarketOrders = this.getMarketOrders.bind(this);
        this.getMatchedOrders = this.getMatchedOrders.bind(this);
        this.getOrderDetails = this.getOrderDetails.bind(this);
        this.getAllTransactions = this.getAllTransactions.bind(this);
        this.getUserPortfolio = this.getUserPortfolio.bind(this);
        this.getTotalFeesCollected = this.getTotalFeesCollected.bind(this);
        this.cancelOrder = this.cancelOrder.bind(this);
        this.updateLimit = this.updateLimit.bind(this);
        this.getLimits = this.getLimits.bind(this);
        this.CreatePromotions = this.CreatePromotions.bind(this);
    }
    // Admin Login
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                const { token } = yield this.adminService.loginAdmin(email, password);
                res.status(200).json({ message: "User logged in successfully", token });
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    // Get User List
    getUserList(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const usersData = yield this.adminService.getUserList();
                res.status(200).json(usersData);
            }
            catch (error) {
                res.status(500).json({ message: "Internal server error" });
            }
        });
    }
    // Disable User
    disableUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = req.params.id;
                const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
                const result = yield this.adminService.toggleUserBlockStatus(userId, token);
                res.status(200).json(result);
            }
            catch (error) {
                res
                    .status(error.message === "User not found" ? 404 : 500)
                    .json({ message: error.message });
            }
        });
    }
    // Get Stock List
    getStockList(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stocks = yield this.adminService.getAllStocks();
                res.json(stocks);
            }
            catch (error) {
                res
                    .status(500)
                    .json({ message: "Error fetching stocks", error: error.message });
            }
        });
    }
    // Soft Delete Stock
    softDeleteStock(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stockId = req.params.id;
                const updatedStock = yield this.adminService.toggleUserBlockStatus(stockId);
                res.status(200).json(updatedStock);
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        });
    }
    // Get All Orders
    getAllOrders(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orders = yield this.adminService.getAllOrders();
                res.json(orders);
            }
            catch (error) {
                res.status(500).json({ message: "Server error", error });
            }
        });
    }
    // Get Limit Orders
    getLimitOrders(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { status, user, dateRange } = req.query;
                const query = { orderType: "LIMIT" };
                if (typeof status === "string" && status !== "all") {
                    query.status = status;
                }
                if (user) {
                    const userQuery = Array.isArray(user) ? user.join(" ") : user;
                    if (typeof userQuery === "string") {
                        query.user = { $regex: new RegExp(userQuery, "i") };
                    }
                }
                if (dateRange) {
                    const date = new Date(dateRange);
                    query.createdAt = {
                        $gte: new Date(date.setHours(0, 0, 0, 0)),
                        $lte: new Date(date.setHours(23, 59, 59, 999)),
                    };
                }
                const orders = yield this.adminService.getLimitOrders(query);
                res.status(200).json(orders);
            }
            catch (error) {
                console.error("Error fetching limit orders:", error);
                res.status(500).json({ message: "Server error", error });
            }
        });
    }
    // Get Market Orders
    getMarketOrders(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { status, user, dateRange } = req.query;
                const query = { orderType: "MARKET" };
                if (typeof status === "string" && status !== "all") {
                    query.status = status;
                }
                if (user) {
                    const userQuery = Array.isArray(user) ? user.join(" ") : user;
                    if (typeof userQuery === "string") {
                        query.user = { $regex: new RegExp(userQuery, "i") };
                    }
                }
                if (dateRange) {
                    const date = new Date(dateRange);
                    query.createdAt = {
                        $gte: new Date(date.setHours(0, 0, 0, 0)),
                        $lte: new Date(date.setHours(23, 59, 59, 999)),
                    };
                }
                const orders = yield this.adminService.getMarketOrders(query);
                res.status(200).json(orders);
            }
            catch (error) {
                console.error("Error fetching limit orders:", error);
                res.status(500).json({ message: "Server error", error });
            }
        });
    }
    // Matched Orders
    getMatchedOrders(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orders = yield orderModel_1.default.find({ status: "COMPLETED" })
                    .populate("user", "name")
                    .populate("stock", "symbol")
                    .exec();
                res.json(orders);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch orders", error });
            }
        });
    }
    // Get Order Details
    getOrderDetails(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orderId = req.params.orderId;
                const order = yield orderModel_1.default.findById(orderId)
                    .populate("user")
                    .populate("stock")
                    .exec();
                const transactions = yield transactionModel_1.default
                    .find({ $or: [{ buyOrder: orderId }, { sellOrder: orderId }] })
                    .populate("buyer seller")
                    .populate("stock")
                    .exec();
                if (!order) {
                    res.status(404).json({ message: "Order not found" });
                }
                else {
                    res.json({ order, transactions });
                }
            }
            catch (error) {
                res.status(500).json({ message: "Error fetching order details", error });
            }
        });
    }
    getAllTransactions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield this.adminService.getAllTransactions();
            res.json(transactions);
        });
    }
    getUserPortfolio(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.params.userId;
                console.log("hello from controller");
                if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                    res.status(400).json({ message: "Invalid User ID format" });
                    console.log("not correct");
                }
                const portfolio = yield this.adminService.getUserPortfolio(userId);
                res.status(200).json(portfolio);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    getTotalFeesCollected(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fees = yield this.adminService.getTotalFeesCollected();
                res.status(200).json(fees);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    cancelOrder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const orderId = req.params.orderId;
                console.log(orderId, "from controller");
                const updatedOrder = yield this.adminService.cancelOrder(orderId);
                res.status(200).json({
                    message: "Order status updated to FAILED successfully",
                    order: updatedOrder,
                });
            }
            catch (error) {
                console.error("Error cancelling order:", error);
                res.status(500).json({ message: error.message });
            }
        });
    }
    updateLimit(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limitData = req.body;
                console.log(req.body);
                const updatedLimit = yield this.adminService.updateLimit(limitData);
                res.status(200).json(updatedLimit);
            }
            catch (error) {
                console.error("Error cancelling order:", error);
                res.status(500).json({ message: error.message });
            }
        });
    }
    getLimits(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limits = yield this.adminService.getLimits();
                res.status(200).json(limits);
            }
            catch (error) {
                console.error("Error cancelling order:", error);
                res.status(500).json({ message: error.message });
            }
        });
    }
    CreatePromotions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const promotions = yield this.adminService.CreatePromotions(req.body);
                res.status(201).json({
                    success: true,
                    message: "Promotion created successfully",
                    promotions,
                });
            }
            catch (error) {
                console.error("Error creating promotion:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to create promotion",
                    error: error.message,
                });
            }
        });
    }
}
exports.AdminController = AdminController;
