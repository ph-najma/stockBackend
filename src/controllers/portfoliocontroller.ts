import { Request, Response } from "express";
import User from "../models/userModel";
import Stock from "../models/stockModel";

const getPortfolio = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch portfolio data
    const userId = req.userId; // Assuming `req.user` is populated via middleware
    const user = await User.findById(userId).populate({
      path: "portfolio.stockId",
      model: Stock,
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const portfolio = user.portfolio.map((item) => {
      const stock = item.stockId as any;
      return {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        quantity: item.quantity,
        changePercent: stock.changePercent,
      };
    });
    const totalValue = portfolio.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    res.status(200).json({ portfolio, totalValue });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export default getPortfolio;
