// services/squareOffService.ts
import OrderModel, { IOrder } from "../models/orderModel";
import StockModel from "../models/stockModel";

export async function autoSquareOff(): Promise<void> {
  try {
    const currentTime = new Date();

    // Define the cutoff time for intraday orders (e.g., 3:15 PM)
    const squareOffTime = new Date();
    squareOffTime.setHours(15, 15, 0, 0);

    if (currentTime >= squareOffTime) {
      // Fetch all pending intraday orders
      const intradayOrders = await OrderModel.find({
        isIntraday: true,
        status: "PENDING",
      }).populate("stock");

      const squareOffPromises = intradayOrders.map(async (order: IOrder) => {
        // Determine the type of order needed for square-off
        const squareOffType = order.type === "BUY" ? "SELL" : "BUY";

        // Fetch current stock price
        const stock = await StockModel.findById(order.stock);
        if (!stock) {
          console.error(`Stock not found for ID: ${order.stock}`);
          return;
        }

        // Place the square-off order
        const squareOffOrder = new OrderModel({
          user: order.user,
          stock: order.stock,
          type: squareOffType,
          orderType: "MARKET",
          quantity: order.quantity,
          price: stock.price, // Current market price
          status: "COMPLETED",
          isIntraday: true,
        });

        // Save the square-off order
        await squareOffOrder.save();

        // Mark the original order as completed
        order.status = "COMPLETED";
        order.completedAt = new Date();
        await order.save();

        console.log(`Order ${order._id} squared off successfully.`);
      });

      await Promise.all(squareOffPromises);
      console.log("All intraday orders squared off.");
    } else {
      console.log("Square-off time not reached yet.");
    }
  } catch (error) {
    console.error("Error during auto square-off:", error);
  }
}
