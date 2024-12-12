import { UserRepository } from "../repositories/userRepository";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { sendEmail } from "../utils/sendEmail";
import { generateOTP } from "../utils/otpGenerator";
import { IUser } from "../models/userModel";
import { IOrder } from "../models/orderModel";
import { OrderRepository } from "../repositories/orderRepository";

dotenv.config();

interface OtpStoreEntry {
  name?: string;
  email?: string;
  password?: string;
  otp?: string;
  otpExpiration?: number;
  userId?: string;
}

const otpStore: Map<string, OtpStoreEntry> = new Map();

export class UserService {
  private userRepository: UserRepository;
  private orderRepository: OrderRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.orderRepository = new OrderRepository();
  }

  // Sign up a new user
  async signup(name: string, email: string, password: string): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const otp = generateOTP();
    otpStore.set(otp, { name, email, password, otp });
    await sendEmail(email, otp);
  }

  // Verify OTP
  async verifyOtp(otp: string): Promise<{ token: string }> {
    const pendingUser = otpStore.get(otp);
    if (!pendingUser) {
      throw new Error("Invalid OTP");
    }

    const newUser = await this.userRepository.save({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.password,
    });
    otpStore.delete(otp);

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    return { token };
  }
  //Resnd OTP
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

  async home(): Promise<void> {}

  async getUserProfile(userId: string | undefined): Promise<IUser | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("user not found");
    }
    return user;
  }

  async getUserPortfolio(userId: string | undefined): Promise<IUser | null> {
    const portfolio = await this.userRepository.findById(userId);
    return portfolio;
  }

  async placeOrder(
    user: string,
    stock: string,
    type: string,
    orderType: string,
    quantity: number,
    price: number,
    stopPrice: number
  ): Promise<IOrder | null> {
    const order = await this.orderRepository.createOrder({
      user,
      stock,
      type,
      orderType,
      quantity,
      price,
      stopPrice,
    });
    return order;
  }
}
