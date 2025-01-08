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
exports.watchlistRepostory = void 0;
const watchlistModel_1 = __importDefault(require("../models/watchlistModel"));
class watchlistRepostory {
    getByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const raw = yield watchlistModel_1.default.findOne({ user: userId });
            console.log(raw);
            const watchlist = yield watchlistModel_1.default.findOne({ user: userId }).populate({
                path: "stocks.symbol",
                select: "symbol  price change volume",
            });
            console.log("from wathclist", watchlist);
            return watchlist;
        });
    }
    ensureWatchlistAndAddStock(userId, stockSymbol) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId) {
                throw new Error("User ID is required.");
            }
            // Find the user's watchlist
            let watchlist = yield watchlistModel_1.default.findOne({ user: userId });
            if (watchlist) {
                // Check if the stock is already in the watchlist
                const stockExists = watchlist.stocks.some((stock) => stock.symbol === stockSymbol);
                // If the stock is not in the watchlist, add it
                if (!stockExists) {
                    watchlist.stocks.push({ symbol: stockSymbol, addedAt: new Date() });
                    yield watchlist.save();
                }
            }
            else {
                // If no watchlist exists, create a new one with the stock
                watchlist = new watchlistModel_1.default({
                    user: userId,
                    stocks: [{ symbol: stockSymbol, addedAt: new Date() }],
                });
                yield watchlist.save();
            }
            console.log("Updated watchlist:", watchlist);
            return watchlist;
        });
    }
}
exports.watchlistRepostory = watchlistRepostory;
