import { PaymentRepository } from "../repositories/paymentRepository";
import { UserRepository } from "../repositories/userRepository";
export class PaymentService {
  private paymentRepository: PaymentRepository;
  private userRepository: UserRepository;
  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.userRepository = new UserRepository();
  }

  async createOrder(
    userId: string | undefined,
    amount: number
  ): Promise<Razorpay.Order> {
    if (amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }
    return this.paymentRepository.createOrder(amount);
  }

  async verifyPayment(
    userId: string | undefined,
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    console.log("helo from payment service", userId);
    const isVerified = this.paymentRepository.verifyPaymentSignature(
      orderId,
      paymentId,
      signature
    );

    const amount = 100;
    const updatedUser = await this.userRepository.updateUserBalance(
      userId,
      amount
    );

    if (!updatedUser) {
      console.log("not updated");
      throw new Error("Failed to update user balance");
    }

    return true;
  }
}
