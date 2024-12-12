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
exports.getHistoricalStockBySymbol = exports.createHistoricalStock = void 0;
const historicalStockModel_1 = __importDefault(require("../models/historicalStockModel"));
// Create a new historical stock record
const createHistoricalStock = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const historicalStock = new historicalStockModel_1.default(data);
    yield historicalStock.save();
    return historicalStock;
});
exports.createHistoricalStock = createHistoricalStock;
// Get historical data by symbol
const getHistoricalStockBySymbol = (symbol) => __awaiter(void 0, void 0, void 0, function* () {
    return historicalStockModel_1.default.find({ symbol }).sort({ date: -1 });
});
exports.getHistoricalStockBySymbol = getHistoricalStockBySymbol;
