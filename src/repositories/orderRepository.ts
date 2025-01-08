import Order, { IOrder } from "../models/orderModel";
import { ILimitOrderQuery } from "../interfaces/OrderInterface";

export interface IOrderRepository {
  findById(orderId: string): Promise<IOrder | null>;
  findOrders(UserId: string | undefined): Promise<IOrder[] | null>;
  findCompletedOrders(): Promise<IOrder[]>;
  findOrdersByType(query: ILimitOrderQuery): Promise<IOrder[]>;
  createOrder(orderData: Partial<IOrder>): Promise<IOrder>;
  getAllOrders(): Promise<IOrder[]>;
  cancelOrder(orderId: string): Promise<IOrder | null>;
}
export class OrderRepository {
  async findById(orderId: string): Promise<IOrder | null> {
    return Order.findById(orderId).populate("user").populate("stock").exec();
  }
  async findOrders(UserId: string | undefined): Promise<IOrder[] | null> {
    return Order.find({ user: UserId }).populate("stock", "symbol name").exec();
  }

  async findCompletedOrders(): Promise<IOrder[]> {
    return Order.find({ status: "COMPLETED" })
      .populate("user")
      .populate("stock")
      .exec();
  }

  async findOrdersByType(query: ILimitOrderQuery): Promise<IOrder[]> {
    return Order.find(query).populate("user").populate("stock").exec();
  }
  async createOrder(orderData: Partial<IOrder>): Promise<IOrder> {
    return Order.create(orderData);
  }
  async getAllOrders(): Promise<IOrder[]> {
    return Order.find()
      .sort({ createdAt: -1 })
      .populate("user")
      .populate("stock")
      .exec();
  }
  async cancelOrder(orderId: string): Promise<IOrder | null> {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: "FAILED" },
      { new: true }
    ).exec();

    return updatedOrder;
  }
}
