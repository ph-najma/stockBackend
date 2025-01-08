"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const app = (0, express_1.default)();
const paymentController = new paymentController_1.PaymentController();
app.use(express_1.default.json());
app.post("/create-order", (req, res) => paymentController.createOrder(req, res));
app.post("/verify-payment", (req, res) => paymentController.verifyPayment(req, res));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
