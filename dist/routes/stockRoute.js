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
const express_1 = __importDefault(require("express"));
const newStock_1 = __importDefault(require("../models/newStock"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
router.get("/angelStocks/:symbol", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { symbol } = req.params;
    console.log("heloo");
    try {
        // Call Angel One API
        const response = yield axios_1.default.get(`https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/getLTPData`, {
            headers: {
                Authorization: `Bearer ${process.env.ANGEL_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-API-KEY": process.env.ANGEL_API_KEY,
            },
            params: {
                exchange: "NSE", // or "BSE"
                tradingsymbol: symbol,
            },
        });
        console.log(response);
        console.log("API Response:", response.data);
        console.log("this is data", response.data.data);
        const stockData = response.data.data;
        if (stockData && stockData.tradingsymbol) {
            const stock = new newStock_1.default({
                symbol: stockData.tradingsymbol,
                ltp: stockData.ltp,
                volume: stockData.volume,
                change: stockData.change,
            });
            yield stock.save();
            res.status(200).json({
                message: "Stock data fetched and saved successfully",
                data: stock,
            });
        }
        else {
            res.status(400).json({
                message: "Invalid data format received from the API",
            });
        }
    }
    catch (error) {
        console.error("Error fetching stock data:", error.message);
        res
            .status(500)
            .json({ message: "Error fetching stock data", error: error.message });
    }
}));
router.get("/getData", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const stocks = yield newStock_1.default.find();
    res.status(200).json(stocks);
}));
exports.default = router;
