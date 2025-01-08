import TransactionModel, { ITransaction } from "../models/transactionModel";
import Stock, { IStock } from "../models/stockModel";
import { IOrder } from "../models/orderModel";
import { UserService } from "./userService";
import { StockRepository } from "../repositories/stockrepository"; // Fetch real-time stock prices

interface PnLResult {
  stock: string;
  totalPnL: number;
  breakdown: {
    buyPrice: number;
    sellPrice: number;
    quantity: number;
    fees: number;
    pnl: number;
  }[];
}

export const calculatePnL = async (userId: string): Promise<PnLResult[]> => {
  const transactions = await TransactionModel.find({
    $or: [{ buyer: userId }, { seller: userId }],
    status: "COMPLETED",
  })
    .populate<{ stock: IStock }>("stock")
    .populate<{ buyOrder: IOrder; sellOrder: IOrder }>("buyOrder sellOrder")
    .exec();

  const stockGroups = transactions.reduce((acc, transaction) => {
    const stock = transaction.stock as IStock;
    const buyOrder = transaction.buyOrder as IOrder; // Assert populated IOrder
    const stockId = stock._id.toString();

    if (!acc[stockId]) acc[stockId] = [];
    acc[stockId].push(transaction);

    return acc;
  }, {} as Record<string, ITransaction[]>);

  const results = Object.entries(stockGroups).map(
    ([stockId, stockTransactions]) => {
      let totalPnL = 0;

      const breakdown = stockTransactions.map((transaction) => {
        const { price, quantity, fees, type } = transaction;
        const buyOrder = transaction.buyOrder as IOrder; // Explicitly handle populated buyOrder
        const buyPrice = buyOrder.price || 0;

        const pnl = type === "SELL" ? (price - buyPrice) * quantity - fees : 0;

        totalPnL += pnl;

        return {
          buyPrice,
          sellPrice: price,
          quantity,
          fees,
          pnl,
        };
      });

      return {
        stock: stockId,
        totalPnL,
        breakdown,
      };
    }
  );

  return results;
};

export const calculateRealTimePnL = async (
  userId: string
): Promise<PnLResult[]> => {
  // Fetch transactions for the user with PENDING status
  const transactions = await TransactionModel.find<ITransaction>({
    $or: [{ buyer: userId }, { seller: userId }],
    status: "PENDING",
  }).populate<{ stock: IStock }>("stock");

  const results: PnLResult[] = [];

  for (const transaction of transactions) {
    if (!transaction.stock) {
      continue; // Skip if stock is not populated
    }

    // Fetch current market price from the stock or a service
    const currentMarketPrice = transaction.stock.price;

    const { price: buyPrice, quantity, fees } = transaction;

    // Calculate PnL
    const pnl = (currentMarketPrice - buyPrice) * quantity - fees;

    // Add to results
    results.push({
      stock: transaction.stock.symbol,
      totalPnL: pnl,
      breakdown: [
        {
          buyPrice,
          sellPrice: currentMarketPrice,
          quantity,
          fees,
          pnl,
        },
      ],
    });
  }

  return results;
};
