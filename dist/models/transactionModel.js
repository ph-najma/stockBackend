"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// models/transactionModel.ts
const mongoose_1 = __importStar(require("mongoose"));
const transactionSchema = new mongoose_1.Schema({
    buyer: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    buyOrder: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order", required: true },
    sellOrder: { type: mongoose_1.Schema.Types.ObjectId, ref: "Order", required: true },
    stock: { type: mongoose_1.Schema.Types.ObjectId, ref: "Stock", required: true },
    type: { type: String, enum: ["BUY", "SELL"], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    fees: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ["PENDING", "COMPLETED", "FAILED"],
        default: "PENDING",
    },
    paymentMethod: {
        type: String,
        enum: ["PAYPAL", "CREDIT_CARD", "BANK_TRANSFER"],
        default: "PAYPAL",
    },
    paymentReference: { type: String },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
});
exports.default = mongoose_1.default.model("Transaction", transactionSchema);
