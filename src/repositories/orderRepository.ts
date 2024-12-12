import Order from "../models/orderModel";

export class OrderRepository {
  async findById(orderId: string) {
    return Order.findById(orderId).populate("user").populate("stock").exec();
  }

  async findCompletedOrders() {
    return Order.find({ status: "COMPLETED" })
      .populate("user")
      .populate("stock")
      .exec();
  }

  async findOrdersByType(query: any) {
    return Order.find(query).exec();
  }
  async createOrder(orderData: any) {
    return Order.create(orderData);
  }
}
