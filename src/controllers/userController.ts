import { Request, Response } from "express";
import { UserService, IUserService } from "../services/userService";
import { use } from "passport";
import { IUser } from "../models/userModel";
import mongoose from "mongoose";
import Stock from "../models/stockModel";
export class UserController {
  private userService: IUserService;

  constructor(userService: IUserService) {
    this.userService = userService;
    this.signup = this.signup.bind(this);
    this.verifyOtp = this.verifyOtp.bind(this);
    this.resendOtp = this.resendOtp.bind(this);
    this.login = this.login.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
    this.home = this.home.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
    this.getUserportfolio = this.getUserportfolio.bind(this);
    this.plcaeOrder = this.plcaeOrder.bind(this);
    this.getTransaction = this.getTransaction.bind(this);
    this.getStockList = this.getStockList.bind(this);
    this.updatePortfolioAfterSell = this.updatePortfolioAfterSell.bind(this);
    this.getWatchlist = this.getWatchlist.bind(this);
    this.ensureWatchlistAndAddStock =
      this.ensureWatchlistAndAddStock.bind(this);
    this.getStockData = this.getStockData.bind(this);
    this.getReferralCode = this.getReferralCode.bind(this);
    this.getOrders = this.getOrders.bind(this);
    this.getPromotions = this.getPromotions.bind(this);
  }
  //signup
  async signup(req: Request, res: Response): Promise<void> {
    const { name, email, password } = req.body;
    try {
      await this.userService.signup(name, email, password);
      res.status(200).json({ message: "OTP sent to email", email });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //verify OTP
  async verifyOtp(req: Request, res: Response): Promise<void> {
    const { otp } = req.body;
    try {
      const result = await this.userService.verifyOtp(otp);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //Resend OTP
  async resendOtp(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    try {
      const message = await this.userService.resendOtp(email);
      res.status(200).json({ message });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //Login
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    try {
      const result = await this.userService.login(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //Forgot Password
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    try {
      await this.userService.forgotPassword(email);
      res.status(200).json({ message: "OTP sent to email", email });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //Reset Password
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { email, otp, newPassword } = req.body;
    try {
      await this.userService.resetPassword(email, otp, newPassword);
      res.status(200).json({ message: "Password reset successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //Home
  async home(req: Request, res: Response): Promise<void> {
    try {
      await this.userService.home();
      res.status(200).json({ message: "Home rendered successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  public async getStockList(req: Request, res: Response): Promise<void> {
    try {
      console.log("hello from controller");
      const stocks = await this.userService.getAllStocks();
      console.log(stocks);
      res.json(stocks);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error fetching stocks", error: error.message });
    }
  }
  //User Profile
  async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.getUserProfile(req.userId);
      console.log(user, "from controller of user profile");
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  //User Portfolio
  async getUserportfolio(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.getUserPortfolio(req.userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      let totalPortfolioValue = 0;
      let overallProfit = 0;
      let todaysProfit = 0;
      const updatedPortfolio = await Promise.all(
        user.portfolio.map(async (item) => {
          const stock = await this.userService.getStockById(
            item.stockId instanceof mongoose.Types.ObjectId
              ? item.stockId.toString()
              : item.stockId
          );
          if (!stock) return item;

          const stockValue = stock.price * item.quantity;
          const profit = stockValue - stock.open * item.quantity;
          const todaysChange = stock.changePercent;

          totalPortfolioValue += stockValue;
          overallProfit += profit;
          todaysProfit += (profit * parseFloat(todaysChange)) / 100;

          return {
            ...item,
            stockData: stock,
            currentValue: stockValue,
            overallProfit: profit,
            todaysProfit,
          };
        })
      );

      res.status(200).json({
        portfolio: updatedPortfolio,
        totalPortfolioValue,
        overallProfit,
        todaysProfit,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
  //placeOrder
  async plcaeOrder(req: Request, res: Response): Promise<void> {
    const { stock, type, orderType, quantity, price, stopPrice, isIntraday } =
      req.body;
    const user = req.userId
      ? new mongoose.Types.ObjectId(req.userId)
      : undefined;
    console.log(user);
    console.log(stock);
    const order = await this.userService.placeOrder(
      user,
      stock,
      type,
      orderType,
      quantity,
      price,
      stopPrice,
      isIntraday
    );
    res.json(order);
  }
  //Get Watchlist
  async getWatchlist(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const watchlist = await this.userService.getWatchlist(userId);
      res.json(watchlist);
    } catch (error: any) {
      res.status(500).json({ error: "Something went wrong" });
    }
  }

  //Transaction
  async getTransaction(req: Request, res: Response): Promise<void> {
    try {
      console.log("helloo from controller");
      console.log(req.userId);
      const transactions = await this.userService.getTransactions(req.userId);
      console.log(transactions);
      res.json(transactions);
    } catch (error) {
      console.error("Error in getTransaction:", error); // Log the error
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async updatePortfolioAfterSell(req: Request, res: Response): Promise<void> {
    try {
      const { userId, stockId, quantityToSell } = req.body;
      const updatedData = await this.userService.updatePortfolioAfterSell(
        userId,
        stockId,
        quantityToSell
      );
      res.json(updatedData);
    } catch (error) {
      console.error("Error in getTransaction:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async ensureWatchlistAndAddStock(req: Request, res: Response): Promise<void> {
    try {
      console.log("hello from controller");
      const userId = req.userId;
      const { stocks } = req.body;

      const stockId = stocks[0]?.stockId;
      console.log("from controller", req.body);

      const stock = await Stock.findOne({ symbol: stockId });
      console.log("stcok id:", stock);
      const updatedWathclist =
        await this.userService.ensureWatchlistAndAddStock(userId, stockId);
      res.json(updatedWathclist);
    } catch (error) {
      console.error("Error in getTransaction:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async getStockData(req: Request, res: Response): Promise<void> {
    try {
      const symbol = req.query.symbol;
      const updatedSymbol = symbol?.toString();
      const stockData = await this.userService.getStockData(updatedSymbol);
      res.status(200).json(stockData);
    } catch (error) {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
  async getReferralCode(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    const referralCode = await this.userService.getReferralCode(userId);
    res.status(200).json(referralCode);
  }
  async getOrders(req: Request, res: Response): Promise<void> {
    console.log(req.userId);
    const userId = req.userId;
    const orders = await this.userService.getOrders(userId);
    res.status(200).json(orders);
  }
  async getPromotions(req: Request, res: Response): Promise<void> {
    const userId = req.userId;
    const user = await this.userService.getUserProfileWithRewards(userId);
    res.status(200).json(user);
  }
}
