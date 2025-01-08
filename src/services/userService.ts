import { IuserRepsitory } from "../repositories/userRepository";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { sendEmail } from "../utils/sendEmail";
import { generateOTP } from "../utils/otpGenerator";
import { IUser } from "../models/userModel";
import { IOrder } from "../models/orderModel";
import { ITransaction } from "../models/transactionModel";
import { IOrderRepository } from "../repositories/orderRepository";
import { ITransactionRepository } from "../repositories/transactionRepository";
import { IStockRepository } from "../repositories/stockrepository";
import Stock, { IStock } from "../models/stockModel";
import { IpromotionRepsoitory } from "../repositories/promotionRepository";
import { IWatchlist } from "../models/watchlistModel";
import { IWatchlistRepository } from "../repositories/watchlistRepsoitory";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import crypto from "crypto";
import { UUID } from "crypto";
import {
  IPromotion,
  IReferralBonus,
  ISignupBonus,
  ILoyaltyRewards,
} from "../models/promoModel";

type ObjectId = mongoose.Types.ObjectId;

dotenv.config();

interface OtpStoreEntry {
  name?: string;
  email?: string;
  password?: string;
  otp?: string;
  otpExpiration?: number;
  userId?: string;
  refferedBy?: string;
}
export interface IUserService {
  signup(
    name: string,
    email: string,
    password: string,
    referralCode?: string
  ): Promise<void>;
  verifyOtp(otp: string): Promise<{ token: string }>;
  resendOtp(email: string): Promise<string>;
  login(email: string, password: string): Promise<{ token: string }>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
  home(): Promise<void>;
  getUserProfile(userId: string | undefined): Promise<IUser | null>;
  getUserPortfolio(userId: string | undefined): Promise<IUser | null>;
  getAllStocks(): Promise<IStock[]>;
  getStockById(userId: string | undefined): Promise<IStock | null>;
  placeOrder(
    user: ObjectId | undefined,
    stock: string,
    type: string,
    orderType: string,
    quantity: number,
    price: number,
    stopPrice: number,
    IsIntraday: Boolean | undefined
  ): Promise<IOrder | null>;
  getTransactions(userId: string | undefined): Promise<ITransaction[]>;
  updatePortfolioAfterSell(
    userId: string,
    stockId: string,
    quantityToSell: number
  ): Promise<IUser | null>;
  getMarketPrice(symbol: string): Promise<any>;
  getWatchlist(userId: string | undefined): Promise<IWatchlist | null>;
  ensureWatchlistAndAddStock(
    userId: string | undefined,
    stocksymbol: string
  ): Promise<IWatchlist>;
  getStockData(symbol: string | undefined): Promise<any>;
  getReferralCode(userId: string | undefined): Promise<string | undefined>;
  getOrders(userId: string | undefined): Promise<IOrder[] | null>;
  getUserProfileWithRewards(userId: string | undefined): Promise<IUser | null>;
}

const otpStore: Map<string, OtpStoreEntry> = new Map();

export class UserService implements IUserService {
  private userRepository: IuserRepsitory;
  private orderRepository: IOrderRepository;
  private transactionRepository: ITransactionRepository;
  private stockRepository: IStockRepository;
  private promotionRepository: IpromotionRepsoitory;
  private watchlistRepository: IWatchlistRepository;
  constructor(
    stockRepository: IStockRepository,
    userRepository: IuserRepsitory,
    transactionRepository: ITransactionRepository,
    orderRepository: IOrderRepository,
    promotionRepository: IpromotionRepsoitory,
    watchlistRepsoitory: IWatchlistRepository
  ) {
    this.userRepository = userRepository;
    this.orderRepository = orderRepository;
    this.transactionRepository = transactionRepository;
    this.stockRepository = stockRepository;
    this.promotionRepository = promotionRepository;
    this.watchlistRepository = watchlistRepsoitory;
  }

  // Sign up a new user
  async signup(
    name: string,
    email: string,
    password: string,
    referralCode?: string
  ): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const otp = generateOTP();
    const generatedReferralCode = crypto.randomBytes(4).toString("hex");
    otpStore.set(otp, { name, email, password, otp, refferedBy: referralCode });
    await sendEmail(email, otp);
  }

  // Verify OTP
  async verifyOtp(otp: string): Promise<{ token: string }> {
    const pendingUser = otpStore.get(otp);
    if (!pendingUser) {
      throw new Error("Invalid OTP");
    }
    const referredBy = pendingUser.refferedBy;

    const newUser = await this.userRepository.save({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
      referralCode: crypto.randomBytes(4).toString("hex"),
      referredBy,
    });
    otpStore.delete(otp);
    const promotion = await this.promotionRepository.findPromotion();
    if (promotion && promotion.signupBonus.enabled) {
      await this.userRepository.addSignupBonus(
        newUser._id.toString(),
        promotion._id.toString(),
        promotion.signupBonus.amount
      );
    }
    if (referredBy) {
      const referrer = await this.userRepository.findByRefferalCode(referredBy);
      if (referrer) {
        await this.userRepository.updateUserBalance(
          referrer._id.toString(),
          100
        ); // Example bonus
      }
    }
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    return { token };
  }
  //Resend OTP
  async resendOtp(email: string): Promise<string> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("User already registered");
    }

    // Find the pending OTP entry for the user
    const pendingUserEntry = Array.from(otpStore.values()).find(
      (entry) => entry.email === email
    );

    if (!pendingUserEntry) {
      throw new Error("No pending registration found for this email");
    }

    const newOtp = generateOTP();
    otpStore.set(newOtp, { ...pendingUserEntry, otp: newOtp });

    // Remove the old OTP entry for the same email
    otpStore.forEach((value, key) => {
      if (value.email === email && key !== newOtp) {
        otpStore.delete(key);
      }
    });

    await sendEmail(email, newOtp);

    return "OTP resent to email";
  }

  // Login user
  async login(email: string, password: string): Promise<{ token: string }> {
    console.log("heloo from service");
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error("No such user");
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      throw new Error("Invalid password");
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    return { token };
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    console.log("Entered forgotPassword method in service");
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      console.log("not uset");
      throw new Error("User not found");
    }
    console.log(user);

    const otp = generateOTP();
    const otpExpiration = Date.now() + 10 * 60 * 1000;

    otpStore.set(email, { userId: user._id.toString(), otp, otpExpiration });
    console.log("hello from backend service forgot pass");
    console.log(otpStore);
    await sendEmail(email, otp);
  }

  // Reset password
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<void> {
    const otpEntry = otpStore.get(email);

    if (
      !otpEntry ||
      otpEntry.otp !== otp ||
      otpEntry.otpExpiration! < Date.now()
    ) {
      throw new Error("Invalid or expired OTP");
    }
    console.log("hello from reset password");

    await this.userRepository.updatePassword(email, newPassword);
    otpStore.delete(email);
  }
  //Home
  async home(): Promise<void> {}

  //Get User Profle
  async getUserProfile(userId: string | undefined): Promise<IUser | null> {
    const user = await this.userRepository.findById(userId);
    console.log(user, "from service....");
    if (!user) {
      throw new Error("user not found");
    }
    return user;
  }

  //Get User Portfolio
  async getUserPortfolio(userId: string | undefined): Promise<IUser | null> {
    return await this.userRepository.getUserById(userId);
  }

  //Get All Stocks
  async getAllStocks() {
    return this.stockRepository.getAllStocks();
  }

  //Place an Order
  async placeOrder(
    user: ObjectId | undefined,
    stock: string,
    type: "BUY" | "SELL",
    orderType: "MARKET" | "LIMIT" | "STOP",
    quantity: number,
    price: number,
    stopPrice: number,
    isIntraday: Boolean | undefined
  ): Promise<IOrder | null> {
    const orderData: Partial<IOrder> = {
      user,
      stock,
      type,
      orderType,
      quantity,
      price,
      stopPrice,
      isIntraday,
    };

    const order = await this.orderRepository.createOrder(orderData);
    return order;
  }

  //Get Transactions of a user
  async getTransactions(userId: string | undefined): Promise<ITransaction[]> {
    console.log("User ID inside service:", userId);
    const transactions = await this.transactionRepository.getTransactions(
      userId
    );
    console.log("Transactions inside service:", transactions);
    return transactions;
  }
  //Get Stock By ID
  async getStockById(userId: string | undefined): Promise<IStock | null> {
    return await this.stockRepository.getStockById(userId);
  }

  async getWatchlist(userId: string | undefined): Promise<IWatchlist | null> {
    return await this.watchlistRepository.getByUserId(userId);
  }

  //Update User Portfolio After Sell
  async updatePortfolioAfterSell(
    userId: string,
    stockId: string,
    quantityToSell: number
  ): Promise<IUser | null> {
    return await this.userRepository.updatePortfolioAfterSell(
      userId,
      stockId,
      quantityToSell
    );
  }
  async getMarketPrice(symbol: string): Promise<any> {
    return this.stockRepository.getMarketPrice(symbol);
  }
  async ensureWatchlistAndAddStock(
    userId: string | undefined,
    stocksymbol: string
  ): Promise<IWatchlist> {
    console.log("hello from service");
    return this.watchlistRepository.ensureWatchlistAndAddStock(
      userId,
      stocksymbol
    );
  }
  async getStockData(symbol: string | undefined): Promise<any> {
    const stockData = await this.stockRepository.getStockData(symbol);
    const formattedData = stockData.map((stock) => ({
      time: stock.timestamp.getTime() / 1000, // Convert to seconds (Unix timestamp)
      open: stock.open,
      high: stock.high,
      low: stock.low,
      close: stock.close,
      volume: stock.volume,
    }));
    return formattedData;
  }
  async getReferralCode(
    userId: string | undefined
  ): Promise<string | undefined> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user.referralCode;
  }
  async getOrders(userId: string | undefined): Promise<IOrder[] | null> {
    const orders = await this.orderRepository.findOrders(userId);
    return orders;
  }
  async getUserProfileWithRewards(
    userId: string | undefined
  ): Promise<IUser | null> {
    try {
      // Fetch the user and their promotions
      const user = await this.userRepository.getPromotions(userId);
      if (user) {
        for (const promotion of user.promotions) {
          const promo = await this.promotionRepository.findPromotion();

          // Apply loyalty rewards if conditions are met
          if (promo && promo.loyaltyRewards.enabled) {
            if (user.balance >= promo.loyaltyRewards.tradingAmount) {
              user.balance += promo.loyaltyRewards.rewardAmount;
              console.log(
                `Loyalty reward applied: ${promo.loyaltyRewards.rewardAmount}`
              );
            }
          }
        }
        await user.save();
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
}
