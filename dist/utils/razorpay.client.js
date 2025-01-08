"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayClient = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
exports.razorpayClient = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_sHq1xf34I99z5x",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "kgjoNUSGoxu5oxGXgImjBG7i",
});
