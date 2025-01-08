declare namespace Razorpay {
  interface Order {
    id: string;
    entity: string;
    amount: string | number; // Allow both string and number
    currency: string;
    receipt?: string; // Allow undefined
    status: string;
    created_at: number;
  }

  interface OrderCreateOptions {
    amount: number;
    currency: string;
    receipt: string;
    payment_capture?: 1 | 0;
    notes?: Record<string, string>;
  }

  interface RazorpayClient {
    orders: {
      create(options: OrderCreateOptions): Promise<Order>;
    };
  }
}
