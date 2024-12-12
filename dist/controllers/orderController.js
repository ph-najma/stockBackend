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
exports.processOrder = void 0;
const orderModel_1 = __importDefault(require("../models/orderModel"));
const realTimeStockModel_1 = __importDefault(require("../models/realTimeStockModel"));
const processOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, stockSymbol, type, orderType, quantity, price, stopPrice } = req.body;
    try {
        const stock = yield realTimeStockModel_1.default.findOne({ symbol: stockSymbol });
        if (!stock) {
            return res.status(404).json({ message: "Stock not found" });
        }
        let executionPrice = stock.price;
        if (orderType === "LIMIT" && price > 0) {
            if ((type === "BUY" && price >= stock.price) ||
                (type === "SELL" && price <= stock.price)) {
                executionPrice = price;
            }
            else {
                return res
                    .status(200)
                    .json({ message: "Order placed, pending matching" });
            }
        }
        if (orderType === "STOP" && stopPrice) {
            if ((type === "BUY" && stopPrice <= stock.price) ||
                (type === "SELL" && stopPrice >= stock.price)) {
                executionPrice = stopPrice;
            }
            else {
                return res
                    .status(200)
                    .json({ message: "Stop order triggered, pending execution" });
            }
        }
        const totalCost = executionPrice * quantity;
        const newOrder = yield orderModel_1.default.create({
            user: userId,
            stock: stock._id,
            type,
            orderType,
            quantity,
            price,
            stopPrice,
            status: "COMPLETED",
            completedAt: new Date(),
        });
        res.status(200).json({
            message: `Order ${orderType} executed at price ${executionPrice}`,
            order: newOrder,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Order processing failed" });
    }
});
exports.processOrder = processOrder;
