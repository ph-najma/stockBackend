import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { IuserRepsitory } from "../repositories/userRepository";
import { IStockRepository } from "../repositories/stockrepository";
import { IOrderRepository } from "../repositories/orderRepository";
import { ITransactionRepository } from "../repositories/transactionRepository";
import { IStock } from "../models/stockModel";
import { ILimit } from "../models/limitModel";
import { IUser } from "../models/userModel";
import { IOrder } from "../models/orderModel";
import { ITransaction } from "../models/transactionModel";
import mongoose from "mongoose";
import { ILimitRepository } from "../repositories/limitRepository";
import { ILimitOrderQuery } from "../interfaces/OrderInterface";
import { IpromotionRepsoitory } from "../repositories/promotionRepository";
import { IPromotion } from "../models/promoModel";
dotenv.config();

export interface IAdminService {
  loginAdmin(email: string, password: string): Promise<{ token: string }>;
  getUserList(): Promise<IUser[]>;
  toggleUserBlockStatus(
    userId: string,
    token?: string
  ): Promise<{ message: string }>;
  getAllOrders(): Promise<IOrder[]>;
  getLimitOrders(query: ILimitOrderQuery): Promise<IOrder[]>;
  getMarketOrders(query: ILimitOrderQuery): Promise<IOrder[]>;
  getCompletedOrders(): Promise<IOrder[]>;
  getAllStocks(): Promise<IStock[]>;
  getAllTransactions(): Promise<ITransaction[]>;
  getUserPortfolio(userId: string): Promise<{
    user: {
      name: string | undefined;
      email: string | undefined;
      balance: number;
    };
    portfolio: {
      stock: IStock | null;
      quantity: number;
    }[];
  }>;
  getTotalFeesCollected(): Promise<number>;
  cancelOrder(orderId: string): Promise<IOrder | null>;
  updateLimit(limitData: ILimit): Promise<ILimit | null>;
  getLimits(): Promise<ILimit | null>;
  CreatePromotions(data: any): Promise<any>;
}
const tokenBlacklist = new Set<string>();

export class AdminService implements IAdminService {
  private userRepository: IuserRepsitory;
  private orderRepository: IOrderRepository;
  private stockRepository: IStockRepository;
  private transactionRepository: ITransactionRepository;
  private limitRepository: ILimitRepository;
  private promotionRepository: IpromotionRepsoitory;
  constructor(
    userRepository: IuserRepsitory,
    limitRepository: ILimitRepository,
    orderRepository: IOrderRepository,
    stockRepository: IStockRepository,
    transactionRepository: ITransactionRepository,
    promotionRepository: IpromotionRepsoitory
  ) {
    this.userRepository = userRepository;
    this.orderRepository = orderRepository;
    this.stockRepository = stockRepository;
    this.transactionRepository = transactionRepository;
    this.limitRepository = limitRepository;
    this.promotionRepository = promotionRepository;
  }

  // Admin Login
  async loginAdmin(
    email: string,
    password: string
  ): Promise<{ token: string }> {
    const existingUser = await this.userRepository.findAdminByEmail(email);
    if (!existingUser) {
      throw new Error("No such user");
    }

    const isMatch = await existingUser.comparePassword(password);
    if (!isMatch) {
      throw new Error("Invalid password");
    }

    const token = jwt.sign(
      { userId: existingUser._id },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    return { token };
  }

  // Get User List
  async getUserList(): Promise<IUser[]> {
    return await this.userRepository.findAllUsers();
  }

  // Disable or Enable User
  async toggleUserBlockStatus(
    userId: string,
    token?: string
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.is_Blocked = !user.is_Blocked;
    await this.userRepository.saveUser(user);

    if (token) {
      tokenBlacklist.add(token);
    }

    return {
      message: `${
        user.is_Blocked ? "Blocked" : "Unblocked"
      } user successfully.`,
    };
  }
  //Get All Orders
  async getAllOrders(): Promise<IOrder[]> {
    return this.orderRepository.getAllOrders();
  }
  //Get Limit Orders

  async getLimitOrders(query: ILimitOrderQuery) {
    query.orderType = "LIMIT";
    return this.orderRepository.findOrdersByType(query);
  }
  //Get Market Orders

  async getMarketOrders(query: ILimitOrderQuery) {
    query.orderType = "MARKET";
    return this.orderRepository.findOrdersByType(query);
  }
  //Get Completed Orders

  async getCompletedOrders(): Promise<IOrder[]> {
    return this.orderRepository.findCompletedOrders();
  }

  //Get All Stocks
  async getAllStocks(): Promise<IStock[]> {
    return this.stockRepository.getAllStocks();
  }

  //Get All Transactiosn
  async getAllTransactions(): Promise<ITransaction[]> {
    return this.transactionRepository.getAllTransactions();
  }

  //Get UserPortfolio
  async getUserPortfolio(userId: string) {
    console.log("hello from service");
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const user = await this.userRepository.findById(userObjectId);
    if (!user) {
      throw new Error("User not found");
    }
    const portfolio = user.portfolio as {
      stockId: mongoose.Types.ObjectId;
      quantity: number;
    }[];
    const portfolioDetails = await Promise.all(
      portfolio.map(async (item) => {
        const stockId = item.stockId; // Convert ObjectId to string
        const stock = await this.stockRepository.getStockById(stockId);
        return {
          stock,
          quantity: item.quantity,
        };
      })
    );
    return {
      user: {
        name: user.name,
        email: user.email,
        balance: user.balance,
      },
      portfolio: portfolioDetails,
    };
  }
  //Get Total Fees Collected
  async getTotalFeesCollected(): Promise<number> {
    return this.transactionRepository.getFeeCollectionSummary();
  }

  // Cancel Order
  async cancelOrder(orderId: string): Promise<IOrder | null> {
    return this.orderRepository.cancelOrder(orderId);
  }

  //Update the Limits
  async updateLimit(limitData: Partial<ILimit>): Promise<ILimit | null> {
    return await this.limitRepository.updateLimit(limitData);
  }
  //Get the Current Limits
  async getLimits(): Promise<ILimit | null> {
    return await this.limitRepository.getLimits();
  }

  async CreatePromotions(data: any): Promise<any> {
    return await this.promotionRepository.createPromotion(data);
  }
}
