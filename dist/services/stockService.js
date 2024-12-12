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
exports.StockService = void 0;
const StockRepository_1 = require("../repositories/StockRepository");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class StockService {
    constructor() {
        this.stockRepository = new StockRepository_1.StockRepository();
    }
    // Fetch real-time stock data from Alpha Vantage
    fetchRealTimeStockData(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=1min&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
            try {
                const response = yield axios_1.default.get(apiUrl);
                console.log(response);
                const data = response.data["Time Series (1min)"];
                if (!data) {
                    throw new Error("No stock data found");
                }
                const latestTime = Object.keys(data)[0];
                const latestData = data[latestTime];
                const realTimeStockData = {
                    symbol,
                    price: parseFloat(latestData["4. close"]),
                    volume: parseInt(latestData["5. volume"]),
                    changePercent: parseFloat(latestData["4. close"]) /
                        parseFloat(latestData["1. open"]) -
                        1,
                    company: yield this.fetchCompany(symbol), // Fetch company info
                    timestamp: new Date(),
                };
                return this.stockRepository.createOrUpdate(realTimeStockData);
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    }
    // Fetch historical stock data for the last 30 days
    fetchHistoricalStockData(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
            try {
                const response = yield axios_1.default.get(apiUrl);
                const data = response.data["Time Series (Daily)"];
                if (!data) {
                    throw new Error("No stock data found");
                }
                const historicalStockData = Object.keys(data).map((date) => ({
                    symbol,
                    date: new Date(date),
                    open: parseFloat(data[date]["1. open"]),
                    high: parseFloat(data[date]["2. high"]),
                    low: parseFloat(data[date]["3. low"]),
                    close: parseFloat(data[date]["4. close"]),
                    volume: parseInt(data[date]["5. volume"]),
                }));
                // Save or update historical data
                return Promise.all(historicalStockData.map((stockData) => this.stockRepository.create(stockData)));
            }
            catch (error) {
                throw new Error(error.message);
            }
        });
    }
    // Fetch company data
    fetchCompany(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            let company = yield this.stockRepository.findBySymbol(symbol);
            if (!company) {
                // Fetch new company data (this can be adjusted based on your API)
                const companyApiUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
                const response = yield axios_1.default.get(companyApiUrl);
                const companyData = response.data;
                company = yield this.stockRepository.createOrUpdateCompany({
                    symbol,
                    name: companyData.Name,
                    marketCap: parseInt(companyData.MarketCapitalization),
                    sector: companyData.Sector,
                    industry: companyData.Industry,
                    description: companyData.Description,
                });
            }
            return company;
        });
    }
    // Wrapper to fetch both real-time and historical data
    fetchStockData(symbols) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const symbol of symbols) {
                yield this.fetchRealTimeStockData(symbol);
                yield this.fetchHistoricalStockData(symbol);
            }
        });
    }
}
exports.StockService = StockService;
