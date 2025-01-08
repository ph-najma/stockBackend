import { Request, Response } from "express";
import { PaymentService } from "../services/paymentServices";
export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { amount } = req.body;
      const order = await this.paymentService.createOrder(userId, amount);
      res.status(201).json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      console.log(userId, "from controller");
      const { orderId, paymentId, signature } = req.body;
      const isVerified = await this.paymentService.verifyPayment(
        userId,
        orderId,
        paymentId,
        signature
      );

      if (isVerified) {
        res.status(200).json({ success: true });
      } else {
        res.status(400).json({ success: false, message: "Invalid signature" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
