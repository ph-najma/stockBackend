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
exports.StockRepository = void 0;
const realTimeStockModel_1 = __importDefault(require("../models/realTimeStockModel"));
class StockRepository {
    getAllStocks() {
        return __awaiter(this, void 0, void 0, function* () {
            return realTimeStockModel_1.default.find().exec();
        });
    }
    updateStock(stockId, stockData) {
        return __awaiter(this, void 0, void 0, function* () {
            return realTimeStockModel_1.default.findByIdAndUpdate(stockId, stockData, {
                new: true,
            });
        });
    }
    softDeleteStock(stockId) {
        return __awaiter(this, void 0, void 0, function* () {
            return realTimeStockModel_1.default.findByIdAndUpdate(stockId, { isDeleted: true }, { new: true });
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return realTimeStockModel_1.default.findById(id);
        });
    }
    updateVolume(id, volumeChange) {
        return __awaiter(this, void 0, void 0, function* () {
            const stock = yield realTimeStockModel_1.default.findById(id);
            if (stock) {
                stock.volume += volumeChange;
                return stock.save();
            }
            return null;
        });
    }
}
exports.StockRepository = StockRepository;
