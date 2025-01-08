import { razorpayClient } from "../utils/razorpay.client";

export class PaymentRepository {
  async createOrder(amount: number): Promise<Razorpay.Order> {
    const options: Razorpay.OrderCreateOptions = {
      amount: amount * 100, // Amount in paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpayClient.orders.create(options);
    order.amount =
      typeof order.amount === "string"
        ? parseInt(order.amount, 10)
        : order.amount; // Ensure amount is a number
    return order;
  }

  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET || "kgjoNUSGoxu5oxGXgImjBG7i"
      )
      .update(orderId + "|" + paymentId)
      .digest("hex");
    console.log(expectedSignature);
    return expectedSignature === signature;
  }
}
