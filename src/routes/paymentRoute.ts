import express from "express";
import { PaymentController } from "../controllers/paymentController";

const app = express();
const paymentController = new PaymentController();

app.use(express.json());

app.post("/create-order", (req, res) =>
  paymentController.createOrder(req, res)
);
app.post("/verify-payment", (req, res) =>
  paymentController.verifyPayment(req, res)
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
