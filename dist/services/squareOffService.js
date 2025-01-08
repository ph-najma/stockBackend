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
exports.autoSquareOff = autoSquareOff;
// services/squareOffService.ts
const orderModel_1 = __importDefault(require("../models/orderModel"));
const stockModel_1 = __importDefault(require("../models/stockModel"));
function autoSquareOff() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const currentTime = new Date();
            // Define the cutoff time for intraday orders (e.g., 3:15 PM)
            const squareOffTime = new Date();
            squareOffTime.setHours(15, 15, 0, 0);
            if (currentTime >= squareOffTime) {
                // Fetch all pending intraday orders
                const intradayOrders = yield orderModel_1.default.find({
                    isIntraday: true,
                    status: "PENDING",
                }).populate("stock");
                const squareOffPromises = intradayOrders.map((order) => __awaiter(this, void 0, void 0, function* () {
                    // Determine the type of order needed for square-off
                    const squareOffType = order.type === "BUY" ? "SELL" : "BUY";
                    // Fetch current stock price
                    const stock = yield stockModel_1.default.findById(order.stock);
                    if (!stock) {
                        console.error(`Stock not found for ID: ${order.stock}`);
                        return;
                    }
                    // Place the square-off order
                    const squareOffOrder = new orderModel_1.default({
                        user: order.user,
                        stock: order.stock,
                        type: squareOffType,
                        orderType: "MARKET",
                        quantity: order.quantity,
                        price: stock.price, // Current market price
                        status: "COMPLETED",
                        isIntraday: true,
                    });
                    // Save the square-off order
                    yield squareOffOrder.save();
                    // Mark the original order as completed
                    order.status = "COMPLETED";
                    order.completedAt = new Date();
                    yield order.save();
                    console.log(`Order ${order._id} squared off successfully.`);
                }));
                yield Promise.all(squareOffPromises);
                console.log("All intraday orders squared off.");
            }
            else {
                console.log("Square-off time not reached yet.");
            }
        }
        catch (error) {
            console.error("Error during auto square-off:", error);
        }
    });
}
