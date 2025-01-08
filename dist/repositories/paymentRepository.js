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
exports.PaymentRepository = void 0;
const razorpay_client_1 = require("../utils/razorpay.client");
class PaymentRepository {
    createOrder(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                amount: amount * 100, // Amount in paisa
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
            };
            const order = yield razorpay_client_1.razorpayClient.orders.create(options);
            order.amount =
                typeof order.amount === "string"
                    ? parseInt(order.amount, 10)
                    : order.amount; // Ensure amount is a number
            return order;
        });
    }
    verifyPaymentSignature(orderId, paymentId, signature) {
        const crypto = require("crypto");
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "kgjoNUSGoxu5oxGXgImjBG7i")
            .update(orderId + "|" + paymentId)
            .digest("hex");
        console.log(expectedSignature);
        return expectedSignature === signature;
    }
}
exports.PaymentRepository = PaymentRepository;
