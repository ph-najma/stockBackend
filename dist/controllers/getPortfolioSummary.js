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
exports.getPortfolioSummary = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const getPortfolioSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        const user = yield userModel_1.default.findById(userId).populate("portfolio.stockId");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const portfolioSummary = user.portfolio.map((item) => {
            const marketPrice = item.stockId.price;
            const totalValue = marketPrice * item.quantity;
            const profitLoss = totalValue - item.averagePurchasePrice * item.quantity;
            return {
                stock: item.stockId.symbol,
                quantity: item.quantity,
                averagePurchasePrice: item.averagePurchasePrice,
                currentPrice: marketPrice,
                totalValue,
                profitLoss,
            };
        });
        res.json({ portfolioSummary });
    }
    catch (error) {
        console.error("Error fetching portfolio summary:", error);
        res.status(500).json({ error: "Server error" });
    }
});
exports.getPortfolioSummary = getPortfolioSummary;
