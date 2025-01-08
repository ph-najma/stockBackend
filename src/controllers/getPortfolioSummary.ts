import { Request, Response } from "express";
import User from "../models/userModel";
import Stock from "../models/stockModel";

export const getPortfolioSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate("portfolio.stockId");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const portfolioSummary = user.portfolio.map((item: any) => {
      const marketPrice = item.stockId.price;
      const totalValue = marketPrice * item.quantity;
      const profitLoss = totalValue - item.averagePurchasePrice * item.quantity;

      return {
        stock: item.stockId.symbol,
        quantity: item.quantity,
        averagePurchasePrice: item.averagePurchasePrice,
        currentPrice: marketPrice,
        totalValue,
        profitLoss,
      };
    });

    res.json({ portfolioSummary });
  } catch (error) {
    console.error("Error fetching portfolio summary:", error);
    res.status(500).json({ error: "Server error" });
  }
};
