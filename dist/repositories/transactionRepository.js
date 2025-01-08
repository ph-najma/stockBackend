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
exports.transactionRepository = void 0;
const transactionModel_1 = __importDefault(require("../models/transactionModel"));
class transactionRepository {
    getTransactions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield transactionModel_1.default
                .find({
                $or: [{ buyer: userId }, { seller: userId }],
            })
                .populate("buyer")
                .populate("seller")
                .populate("buyOrder")
                .populate("sellOrder")
                .populate("stock");
            console.log("Fetched transactions:", transactions);
            return transactions;
        });
    }
    getAllTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = yield transactionModel_1.default
                .find()
                .populate("buyer", "name")
                .populate("seller", "name")
                .populate("stock", "symbol")
                .exec();
            console.log(transactions, "from here");
            return transactions;
        });
    }
    getFeeCollectionSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const totalFees = yield transactionModel_1.default.aggregate([
                    {
                        $match: {
                            status: "COMPLETED",
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalFees: { $sum: "$fees" },
                        },
                    },
                ]);
                console.log(totalFees);
                return ((_a = totalFees[0]) === null || _a === void 0 ? void 0 : _a.totalFees) || 0;
            }
            catch (error) {
                console.error("Error fetching fee collection summary: ", error);
                throw error;
            }
        });
    }
}
exports.transactionRepository = transactionRepository;
