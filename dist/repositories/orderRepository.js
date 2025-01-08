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
exports.OrderRepository = void 0;
const orderModel_1 = __importDefault(require("../models/orderModel"));
class OrderRepository {
    findById(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return orderModel_1.default.findById(orderId).populate("user").populate("stock").exec();
        });
    }
    findOrders(UserId) {
        return __awaiter(this, void 0, void 0, function* () {
            return orderModel_1.default.find({ user: UserId }).populate("stock", "symbol name").exec();
        });
    }
    findCompletedOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            return orderModel_1.default.find({ status: "COMPLETED" })
                .populate("user")
                .populate("stock")
                .exec();
        });
    }
    findOrdersByType(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return orderModel_1.default.find(query).populate("user").populate("stock").exec();
        });
    }
    createOrder(orderData) {
        return __awaiter(this, void 0, void 0, function* () {
            return orderModel_1.default.create(orderData);
        });
    }
    getAllOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            return orderModel_1.default.find()
                .sort({ createdAt: -1 })
                .populate("user")
                .populate("stock")
                .exec();
        });
    }
    cancelOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const updatedOrder = yield orderModel_1.default.findByIdAndUpdate(orderId, { status: "FAILED" }, { new: true }).exec();
            return updatedOrder;
        });
    }
}
exports.OrderRepository = OrderRepository;
