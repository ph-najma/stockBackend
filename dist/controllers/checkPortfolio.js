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
exports.checkPortfolio = void 0;
const userModel_1 = __importDefault(require("../models/userModel"));
const checkPortfolio = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, stockId, quantity, type } = req.body;
        const user = yield userModel_1.default.findById(userId).populate("portfolio.stockId");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // For SELL Orders: Check if the user has enough stock
        if (type === "SELL") {
            const portfolioItem = user.portfolio.find((item) => item.stockId === stockId);
            if (!portfolioItem || portfolioItem.quantity < quantity) {
                res.status(400).json({
                    message: "Insufficient stock in portfolio for this sell order",
                });
                return;
            }
        }
        // For BUY Orders: Add additional checks for funds if needed
        // (For now, assuming there's no fund-check logic here.)
        res.status(200).json({ message: "Portfolio check passed" });
    }
    catch (error) {
        console.error("Error checking portfolio:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.checkPortfolio = checkPortfolio;
