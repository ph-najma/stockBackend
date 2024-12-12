"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const companySchema = new mongoose_1.default.Schema({
    symbol: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    marketCap: { type: Number },
    sector: { type: String },
    industry: { type: String },
    description: { type: String },
});
exports.default = mongoose_1.default.model("Company", companySchema);
