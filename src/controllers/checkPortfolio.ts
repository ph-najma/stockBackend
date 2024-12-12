import { Request, Response } from "express";
import User from "../models/userModel";
import Stock from "../models/stockModel";

export const checkPortfolio = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, stockId, quantity, type } = req.body;

    const user = await User.findById(userId).populate("portfolio.stockId");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // For SELL Orders: Check if the user has enough stock
    if (type === "SELL") {
      const portfolioItem = user.portfolio.find(
        (item) => item.stockId === stockId
      );

      if (!portfolioItem || portfolioItem.quantity < quantity) {
        res.status(400).json({
          message: "Insufficient stock in portfolio for this sell order",
        });
        return;
      }
    }

    // For BUY Orders: Add additional checks for funds if needed
    // (For now, assuming there's no fund-check logic here.)

    res.status(200).json({ message: "Portfolio check passed" });
  } catch (error) {
    console.error("Error checking portfolio:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
