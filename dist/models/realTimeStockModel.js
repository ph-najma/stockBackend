"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const realTimeStockSchema = new mongoose_1.default.Schema({
    symbol: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    volume: { type: Number, required: true },
    changePercent: { type: Number, required: true },
    company: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Company" },
    timestamp: { type: Date, default: Date.now, required: true },
    deleted: { type: Boolean, default: false },
});
exports.default = mongoose_1.default.model("RealTimeStock", realTimeStockSchema);
