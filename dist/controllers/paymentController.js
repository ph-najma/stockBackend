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
exports.PaymentController = void 0;
const paymentServices_1 = require("../services/paymentServices");
class PaymentController {
    constructor() {
        this.paymentService = new paymentServices_1.PaymentService();
    }
    createOrder(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                const { amount } = req.body;
                const order = yield this.paymentService.createOrder(userId, amount);
                res.status(201).json(order);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
    verifyPayment(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                console.log(userId, "from controller");
                const { orderId, paymentId, signature } = req.body;
                const isVerified = yield this.paymentService.verifyPayment(userId, orderId, paymentId, signature);
                if (isVerified) {
                    res.status(200).json({ success: true });
                }
                else {
                    res.status(400).json({ success: false, message: "Invalid signature" });
                }
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        });
    }
}
exports.PaymentController = PaymentController;
