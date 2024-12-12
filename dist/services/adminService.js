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
exports.AdminService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const userRepository_1 = require("../repositories/userRepository");
const stockrepository_1 = require("../repositories/stockrepository");
const orderRepository_1 = require("../repositories/orderRepository");
dotenv_1.default.config();
const tokenBlacklist = new Set();
class AdminService {
    constructor() {
        this.userRepository = new userRepository_1.UserRepository();
        this.orderRepository = new orderRepository_1.OrderRepository();
        this.stockRepository = new stockrepository_1.StockRepository();
    }
    // Admin Login
    loginAdmin(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield this.userRepository.findAdminByEmail(email);
            if (!existingUser) {
                throw new Error("No such user");
            }
            const isMatch = yield existingUser.comparePassword(password);
            if (!isMatch) {
                throw new Error("Invalid password");
            }
            const token = jsonwebtoken_1.default.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            return { token };
        });
    }
    // Get User List
    getUserList() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.findAllUsers();
        });
    }
    // Disable or Enable User
    toggleUserBlockStatus(userId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.userRepository.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            user.is_Blocked = !user.is_Blocked;
            yield this.userRepository.saveUser(user);
            if (token) {
                tokenBlacklist.add(token);
            }
            return {
                message: `${user.is_Blocked ? "Blocked" : "Unblocked"} user successfully.`,
            };
        });
    }
    getAllOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.orderRepository.findOrdersByType({});
        });
    }
    getLimitOrders(query) {
        return __awaiter(this, void 0, void 0, function* () {
            query.orderType = "LIMIT";
            return this.orderRepository.findOrdersByType(query);
        });
    }
    getMarketOrders(query) {
        return __awaiter(this, void 0, void 0, function* () {
            query.orderType = "MARKET";
            return this.orderRepository.findOrdersByType(query);
        });
    }
    getCompletedOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.orderRepository.findCompletedOrders();
        });
    }
    getAllStocks() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.stockRepository.getAllStocks();
        });
    }
}
exports.AdminService = AdminService;
