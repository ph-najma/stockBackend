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
exports.newOrderRepository = void 0;
const orderModel_1 = __importDefault(require("../models/orderModel"));
const transactionModel_1 = __importDefault(require("../models/transactionModel"));
const stockModel_1 = __importDefault(require("../models/stockModel"));
const userModel_1 = __importDefault(require("../models/userModel"));
const server_1 = require("../server");
class newOrderRepository {
    matchOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const marketOrders = yield orderModel_1.default.find({ status: "PENDING" });
                for (const order of marketOrders) {
                    const { orderType, type, price, quantity, stock, stopPrice } = order;
                    const oppositeSide = type === "BUY" ? "SELL" : "BUY";
                    const stockDoc = yield stockModel_1.default.findById(stock);
                    if (!stockDoc) {
                        console.error(`Stock with ID ${stock} not found`);
                        continue;
                    }
                    let bestOrder;
                    if (orderType === "MARKET") {
                        // Market order: Match with the best available price
                        bestOrder = yield orderModel_1.default.findOne({
                            stock,
                            type: oppositeSide,
                            status: "PENDING",
                        }).sort({ price: type === "BUY" ? 1 : -1 });
                    }
                    else if (orderType === "LIMIT") {
                        // Limit order: Match if conditions are met
                        bestOrder = yield orderModel_1.default.findOne({
                            stock,
                            type: oppositeSide,
                            status: "PENDING",
                            price: type === "BUY" ? { $lte: price } : { $gte: price },
                        }).sort({ createdAt: 1 });
                    }
                    else if (orderType === "STOP" && stopPrice) {
                        // Stop order: Trigger only when the stop price is reached
                        const shouldTrigger = (type === "BUY" && stockDoc.price >= stopPrice) ||
                            (type === "SELL" && stockDoc.price <= stopPrice);
                        if (shouldTrigger) {
                            // Treat stop order as a market order after triggering
                            bestOrder = yield orderModel_1.default.findOne({
                                stock,
                                type: oppositeSide,
                                status: "PENDING",
                            }).sort({ price: type === "BUY" ? 1 : -1 });
                        }
                        else {
                            console.log(`Stop order not triggered yet for order ${order._id}`);
                            continue;
                        }
                    }
                    if (bestOrder) {
                        const matchPrice = bestOrder.price;
                        const matchedQuantity = Math.min(quantity, bestOrder.quantity);
                        // Update orders
                        order.quantity -= matchedQuantity;
                        bestOrder.quantity -= matchedQuantity;
                        if (order.quantity === 0)
                            order.status = "COMPLETED";
                        if (bestOrder.quantity === 0)
                            bestOrder.status = "COMPLETED";
                        yield order.save();
                        yield bestOrder.save();
                        // Update stock price
                        stockDoc.price = matchPrice;
                        // Adjust the volume based on the transaction type (BUY/SELL)
                        if (type === "BUY") {
                            stockDoc.adjustedVolume += matchedQuantity; // Add bought quantity
                        }
                        else if (type === "SELL") {
                            stockDoc.adjustedVolume -= matchedQuantity; // Subtract sold quantity
                        }
                        yield stockDoc.save();
                        // Create transaction
                        const fees = 0.01 * matchPrice * matchedQuantity;
                        if (fees > 0) {
                            console.log("order macth found");
                        }
                        server_1.io.emit("stock-update", {
                            stockId: stockDoc._id,
                            price: matchPrice,
                        });
                        const transaction = yield transactionModel_1.default.create([
                            {
                                buyer: type === "BUY" ? order.user : bestOrder.user,
                                seller: type === "SELL" ? order.user : bestOrder.user,
                                buyOrder: type === "BUY" ? order._id : bestOrder._id,
                                sellOrder: type === "SELL" ? order._id : bestOrder._id,
                                stock: stockDoc._id,
                                type,
                                quantity: matchedQuantity,
                                price: matchPrice,
                                totalAmount: matchPrice * matchedQuantity,
                                fees,
                                status: "COMPLETED",
                                createdAt: new Date(),
                                completedAt: new Date(),
                            },
                        ]);
                        server_1.io.emit("transaction-update", transaction[0]);
                        // Update portfolios
                        yield this.updateUserPortfolios(transaction[0], stockDoc, type, matchedQuantity);
                    }
                    else {
                        console.log(`No matching order found for order ${order._id}`);
                    }
                }
                console.log("Order matching completed successfully");
            }
            catch (error) {
                console.error("Error matching orders:", error);
            }
        });
    }
    updateUserPortfolios(transaction, stockDoc, type, matchedQuantity) {
        return __awaiter(this, void 0, void 0, function* () {
            const buyer = yield userModel_1.default.findById(transaction.buyer);
            const seller = yield userModel_1.default.findById(transaction.seller);
            // Update buyer's portfolio
            if (buyer) {
                this.updatePortfolio(buyer, stockDoc._id, type === "BUY", matchedQuantity);
            }
            // Update seller's portfolio
            if (seller) {
                this.updatePortfolio(seller, stockDoc._id, type === "SELL", matchedQuantity);
            }
        });
    }
    updatePortfolio(user, stockId, isBuy, matchedQuantity) {
        return __awaiter(this, void 0, void 0, function* () {
            if (isBuy) {
                const existingPortfolio = yield userModel_1.default.findOne({
                    _id: user._id,
                    "portfolio.stockId": stockId,
                });
                if (existingPortfolio) {
                    yield userModel_1.default.findOneAndUpdate({ _id: user._id, "portfolio.stockId": stockId }, {
                        $inc: { "portfolio.$.quantity": matchedQuantity },
                    }, { new: true });
                }
                else {
                    yield userModel_1.default.updateOne({ _id: user._id }, {
                        $push: {
                            portfolio: {
                                stockId,
                                quantity: matchedQuantity,
                            },
                        },
                    }, { new: true });
                }
            }
            else {
                const updateResult = yield userModel_1.default.findOneAndUpdate({ _id: user._id, "portfolio.stockId": stockId }, {
                    $inc: { "portfolio.$.quantity": -matchedQuantity },
                }, { new: true });
                // Remove the stock from portfolio if the quantity reaches zero.
                if (updateResult === null || updateResult === void 0 ? void 0 : updateResult.portfolio.some((item) => item.quantity === 0)) {
                    yield userModel_1.default.updateOne({ _id: user._id }, {
                        $pull: { portfolio: { stockId, quantity: 0 } },
                    });
                }
            }
        });
    }
}
exports.newOrderRepository = newOrderRepository;
