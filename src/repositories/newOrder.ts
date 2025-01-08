import Order from "../models/orderModel";
import transactionModel from "../models/transactionModel";
import Stock from "../models/stockModel";
import User from "../models/userModel";
import { IUser } from "../models/userModel";
import { IStock } from "../models/stockModel";
import { ITransaction } from "../models/transactionModel";
import { io } from "../server";

export class newOrderRepository {
  async matchOrders(): Promise<void> {
    try {
      const marketOrders = await Order.find({ status: "PENDING" });

      for (const order of marketOrders) {
        const { orderType, type, price, quantity, stock, stopPrice } = order;
        const oppositeSide = type === "BUY" ? "SELL" : "BUY";

        const stockDoc = await Stock.findById(stock);

        if (!stockDoc) {
          console.error(`Stock with ID ${stock} not found`);
          continue;
        }

        let bestOrder;

        if (orderType === "MARKET") {
          // Market order: Match with the best available price
          bestOrder = await Order.findOne({
            stock,
            type: oppositeSide,
            status: "PENDING",
          }).sort({ price: type === "BUY" ? 1 : -1 });
        } else if (orderType === "LIMIT") {
          // Limit order: Match if conditions are met
          bestOrder = await Order.findOne({
            stock,
            type: oppositeSide,
            status: "PENDING",
            price: type === "BUY" ? { $lte: price } : { $gte: price },
          }).sort({ createdAt: 1 });
        } else if (orderType === "STOP" && stopPrice) {
          // Stop order: Trigger only when the stop price is reached
          const shouldTrigger =
            (type === "BUY" && stockDoc.price >= stopPrice) ||
            (type === "SELL" && stockDoc.price <= stopPrice);
          if (shouldTrigger) {
            // Treat stop order as a market order after triggering
            bestOrder = await Order.findOne({
              stock,
              type: oppositeSide,
              status: "PENDING",
            }).sort({ price: type === "BUY" ? 1 : -1 });
          } else {
            console.log(`Stop order not triggered yet for order ${order._id}`);
            continue;
          }
        }

        if (bestOrder) {
          const matchPrice = bestOrder.price;
          const matchedQuantity = Math.min(quantity, bestOrder.quantity);

          // Update orders
          order.quantity -= matchedQuantity;
          bestOrder.quantity -= matchedQuantity;
          if (order.quantity === 0) order.status = "COMPLETED";
          if (bestOrder.quantity === 0) bestOrder.status = "COMPLETED";

          await order.save();
          await bestOrder.save();

          // Update stock price
          stockDoc.price = matchPrice;
          // Adjust the volume based on the transaction type (BUY/SELL)
          if (type === "BUY") {
            stockDoc.adjustedVolume += matchedQuantity; // Add bought quantity
          } else if (type === "SELL") {
            stockDoc.adjustedVolume -= matchedQuantity; // Subtract sold quantity
          }
          await stockDoc.save();

          // Create transaction
          const fees = 0.01 * matchPrice * matchedQuantity;
          if (fees > 0) {
            console.log("order macth found");
          }

          io.emit("stock-update", {
            stockId: stockDoc._id,
            price: matchPrice,
          });
          const transaction = await transactionModel.create([
            {
              buyer: type === "BUY" ? order.user : bestOrder.user,
              seller: type === "SELL" ? order.user : bestOrder.user,
              buyOrder: type === "BUY" ? order._id : bestOrder._id,
              sellOrder: type === "SELL" ? order._id : bestOrder._id,
              stock: stockDoc._id,
              type,
              quantity: matchedQuantity,
              price: matchPrice,
              totalAmount: matchPrice * matchedQuantity,
              fees,
              status: "COMPLETED",
              createdAt: new Date(),
              completedAt: new Date(),
            },
          ]);
          io.emit("transaction-update", transaction[0]);

          // Update portfolios
          await this.updateUserPortfolios(
            transaction[0],
            stockDoc,
            type,
            matchedQuantity
          );
        } else {
          console.log(`No matching order found for order ${order._id}`);
        }
      }

      console.log("Order matching completed successfully");
    } catch (error) {
      console.error("Error matching orders:", error);
    }
  }

  private async updateUserPortfolios(
    transaction: ITransaction,
    stockDoc: IStock,
    type: "BUY" | "SELL",
    matchedQuantity: number
  ) {
    const buyer = await User.findById(transaction.buyer);
    const seller = await User.findById(transaction.seller);

    // Update buyer's portfolio
    if (buyer) {
      this.updatePortfolio(
        buyer,
        stockDoc._id,
        type === "BUY",
        matchedQuantity
      );
    }

    // Update seller's portfolio
    if (seller) {
      this.updatePortfolio(
        seller,
        stockDoc._id,
        type === "SELL",
        matchedQuantity
      );
    }
  }

  private async updatePortfolio(
    user: IUser,
    stockId: IStock["_id"],
    isBuy: boolean,
    matchedQuantity: number
  ) {
    if (isBuy) {
      const existingPortfolio = await User.findOne({
        _id: user._id,
        "portfolio.stockId": stockId,
      });

      if (existingPortfolio) {
        await User.findOneAndUpdate(
          { _id: user._id, "portfolio.stockId": stockId },
          {
            $inc: { "portfolio.$.quantity": matchedQuantity },
          },
          { new: true }
        );
      } else {
        await User.updateOne(
          { _id: user._id },
          {
            $push: {
              portfolio: {
                stockId,
                quantity: matchedQuantity,
              },
            },
          },
          { new: true }
        );
      }
    } else {
      const updateResult = await User.findOneAndUpdate(
        { _id: user._id, "portfolio.stockId": stockId },
        {
          $inc: { "portfolio.$.quantity": -matchedQuantity },
        },
        { new: true }
      );

      // Remove the stock from portfolio if the quantity reaches zero.
      if (updateResult?.portfolio.some((item: any) => item.quantity === 0)) {
        await User.updateOne(
          { _id: user._id },
          {
            $pull: { portfolio: { stockId, quantity: 0 } },
          }
        );
      }
    }
  }
}
