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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const paymentRepository_1 = require("../repositories/paymentRepository");
const userRepository_1 = require("../repositories/userRepository");
class PaymentService {
    constructor() {
        this.paymentRepository = new paymentRepository_1.PaymentRepository();
        this.userRepository = new userRepository_1.UserRepository();
    }
    createOrder(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount <= 0) {
                throw new Error("Amount must be greater than zero");
            }
            return this.paymentRepository.createOrder(amount);
        });
    }
    verifyPayment(userId, orderId, paymentId, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("helo from payment service", userId);
            const isVerified = this.paymentRepository.verifyPaymentSignature(orderId, paymentId, signature);
            const amount = 100;
            const updatedUser = yield this.userRepository.updateUserBalance(userId, amount);
            if (!updatedUser) {
                console.log("not updated");
                throw new Error("Failed to update user balance");
            }
            return true;
        });
    }
}
exports.PaymentService = PaymentService;
