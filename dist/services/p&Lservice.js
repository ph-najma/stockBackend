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
exports.calculateRealTimePnL = exports.calculatePnL = void 0;
const transactionModel_1 = __importDefault(require("../models/transactionModel"));
const calculatePnL = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const transactions = yield transactionModel_1.default.find({
        $or: [{ buyer: userId }, { seller: userId }],
        status: "COMPLETED",
    })
        .populate("stock")
        .populate("buyOrder sellOrder")
        .exec();
    const stockGroups = transactions.reduce((acc, transaction) => {
        const stock = transaction.stock;
        const buyOrder = transaction.buyOrder; // Assert populated IOrder
        const stockId = stock._id.toString();
        if (!acc[stockId])
            acc[stockId] = [];
        acc[stockId].push(transaction);
        return acc;
    }, {});
    const results = Object.entries(stockGroups).map(([stockId, stockTransactions]) => {
        let totalPnL = 0;
        const breakdown = stockTransactions.map((transaction) => {
            const { price, quantity, fees, type } = transaction;
            const buyOrder = transaction.buyOrder; // Explicitly handle populated buyOrder
            const buyPrice = buyOrder.price || 0;
            const pnl = type === "SELL" ? (price - buyPrice) * quantity - fees : 0;
            totalPnL += pnl;
            return {
                buyPrice,
                sellPrice: price,
                quantity,
                fees,
                pnl,
            };
        });
        return {
            stock: stockId,
            totalPnL,
            breakdown,
        };
    });
    return results;
});
exports.calculatePnL = calculatePnL;
const calculateRealTimePnL = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch transactions for the user with PENDING status
    const transactions = yield transactionModel_1.default.find({
        $or: [{ buyer: userId }, { seller: userId }],
        status: "PENDING",
    }).populate("stock");
    const results = [];
    for (const transaction of transactions) {
        if (!transaction.stock) {
            continue; // Skip if stock is not populated
        }
        // Fetch current market price from the stock or a service
        const currentMarketPrice = transaction.stock.price;
        const { price: buyPrice, quantity, fees } = transaction;
        // Calculate PnL
        const pnl = (currentMarketPrice - buyPrice) * quantity - fees;
        // Add to results
        results.push({
            stock: transaction.stock.symbol,
            totalPnL: pnl,
            breakdown: [
                {
                    buyPrice,
                    sellPrice: currentMarketPrice,
                    quantity,
                    fees,
                    pnl,
                },
            ],
        });
    }
    return results;
});
exports.calculateRealTimePnL = calculateRealTimePnL;
