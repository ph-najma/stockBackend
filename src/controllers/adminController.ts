import { Request, Response } from "express";
import { IAdminService } from "../services/adminService";
import Order from "../models/orderModel";
import transactionModel from "../models/transactionModel";
import { ILimitOrderQuery } from "../interfaces/OrderInterface";
import mongoose from "mongoose";
export class AdminController {
  private adminService: IAdminService;

  constructor(adminService: IAdminService) {
    this.adminService = adminService;
    this.login = this.login.bind(this);
    this.getUserList = this.getUserList.bind(this);
    this.disableUser = this.disableUser.bind(this);
    this.getStockList = this.getStockList.bind(this);
    this.softDeleteStock = this.softDeleteStock.bind(this);
    this.getAllOrders = this.getAllOrders.bind(this);
    this.getLimitOrders = this.getLimitOrders.bind(this);
    this.getMarketOrders = this.getMarketOrders.bind(this);
    this.getMatchedOrders = this.getMatchedOrders.bind(this);
    this.getOrderDetails = this.getOrderDetails.bind(this);
    this.getAllTransactions = this.getAllTransactions.bind(this);
    this.getUserPortfolio = this.getUserPortfolio.bind(this);
    this.getTotalFeesCollected = this.getTotalFeesCollected.bind(this);
    this.cancelOrder = this.cancelOrder.bind(this);
    this.updateLimit = this.updateLimit.bind(this);
    this.getLimits = this.getLimits.bind(this);
    this.CreatePromotions = this.CreatePromotions.bind(this);
  }

  // Admin Login
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const { token } = await this.adminService.loginAdmin(email, password);
      res.status(200).json({ message: "User logged in successfully", token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get User List
  public async getUserList(req: Request, res: Response): Promise<void> {
    try {
      const usersData = await this.adminService.getUserList();
      res.status(200).json(usersData);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Disable User
  public async disableUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const token = req.headers.authorization?.split(" ")[1];
      const result = await this.adminService.toggleUserBlockStatus(
        userId,
        token
      );
      res.status(200).json(result);
    } catch (error: any) {
      res
        .status(error.message === "User not found" ? 404 : 500)
        .json({ message: error.message });
    }
  }

  // Get Stock List
  public async getStockList(req: Request, res: Response): Promise<void> {
    try {
      const stocks = await this.adminService.getAllStocks();
      res.json(stocks);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error fetching stocks", error: error.message });
    }
  }

  // Soft Delete Stock
  public async softDeleteStock(req: Request, res: Response): Promise<void> {
    try {
      const stockId = req.params.id;
      const updatedStock = await this.adminService.toggleUserBlockStatus(
        stockId
      );
      res.status(200).json(updatedStock);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  // Get All Orders
  public async getAllOrders(req: Request, res: Response): Promise<void> {
    try {
      const orders = await this.adminService.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }

  // Get Limit Orders
  public async getLimitOrders(req: Request, res: Response): Promise<void> {
    try {
      const { status, user, dateRange } = req.query;
      const query: ILimitOrderQuery = { orderType: "LIMIT" };

      if (typeof status === "string" && status !== "all") {
        query.status = status;
      }

      if (user) {
        const userQuery = Array.isArray(user) ? user.join(" ") : user;
        if (typeof userQuery === "string") {
          query.user = { $regex: new RegExp(userQuery, "i") };
        }
      }

      if (dateRange) {
        const date = new Date(dateRange as string);
        query.createdAt = {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lte: new Date(date.setHours(23, 59, 59, 999)),
        };
      }

      const orders = await this.adminService.getLimitOrders(query);
      res.status(200).json(orders);
    } catch (error) {
      console.error("Error fetching limit orders:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }

  // Get Market Orders
  public async getMarketOrders(req: Request, res: Response): Promise<void> {
    try {
      const { status, user, dateRange } = req.query;
      const query: ILimitOrderQuery = { orderType: "MARKET" };

      if (typeof status === "string" && status !== "all") {
        query.status = status;
      }

      if (user) {
        const userQuery = Array.isArray(user) ? user.join(" ") : user;

        if (typeof userQuery === "string") {
          query.user = { $regex: new RegExp(userQuery, "i") };
        }
      }

      if (dateRange) {
        const date = new Date(dateRange as string);
        query.createdAt = {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lte: new Date(date.setHours(23, 59, 59, 999)),
        };
      }

      const orders = await this.adminService.getMarketOrders(query);
      res.status(200).json(orders);
    } catch (error) {
      console.error("Error fetching limit orders:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }

  // Matched Orders
  public async getMatchedOrders(req: Request, res: Response): Promise<void> {
    try {
      const orders = await Order.find({ status: "COMPLETED" })
        .populate("user", "name")
        .populate("stock", "symbol")
        .exec();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders", error });
    }
  }

  // Get Order Details
  public async getOrderDetails(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      const order = await Order.findById(orderId)
        .populate("user")
        .populate("stock")
        .exec();
      const transactions = await transactionModel
        .find({ $or: [{ buyOrder: orderId }, { sellOrder: orderId }] })
        .populate("buyer seller")
        .populate("stock")
        .exec();

      if (!order) {
        res.status(404).json({ message: "Order not found" });
      } else {
        res.json({ order, transactions });
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching order details", error });
    }
  }
  public async getAllTransactions(req: Request, res: Response): Promise<void> {
    const transactions = await this.adminService.getAllTransactions();
    res.json(transactions);
  }

  public async getUserPortfolio(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      console.log("hello from controller");
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: "Invalid User ID format" });
        console.log("not correct");
      }
      const portfolio = await this.adminService.getUserPortfolio(userId);
      res.status(200).json(portfolio);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
  public async getTotalFeesCollected(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const fees = await this.adminService.getTotalFeesCollected();
      res.status(200).json(fees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
  public async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = req.params.orderId;
      console.log(orderId, "from controller");
      const updatedOrder = await this.adminService.cancelOrder(orderId);
      res.status(200).json({
        message: "Order status updated to FAILED successfully",
        order: updatedOrder,
      });
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: error.message });
    }
  }
  public async updateLimit(req: Request, res: Response): Promise<void> {
    try {
      const limitData = req.body;
      console.log(req.body);
      const updatedLimit = await this.adminService.updateLimit(limitData);
      res.status(200).json(updatedLimit);
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: error.message });
    }
  }
  public async getLimits(req: Request, res: Response): Promise<void> {
    try {
      const limits = await this.adminService.getLimits();
      res.status(200).json(limits);
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: error.message });
    }
  }
  public async CreatePromotions(req: Request, res: Response): Promise<void> {
    try {
      const promotions = await this.adminService.CreatePromotions(req.body);
      res.status(201).json({
        success: true,
        message: "Promotion created successfully",
        promotions,
      });
    } catch (error: any) {
      console.error("Error creating promotion:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create promotion",
        error: error.message,
      });
    }
  }
}
