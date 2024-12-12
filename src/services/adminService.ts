import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UserRepository } from "../repositories/userRepository";
import { StockRepository } from "../repositories/stockrepository";
import { OrderRepository } from "../repositories/orderRepository";
dotenv.config();

export interface IAdminService {
  loginAdmin(email: string, password: string): Promise<{ token: string }>;
  getUserList(): Promise<any[]>;
  toggleUserBlockStatus(
    userId: string,
    token?: string
  ): Promise<{ message: string }>;
  getAllOrders(): Promise<any[]>;
  getLimitOrders(query: any): Promise<any[]>;
  getMarketOrders(query: any): Promise<any[]>;
  getCompletedOrders(): Promise<any[]>;
  getAllStocks(): Promise<any[]>;
}
const tokenBlacklist = new Set<string>();

export class AdminService implements IAdminService {
  private userRepository: UserRepository;
  private orderRepository: OrderRepository;
  private stockRepository: StockRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.orderRepository = new OrderRepository();
    this.stockRepository = new StockRepository();
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
  async getUserList(): Promise<any[]> {
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
  async getAllOrders() {
    return this.orderRepository.findOrdersByType({});
  }

  async getLimitOrders(query: any) {
    query.orderType = "LIMIT";
    return this.orderRepository.findOrdersByType(query);
  }

  async getMarketOrders(query: any) {
    query.orderType = "MARKET";
    return this.orderRepository.findOrdersByType(query);
  }

  async getCompletedOrders() {
    return this.orderRepository.findCompletedOrders();
  }
  async getAllStocks() {
    return this.stockRepository.getAllStocks();
  }
}
