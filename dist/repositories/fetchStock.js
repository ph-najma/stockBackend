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
exports.fetchStockRepository = void 0;
const axios_1 = __importDefault(require("axios"));
const stockModel_1 = __importDefault(require("../models/stockModel"));
class fetchStockRepository {
    fetchStockData(symbols) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                for (const symbol of symbols) {
                    // Fetch stock data from Alpha Vantage API
                    const response = yield axios_1.default.get("https://www.alphavantage.co/query", {
                        params: {
                            function: "GLOBAL_QUOTE",
                            symbol,
                            apikey: process.env.ALPHA_VANTAGE_API_KEY,
                        },
                    });
                    const globalQuote = response.data["Global Quote"];
                    if (!globalQuote) {
                        console.error("Error fetching data:", response.data);
                        return;
                    }
                    // Extract stock data from API response
                    const fetchedVolume = parseInt(globalQuote["06. volume"]);
                    // Check if the stock already exists in the database
                    const existingStock = yield stockModel_1.default.findOne({ symbol });
                    // If stock exists, update it, else create a new stock entry
                    if (existingStock) {
                        // Update the stock data and adjust the volume
                        existingStock.timestamp = new Date();
                        existingStock.latestTradingDay =
                            globalQuote["07. latest trading day"];
                        existingStock.price = parseFloat(globalQuote["05. price"]);
                        existingStock.change = parseFloat(globalQuote["09. change"]);
                        existingStock.changePercent = globalQuote["10. change percent"];
                        existingStock.open = parseFloat(globalQuote["02. open"]);
                        existingStock.high = parseFloat(globalQuote["03. high"]);
                        existingStock.low = parseFloat(globalQuote["04. low"]);
                        existingStock.close = parseFloat(globalQuote["08. previous close"]);
                        existingStock.volume = fetchedVolume; // Market volume from API
                        // Add fetched volume to adjusted volume (appending new volume data)
                        existingStock.adjustedVolume = existingStock.adjustedVolume || 0;
                        // Add the new volume
                        yield existingStock.save();
                        console.log("Stock data updated:", existingStock);
                    }
                    else {
                        // If stock doesn't exist, create a new stock entry
                        const stock = new stockModel_1.default({
                            symbol: globalQuote["01. symbol"],
                            timestamp: new Date(),
                            latestTradingDay: globalQuote["07. latest trading day"],
                            price: parseFloat(globalQuote["05. price"]),
                            change: parseFloat(globalQuote["09. change"]),
                            changePercent: globalQuote["10. change percent"],
                            open: parseFloat(globalQuote["02. open"]),
                            high: parseFloat(globalQuote["03. high"]),
                            low: parseFloat(globalQuote["04. low"]),
                            close: parseFloat(globalQuote["08. previous close"]),
                            volume: fetchedVolume,
                            adjustedVolume: fetchedVolume, // Initialize adjustedVolume with API volume
                        });
                        yield stock.save();
                        console.log("Stock data saved:", stock);
                    }
                }
            }
            catch (error) {
                console.error("Error fetching stock data:", error);
            }
        });
    }
}
exports.fetchStockRepository = fetchStockRepository;
