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
exports.createTransaction = void 0;
const transactionModel_1 = __importDefault(require("../models/transactionModel"));
const orderModel_1 = __importDefault(require("../models/orderModel"));
const createTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId, paymentMethod, paymentReference } = req.body;
    try {
        const order = yield orderModel_1.default.findById(orderId).populate("user stock");
        if (!order)
            return res.status(404).json({ message: "Order not found" });
        const totalAmount = order.price * order.quantity;
        const fees = totalAmount * 0.01; // Example: 1% transaction fee
        const transaction = new transactionModel_1.default({
            user: order.user,
            order: order._id,
            stock: order.stock,
            type: order.type,
            quantity: order.quantity,
            price: order.price,
            totalAmount,
            fees,
            status: "COMPLETED",
            paymentMethod,
            paymentReference,
            completedAt: new Date(),
        });
        yield transaction.save();
        res
            .status(201)
            .json({ message: "Transaction created successfully", transaction });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Transaction creation failed" });
    }
});
exports.createTransaction = createTransaction;
