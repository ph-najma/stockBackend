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
const userModel_1 = __importDefault(require("../models/userModel"));
const stockModel_1 = __importDefault(require("../models/stockModel"));
const getPortfolio = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch portfolio data
        const userId = req.userId; // Assuming `req.user` is populated via middleware
        const user = yield userModel_1.default.findById(userId).populate({
            path: "portfolio.stockId",
            model: stockModel_1.default,
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const portfolio = user.portfolio.map((item) => {
            const stock = item.stockId;
            return {
                symbol: stock.symbol,
                name: stock.name,
                price: stock.price,
                quantity: item.quantity,
                changePercent: stock.changePercent,
            };
        });
        const totalValue = portfolio.reduce((sum, item) => sum + item.price * item.quantity, 0);
        res.status(200).json({ portfolio, totalValue });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = getPortfolio;
